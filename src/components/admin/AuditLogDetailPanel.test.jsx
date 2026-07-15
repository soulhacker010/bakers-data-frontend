/**
 * DOM tests for the audit-log detail panel: lazily fetches and renders the
 * FULL, unmasked entry (complete IP + device string).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('../../services/admin', () => ({
    getAuditLogDetail: vi.fn(),
}))

import { getAuditLogDetail } from '../../services/admin'
import AuditLogDetailPanel from './AuditLogDetailPanel'

const FULL_IP = '192.168.1.42'
const FULL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'

const DETAIL = {
    id: 5,
    user_id: 3,
    user_email: 'elaine.reyes2483@gmail.com',
    action: 'READ',
    resource_type: 'client',
    resource_id: 34,
    description: 'Client 34 read',
    ip_address: FULL_IP,
    user_agent: FULL_UA,
    created_at: '2026-07-14T21:19:00',
}

describe('AuditLogDetailPanel', () => {
    beforeEach(() => {
        getAuditLogDetail.mockReset()
    })

    it('fetches by id and shows the full unmasked IP + device', async () => {
        getAuditLogDetail.mockResolvedValueOnce(DETAIL)
        render(<AuditLogDetailPanel logId={5} />)

        await waitFor(() => expect(screen.getByText(FULL_IP)).toBeInTheDocument())
        expect(getAuditLogDetail).toHaveBeenCalledWith(5)
        expect(screen.getByText(FULL_UA)).toBeInTheDocument()
        expect(screen.getByText('elaine.reyes2483@gmail.com')).toBeInTheDocument()
        expect(screen.getByText('Client 34 read')).toBeInTheDocument()
    })

    it('shows an error state when the fetch fails', async () => {
        getAuditLogDetail.mockRejectedValueOnce(new Error('boom'))
        render(<AuditLogDetailPanel logId={5} />)
        await waitFor(() =>
            expect(screen.getByText(/couldn't load this log entry/i)).toBeInTheDocument()
        )
    })
})
