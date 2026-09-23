/**
 * Dena (BCBA, Cor Behavioral), 22 Sept 2026:
 *   "The inability to completely delete data points or modify a data point
 *    from the graph (BCBA level)"
 *
 * Correcting and removing a value already existed on the session page. A
 * supervisor reviewing a graph was not there, and had a date rather than a
 * session, so the work was unreachable rather than missing. This is the way in.
 *
 * Every control here is checked again on the server. Hiding one is a courtesy
 * so nobody is offered an action that can only be refused, never a boundary.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../services/analytics', () => ({
    getProgramDayEntries: vi.fn(),
}))
vi.mock('../../services/sessions', () => ({
    editSessionData: vi.fn(() => Promise.resolve({})),
    deleteSessionData: vi.fn(() => Promise.resolve()),
}))
vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }),
}))

import DayEntriesModal from './DayEntriesModal'
import { getProgramDayEntries } from '../../services/analytics'
import { editSessionData, deleteSessionData } from '../../services/sessions'

const trial = (over = {}) => ({
    id: 11,
    session_id: 3,
    timestamp: '2026-09-22T10:15:00',
    data_type: 'trial',
    result: 'correct',
    target_name: 'Looks at speaker',
    recorded_by: 'Aliza Ilan',
    is_summary: false,
    ...over,
})

const bcba = { role: 'bcba' }
const coordinator = { role: 'coordinator' }
const therapist = { role: 'therapist' }

function open(user = bcba, entries = [trial()], onChanged = vi.fn()) {
    getProgramDayEntries.mockResolvedValue({ program_id: 1, date: '2026-09-22', entries })
    render(
        <DayEntriesModal
            programId={1}
            date="2026-09-22"
            dateLabel="Sep 22"
            user={user}
            onClose={vi.fn()}
            onChanged={onChanged}
        />
    )
    return onChanged
}

beforeEach(() => vi.clearAllMocks())

describe('showing what is behind the point', () => {
    it('lists the values recorded that day', async () => {
        open()

        expect(await screen.findByText(/correct/i)).toBeInTheDocument()
    })

    it('names the behaviour and who scored it, so the right one can be corrected', async () => {
        open()

        expect(await screen.findByText(/looks at speaker/i)).toBeInTheDocument()
        expect(screen.getByText(/aliza ilan/i)).toBeInTheDocument()
    })

    it('says so plainly when the day holds nothing', async () => {
        open(bcba, [])

        expect(await screen.findByText(/nothing was recorded/i)).toBeInTheDocument()
    })
})

describe('who is offered the controls', () => {
    it('offers a BCBA both correcting and removing', async () => {
        open(bcba)

        expect(await screen.findByRole('button', { name: /correct/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
    })

    it('offers a coordinator correcting but not removing', async () => {
        // Removing is destructive, and is supervisory rather than data entry.
        open(coordinator)

        expect(await screen.findByRole('button', { name: /correct/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    })

    it('offers a therapist neither, and says why', async () => {
        open(therapist)

        await screen.findByText(/looks at speaker/i)
        expect(screen.queryByRole('button', { name: /correct/i })).not.toBeInTheDocument()
        expect(screen.getByText(/only BCBAs|supervisor/i)).toBeInTheDocument()
    })
})

describe('correcting a value', () => {
    it('will not save without a reason, because the reason is the audit trail', async () => {
        open()

        fireEvent.click(await screen.findByRole('button', { name: /correct/i }))
        fireEvent.click(screen.getByRole('button', { name: /save/i }))

        await waitFor(() => expect(screen.getByText(/reason/i)).toBeInTheDocument())
        expect(editSessionData).not.toHaveBeenCalled()
    })

    it('sends the new value and the reason', async () => {
        open()

        fireEvent.click(await screen.findByRole('button', { name: /correct/i }))
        fireEvent.change(screen.getByLabelText(/value/i), { target: { value: 'incorrect' } })
        fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'scored the wrong key' } })
        fireEvent.click(screen.getByRole('button', { name: /save/i }))

        await waitFor(() => expect(editSessionData).toHaveBeenCalled())
        const [id, payload] = editSessionData.mock.calls.at(-1)
        expect(id).toBe(11)
        expect(payload.result).toBe('incorrect')
        expect(payload.edit_reason).toBe('scored the wrong key')
    })

    it('corrects a typed percentage as a percentage, not as a result', async () => {
        // Dena's own example: a 60% entered for a past day, changed to 80%.
        open(bcba, [trial({ data_type: 'trial', result: null, is_summary: true, summary_percentage: 60 })])

        fireEvent.click(await screen.findByRole('button', { name: /correct/i }))
        fireEvent.change(screen.getByLabelText(/value/i), { target: { value: '80' } })
        fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'corrected from the paper sheet' } })
        fireEvent.click(screen.getByRole('button', { name: /save/i }))

        await waitFor(() => expect(editSessionData).toHaveBeenCalled())
        const [, payload] = editSessionData.mock.calls.at(-1)
        expect(payload.summary_percentage).toBe(80)
    })

    it('tells the graph to redraw once a value has changed', async () => {
        const onChanged = open()

        fireEvent.click(await screen.findByRole('button', { name: /correct/i }))
        fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'scored the wrong key' } })
        fireEvent.click(screen.getByRole('button', { name: /save/i }))

        await waitFor(() => expect(onChanged).toHaveBeenCalled())
    })
})

describe('removing a value', () => {
    it('will not remove without a reason either', async () => {
        open()

        fireEvent.click(await screen.findByRole('button', { name: /remove/i }))
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

        await waitFor(() => expect(deleteSessionData).not.toHaveBeenCalled())
    })

    it('removes the entry once a reason is given', async () => {
        open()

        fireEvent.click(await screen.findByRole('button', { name: /remove/i }))
        fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'recorded on the wrong client' } })
        fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

        await waitFor(() => expect(deleteSessionData).toHaveBeenCalledWith(11, 'recorded on the wrong client'))
    })
})
