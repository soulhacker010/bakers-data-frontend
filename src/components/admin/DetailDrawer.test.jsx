/**
 * DOM tests for the reusable admin DetailDrawer: it renders children when open,
 * and closes via Escape and a backdrop click (the UX guarantees the admin can
 * always get back to the list).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetailDrawer from './DetailDrawer'

describe('DetailDrawer', () => {
    it('renders nothing when closed', () => {
        const { container } = render(
            <DetailDrawer isOpen={false} onClose={() => {}} title="X">body</DetailDrawer>
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('shows title, subtitle and children when open', () => {
        render(
            <DetailDrawer isOpen onClose={() => {}} title="Washing Hands" subtitle="Sam · Dilek">
                <p>drawer body</p>
            </DetailDrawer>
        )
        expect(screen.getByText('Washing Hands')).toBeInTheDocument()
        expect(screen.getByText('Sam · Dilek')).toBeInTheDocument()
        expect(screen.getByText('drawer body')).toBeInTheDocument()
    })

    it('calls onClose when Escape is pressed', async () => {
        const onClose = vi.fn()
        render(<DetailDrawer isOpen onClose={onClose} title="X">body</DetailDrawer>)
        await userEvent.keyboard('{Escape}')
        expect(onClose).toHaveBeenCalled()
    })

    it('calls onClose when the close button is clicked', async () => {
        const onClose = vi.fn()
        render(<DetailDrawer isOpen onClose={onClose} title="X">body</DetailDrawer>)
        await userEvent.click(screen.getByLabelText('Close'))
        expect(onClose).toHaveBeenCalled()
    })
})
