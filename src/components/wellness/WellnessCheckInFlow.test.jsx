/**
 * Child-facing check-in flow tests, per the client's prompt-library document:
 * welcome -> labeled mood buttons -> one routed statement -> support question
 * ONLY when mood is low AND the answer was "Not right now" -> done, then ONE
 * recordCheckin call. The inactivity timeout is wall-clock so a locked or
 * throttled tablet can't leave the screen stranded (the interval-timer
 * lesson).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('../../services/wellness', () => ({
    getStatementsForMood: vi.fn(),
    getSupportOptions: vi.fn(),
    recordCheckin: vi.fn(),
}))

import { getStatementsForMood, getSupportOptions, recordCheckin } from '../../services/wellness'
import WellnessCheckInFlow from './WellnessCheckInFlow'

const READY = { id: 11, text: 'I feel ready for the session today.', domain: 'emotional_readiness' }
const SAFE = { id: 22, text: 'I feel safe.', domain: 'safety' }
const OPTIONS = [
    { key: 'break', label: "I'd like a break.", emoji: '🧸' },
    { key: 'quiet_space', label: "I'd like a quieter space.", emoji: '🤫' },
]

describe('WellnessCheckInFlow', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-03T10:00:00Z'))
        getStatementsForMood.mockReset()
        getSupportOptions.mockReset()
        getSupportOptions.mockResolvedValue(OPTIONS)
        recordCheckin.mockReset()
        recordCheckin.mockResolvedValue({ id: 1, clinical_flag: false })
    })

    afterEach(() => vi.useRealTimers())

    const start = async () => {
        act(() => {
            screen.getByText('Start').click()
        })
    }

    it('happy path: feeling good, yes to statement, no support question, single POST', async () => {
        getStatementsForMood.mockResolvedValueOnce([READY])
        render(<WellnessCheckInFlow clientId={7} sessionId={3} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('feeling good').click()
        })
        expect(screen.getByText('I feel ready for the session today.')).toBeInTheDocument()
        await act(async () => {
            screen.getByText('Yes').click()
        })

        expect(screen.getByText(/Thanks for checking in today/i)).toBeInTheDocument()
        expect(recordCheckin).toHaveBeenCalledTimes(1)
        expect(recordCheckin).toHaveBeenCalledWith({
            client_id: 7,
            session_id: 3,
            mood_score: 4,
            statement_id: 11,
            statement_response: 'yes',
            support_requested: null,
        })
    })

    it('low mood + Not right now shows the support question (the document rule)', async () => {
        getStatementsForMood.mockResolvedValueOnce([SAFE])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('having a hard time').click()
        })
        expect(screen.getByText('I feel safe.')).toBeInTheDocument()
        await act(async () => {
            screen.getByText('Not right now').click()
        })

        expect(screen.getByText(/What would help right now/i)).toBeInTheDocument()
        await act(async () => {
            screen.getByText(/quieter space/i).click()
        })

        expect(recordCheckin).toHaveBeenCalledWith({
            client_id: 7,
            session_id: null,
            mood_score: 1,
            statement_id: 22,
            statement_response: 'not_right_now',
            support_requested: 'quiet_space',
        })
    })

    it('low mood + Yes skips the support question (AND rule, not OR)', async () => {
        getStatementsForMood.mockResolvedValueOnce([SAFE])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('having a hard time').click()
        })
        await act(async () => {
            screen.getByText('Yes').click()
        })

        expect(screen.queryByText(/What would help right now/i)).not.toBeInTheDocument()
        expect(recordCheckin).toHaveBeenCalledWith({
            client_id: 7,
            session_id: null,
            mood_score: 1,
            statement_id: 22,
            statement_response: 'yes',
            support_requested: null,
        })
    })

    it('good mood + Not right now still skips the support question', async () => {
        getStatementsForMood.mockResolvedValueOnce([READY])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('feeling good').click()
        })
        await act(async () => {
            screen.getByText('Not right now').click()
        })

        expect(screen.queryByText(/What would help right now/i)).not.toBeInTheDocument()
        expect(recordCheckin).toHaveBeenCalledWith({
            client_id: 7,
            session_id: null,
            mood_score: 4,
            statement_id: 11,
            statement_response: 'not_right_now',
            support_requested: null,
        })
    })

    it('empty statement library completes as a mood-only check-in', async () => {
        getStatementsForMood.mockResolvedValueOnce([])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('doing okay').click()
        })

        expect(screen.getByText(/Thanks for checking in today/i)).toBeInTheDocument()
        expect(recordCheckin).toHaveBeenCalledWith({
            client_id: 7,
            session_id: null,
            mood_score: 3,
            statement_id: null,
            statement_response: null,
            support_requested: null,
        })
    })

    it('inactivity timeout is wall-clock: time jump + visibilitychange abandons the flow', async () => {
        getStatementsForMood.mockResolvedValueOnce([READY])
        const onDone = vi.fn()
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={onDone} />)
        await start()

        // Tablet sat untouched: clock advances past the timeout with no ticks.
        act(() => {
            vi.setSystemTime(new Date('2026-08-03T10:03:00Z'))
            document.dispatchEvent(new Event('visibilitychange'))
        })

        expect(onDone).toHaveBeenCalledWith({ abandoned: true })
        expect(recordCheckin).not.toHaveBeenCalled()
    })

    it('double-tapping an answer records only one check-in', async () => {
        getStatementsForMood.mockResolvedValueOnce([])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)
        await start()
        await act(async () => {
            const btn = screen.getByLabelText('feeling good')
            btn.click()
            btn.click()
        })
        expect(screen.getByText(/Thanks for checking in today/i)).toBeInTheDocument()
        expect(recordCheckin).toHaveBeenCalledTimes(1)
    })
})
