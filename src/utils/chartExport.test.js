/**
 * Tests for the chart PNG export helpers (the canvas raster step itself is
 * browser-only; these lock the serialization and naming contracts it feeds).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { chartFilename, serializeSvg, downloadChartPng, clientChartsFilename, stackLayout, downloadAllChartsPng } from './chartExport'

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

/**
 * Dena (BCBA, Cor Behavioral), 28 Oct 2026: "download all graphs per client".
 *
 * One file rather than one download per graph. A clinic attaching a learner's
 * progress to an insurance submission wants a single thing to attach, and ten
 * separate save prompts is the kind of help nobody asks for twice.
 */
describe('clientChartsFilename', () => {
    it('names the file after the learner and stamps the date', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-10-28T12:00:00Z'))
        expect(clientChartsFilename('Sophia P')).toBe('sophia_p_graphs_2026-10-28.png')
        expect(clientChartsFilename('')).toMatch(/^client_graphs_/)
        vi.useRealTimers()
    })
})

describe('stackLayout', () => {
    const sizes = [{ width: 600, height: 300 }, { width: 800, height: 200 }]

    it('is as wide as the widest chart, so none is cropped', () => {
        expect(stackLayout(sizes).width).toBe(800)
    })

    it('is tall enough for every chart, its caption and the page heading', () => {
        const { height } = stackLayout(sizes, { pageHeaderH: 50, captionH: 30, gap: 10 })

        // 50 page heading + (30 + 300) + 10 gap + (30 + 200)
        expect(height).toBe(620)
    })

    it('places each chart below the one before it', () => {
        const { positions } = stackLayout(sizes, { pageHeaderH: 50, captionH: 30, gap: 10 })

        expect(positions[0].y).toBe(50)
        expect(positions[1].y).toBe(390)
    })

    it('leaves out a chart with no size rather than failing the whole export', () => {
        // A collapsed or not-yet-rendered chart should cost its own place in
        // the file, not everyone else's.
        const { positions } = stackLayout([{ width: 600, height: 300 }, { width: 0, height: 0 }])

        expect(positions).toHaveLength(1)
    })

    it('has nothing to lay out when every chart is empty', () => {
        expect(stackLayout([{ width: 0, height: 0 }]).positions).toEqual([])
    })
})

describe('downloadAllChartsPng', () => {
    afterEach(() => vi.restoreAllMocks())

    it('rejects when the learner has no graphs to download', async () => {
        await expect(downloadAllChartsPng([], { title: 'Sophia P' })).rejects.toThrow(/no graphs/i)
    })

    it('rejects when none of the graphs are visible', async () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        await expect(downloadAllChartsPng([{ svg, title: 'Eye contact' }], { title: 'Sophia P' }))
            .rejects.toThrow(/not visible|no graphs/i)
    })
})
