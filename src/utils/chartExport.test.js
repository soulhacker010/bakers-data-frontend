/**
 * Tests for the chart PNG export helpers (the canvas raster step itself is
 * browser-only; these lock the serialization and naming contracts it feeds).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { chartFilename, serializeSvg, downloadChartPng } from './chartExport'

describe('chartFilename', () => {
    it('slugifies the program name and stamps the date', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-07-18T12:00:00Z'))
        expect(chartFilename("Max: I'd body parts")).toBe('max_i_d_body_parts_graph_2026-07-18.png')
        expect(chartFilename('')).toMatch(/^program_graph_/)
        vi.useRealTimers()
    })
})

describe('serializeSvg', () => {
    it('produces standalone markup with explicit namespace and size', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.setAttribute('width', '640')
        svg.setAttribute('height', '320')
        const { markup, width, height } = serializeSvg(svg)
        expect(width).toBe(640)
        expect(height).toBe(320)
        expect(markup).toContain('xmlns="http://www.w3.org/2000/svg"')
        expect(markup).toContain('width="640"')
    })
})

describe('downloadChartPng', () => {
    afterEach(() => vi.restoreAllMocks())

    it('rejects with a user-presentable error when there is no chart', async () => {
        await expect(downloadChartPng(null)).rejects.toThrow(/No chart/)
    })

    it('rejects when the chart has no size (not visible)', async () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        await expect(downloadChartPng(svg)).rejects.toThrow(/not visible/)
    })
})
