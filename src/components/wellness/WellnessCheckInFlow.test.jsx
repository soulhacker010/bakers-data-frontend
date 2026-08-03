/**
 * Child-facing check-in flow tests.
 *
 * The flow is: landing -> mood -> (statement when the band has one) ->
 * (support when struggling) -> done, then ONE recordCheckin call with the
 * full payload. The inactivity timeout is wall-clock so a locked or
 * throttled tablet can't leave the screen stranded (the interval-timer
 * lesson).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('../../services/wellness', () => ({
    getStatementsForMood: vi.fn(),
    recordCheckin: vi.fn(),
}))

import { getStatementsForMood, recordCheckin } from '../../services/wellness'
import WellnessCheckInFlow from './WellnessCheckInFlow'

const STATEMENT = { id: 11, text: 'I am ready for today.', mood_band: 'positive' }

describe('WellnessCheckInFlow', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-08-03T10:00:00Z'))
        getStatementsForMood.mockReset()
        recordCheckin.mockReset()
        recordCheckin.mockResolvedValue({ id: 1, clinical_flag: false })
    })

    afterEach(() => vi.useRealTimers())

    const start = async () => {
        act(() => {
            screen.getByText(/START/i).click()
        })
    }

    it('happy path: good mood, yes to statement, no support question, single POST', async () => {
        getStatementsForMood.mockResolvedValueOnce([STATEMENT])
        const onDone = vi.fn()
        render(<WellnessCheckInFlow clientId={7} sessionId={3} onDone={onDone} />)

        await start()
        await act(async () => {
            screen.getByLabelText('positive').click()
        })
        expect(screen.getByText('I am ready for today.')).toBeInTheDocument()
        await act(async () => {
            screen.getByText(/YES/i).click()
        })

        // Straight to completion - no support question for a good mood + yes.
        expect(screen.getByText(/You did great/i)).toBeInTheDocument()
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

    it('low mood asks the support question and includes the choice in the payload', async () => {
        getStatementsForMood.mockResolvedValueOnce([
            { id: 22, text: 'I feel safe.', mood_band: 'low' },
        ])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('distressed').click()
        })
        expect(screen.getByText('I feel safe.')).toBeInTheDocument()
        await act(async () => {
            screen.getByText(/YES/i).click()
        })

        expect(screen.getByText(/What would help right now/i)).toBeInTheDocument()
        await act(async () => {
            screen.getByText(/quiet space/i).click()
        })

        expect(recordCheckin).toHaveBeenCalledWith({
            client_id: 7,
            session_id: null,
            mood_score: 1,
            statement_id: 22,
            statement_response: 'yes',
            support_requested: 'quiet_space',
        })
    })

    it('skips the statement screen gracefully when the band has no statements', async () => {
        getStatementsForMood.mockResolvedValueOnce([])
        render(<WellnessCheckInFlow clientId={7} sessionId={null} onDone={vi.fn()} />)

        await start()
        await act(async () => {
            screen.getByLabelText('okay').click()
        })

        // No statements for band -> mood-only check-in completes directly.
        expect(screen.getByText(/You did great/i)).toBeInTheDocument()
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
        getStatementsForMood.mockResolvedValueOnce([STATEMENT])
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
            const btn = screen.getByLabelText('positive')
            btn.click()
            btn.click()
        })
        expect(screen.getByText(/You did great/i)).toBeInTheDocument()
        expect(recordCheckin).toHaveBeenCalledTimes(1)
    })
})

