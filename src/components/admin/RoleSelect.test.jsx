import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

vi.mock('../../services/admin', () => ({
    setUserRole: vi.fn(),
}))

import { setUserRole } from '../../services/admin'
import { ToastProvider } from '../../context/ToastContext'
import RoleSelect from './RoleSelect'

const renderSelect = (props) =>
    render(
        <ToastProvider>
            <RoleSelect userId={7} {...props} />
        </ToastProvider>
    )

describe('RoleSelect', () => {
    beforeEach(() => {
        setUserRole.mockReset()
        setUserRole.mockResolvedValue({})
    })

    it('shows the role the account currently holds', () => {
        renderSelect({ role: 'bcba' })
        expect(screen.getByRole('combobox').value).toBe('bcba')
    })

    it('matches a capitalised role from an older account', () => {
        renderSelect({ role: 'Therapist' })
        expect(screen.getByRole('combobox').value).toBe('therapist')
    })

    it('assigns the chosen role and reports it back', async () => {
        const onChanged = vi.fn()
        renderSelect({ role: 'rbt', onChanged })

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'coordinator' } })

        await waitFor(() => expect(setUserRole).toHaveBeenCalledWith(7, 'coordinator'))
        await waitFor(() => expect(onChanged).toHaveBeenCalledWith('coordinator'))
    })

    it('does nothing when the role is unchanged', async () => {
        renderSelect({ role: 'bcba' })
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bcba' } })
        expect(setUserRole).not.toHaveBeenCalled()
    })

    it('offers coordinator', () => {
        renderSelect({ role: 'rbt' })
        expect(screen.getByRole('option', { name: /coordinator/i })).toBeInTheDocument()
    })

    it('does not report a role it cannot recognise as the first option', () => {
        // Accounts predate this list. Falling through to the first option would
        // display someone as a BCBA, which an admin could then save by accident.
        renderSelect({ role: 'legacy-role' })
        expect(screen.getByRole('combobox').value).not.toBe('bcba')
        expect(screen.getByText(/not recognised/i)).toBeInTheDocument()
    })

    it('handles an account with no role at all', () => {
        renderSelect({ role: null })
        expect(screen.getByText(/no role set/i)).toBeInTheDocument()
    })

    it('does not trigger the surrounding row when clicked', () => {
        // In the therapists table each row opens a drawer on click. Without
        // stopping propagation, reaching for the dropdown would open the drawer
        // over the top of it.
        const onRowClick = vi.fn()
        render(
            <ToastProvider>
                <div onClick={onRowClick}>
                    <RoleSelect userId={7} role="rbt" compact />
                </div>
            </ToastProvider>
        )

        fireEvent.click(screen.getByRole('combobox'))
        expect(onRowClick).not.toHaveBeenCalled()
    })

    it('keeps the row closed while changing the role', async () => {
        const onRowClick = vi.fn()
        render(
            <ToastProvider>
                <div onClick={onRowClick}>
                    <RoleSelect userId={7} role="rbt" compact />
                </div>
            </ToastProvider>
        )

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bcba' } })
        await waitFor(() => expect(setUserRole).toHaveBeenCalled())
        expect(onRowClick).not.toHaveBeenCalled()
    })

    it('leaves the displayed role alone when saving fails', async () => {
        setUserRole.mockRejectedValueOnce(new Error('nope'))
        const onChanged = vi.fn()
        renderSelect({ role: 'rbt', onChanged })

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bcba' } })

        await waitFor(() => expect(setUserRole).toHaveBeenCalled())
        expect(onChanged).not.toHaveBeenCalled()
    })
})
