import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cloneElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// jsdom performs no layout, so ResponsiveContainer measures 0x0 and renders
// nothing at all. Give the chart a real size so assertions about its contents
// are not passing against an empty SVG.
vi.mock('recharts', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        ResponsiveContainer: ({ children }) => cloneElement(children, { width: 600, height: 300 }),
    }
})

vi.mock('../../services/wellness', () => ({
    getClientWellness: vi.fn(),
}))

vi.mock('../../context/ToastContext', () => ({
    useToast: () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }),
}))

import { getClientWellness } from '../../services/wellness'
import WellnessPanel from './WellnessPanel'

const wellness = {
    checkins: [
        { id: 1, created_at: '2026-08-18T14:00:00', mood_score: 2, support_choice: 'break' },
    ],
    mood_series: [
        { date: '2026-08-17', mood_score: 1 },
        { date: '2026-08-18', mood_score: 3 },
        { date: '2026-08-19', mood_score: 4 },
    ],
    top_supports: [],
}

const renderPanel = () =>
    render(
        <MemoryRouter>
            <WellnessPanel clientId={7} clientName="Jordan Miller" />
        </MemoryRouter>
    )

describe('WellnessPanel mood chart', () => {
    beforeEach(() => {
        getClientWellness.mockResolvedValue(wellness)
    })

    it('draws mood as bars, one per day', async () => {
        // Dena, 20 Aug 2026: "can wellness check data be shown as a bar graph
        // instead of a line graph per day?"
        const { container } = renderPanel()

        await waitFor(() => expect(screen.getByText('Mood Over Time')).toBeTruthy())
        await waitFor(() =>
            expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(3)
        )
    }, 20000)

    it('no longer draws the mood line', async () => {
        const { container } = renderPanel()

        await waitFor(() => expect(screen.getByText('Mood Over Time')).toBeTruthy())
        expect(container.querySelectorAll('.recharts-area-curve')).toHaveLength(0)
    }, 20000)

    it('renders a bar for the lowest mood as well as the highest', async () => {
        // Bars are drawn from the axis baseline, so the domain has to start at
        // 0 rather than at 1. On a 1-4 domain a check-in of "having a hard
        // time" would have no height and disappear — the worst day being the
        // one that vanishes off the chart.
        //
        // Asserted as a count rather than by measuring geometry: jsdom performs
        // no layout, and reaching into Recharts' own path markup would break on
        // any upgrade without telling us anything about our code.
        const { container } = renderPanel()

        await waitFor(() =>
            expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(
                wellness.mood_series.length
            )
        )
    }, 20000)
})
