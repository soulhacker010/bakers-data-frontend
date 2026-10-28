/**
 * Chart image export — turns the on-screen recharts SVG into a downloadable
 * PNG with a white background and a small header (program + context line),
 * so clinics can attach the actual graph to insurance submissions instead of
 * a raw CSV.
 */

/** Filename like `washing_hands_graph_2026-07-18.png`. */
export function chartFilename(programName) {
    const slug = String(programName || 'program')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'program'
    return `${slug}_graph_${new Date().toISOString().slice(0, 10)}.png`
}

/** Serialize the live SVG with explicit size + namespace so it renders standalone. */
export function serializeSvg(svgEl) {
    const rect = svgEl.getBoundingClientRect()
    const width = rect.width || Number(svgEl.getAttribute('width')) || 0
    const height = rect.height || Number(svgEl.getAttribute('height')) || 0
    const clone = svgEl.cloneNode(true)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', width)
    clone.setAttribute('height', height)
    return { markup: new XMLSerializer().serializeToString(clone), width, height }
}

const HEADER_H = 64
const SCALE = 2 // 2x for crisp print/screenshot quality

/**
 * Render the chart SVG to a PNG (with header) and trigger a download.
 * Throws with a user-presentable message on failure.
 */
export async function downloadChartPng(svgEl, { title, subtitle } = {}) {
    if (!svgEl) throw new Error('No chart to download yet')
    const { markup, width, height } = serializeSvg(svgEl)
    if (!width || !height) throw new Error('Chart is not visible')

    const canvas = document.createElement('canvas')
    canvas.width = width * SCALE
    canvas.height = (height + HEADER_H) * SCALE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser cannot generate images')

    const svgUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
    try {
        const img = new Image()
        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = () => reject(new Error('Could not render the chart'))
            img.src = svgUrl
        })

        ctx.scale(SCALE, SCALE)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height + HEADER_H)
        if (title) {
            ctx.fillStyle = '#111827'
            ctx.font = '700 20px Arial, sans-serif'
            ctx.fillText(title, 16, 30)
        }
        if (subtitle) {
            ctx.fillStyle = '#6B7280'
            ctx.font = '400 13px Arial, sans-serif'
            ctx.fillText(subtitle, 16, 52)
        }
        ctx.drawImage(img, 0, HEADER_H, width, height)

        const blob = await new Promise((resolve, reject) =>
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png')
        )
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = chartFilename(title)
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    } finally {
        URL.revokeObjectURL(svgUrl)
    }
}

/**
 * Downloading every graph a learner has, as one file.
 *
 * Dena (BCBA, Cor Behavioral), 28 Oct 2026: "download all graphs per client".
 *
 * One file rather than one download per graph. A clinic attaching a learner's
 * progress to an insurance submission wants a single thing to attach, and ten
 * separate save prompts is the kind of help nobody asks for twice.
 */

/** Filename like `sophia_p_graphs_2026-10-28.png`. */
export function clientChartsFilename(clientName) {
    const slug = String(clientName || 'client')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'client'
    return `${slug}_graphs_${new Date().toISOString().slice(0, 10)}.png`
}

const PAGE_HEADER_H = 64
const CAPTION_H = 34
const GAP = 24

/**
 * Where each chart sits in the stacked image, and how big the sheet must be.
 *
 * A chart with no size is left out rather than failing the export: one
 * collapsed or not-yet-rendered graph should cost its own place in the file,
 * not everybody else's.
 */
export function stackLayout(sizes, opts = {}) {
    const pageHeaderH = opts.pageHeaderH ?? PAGE_HEADER_H
    const captionH = opts.captionH ?? CAPTION_H
    const gap = opts.gap ?? GAP

    const drawable = (sizes || []).filter((s) => s && s.width > 0 && s.height > 0)
    if (!drawable.length) return { width: 0, height: 0, positions: [] }

    let y = pageHeaderH
    const positions = drawable.map((size, index) => {
        if (index > 0) y += gap
        const at = { ...size, y, captionY: y, chartY: y + captionH }
        y += captionH + size.height
        return at
    })

    return {
        width: Math.max(...drawable.map((s) => s.width)),
        height: y,
        positions,
    }
}

/** Rasterise one serialized SVG, ready to be drawn into a bigger canvas. */
async function loadSvgImage(markup) {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }))
    try {
        const img = new Image()
        await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = () => reject(new Error('Could not render the chart'))
            img.src = url
        })
        return img
    } finally {
        URL.revokeObjectURL(url)
    }
}

/**
 * Render every chart into one tall PNG and trigger a single download.
 *
 * @param {Array<{svg: SVGElement, title: string}>} charts
 * @param {{title: string, subtitle?: string}} page - the learner and context
 */
export async function downloadAllChartsPng(charts, { title, subtitle } = {}) {
    const list = (charts || []).filter((c) => c && c.svg)
    if (!list.length) throw new Error('There are no graphs to download yet')

    const rendered = list.map((c) => ({ ...c, ...serializeSvg(c.svg) }))
    const layout = stackLayout(rendered)
    if (!layout.positions.length) throw new Error('The graphs are not visible yet')

    // Only the charts that earned a place in the layout are drawn.
    const drawable = rendered.filter((r) => r.width > 0 && r.height > 0)

    const canvas = document.createElement('canvas')
    canvas.width = layout.width * SCALE
    canvas.height = layout.height * SCALE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('This browser cannot generate images')

    ctx.scale(SCALE, SCALE)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, layout.width, layout.height)

    if (title) {
        ctx.fillStyle = '#111827'
        ctx.font = '700 22px Arial, sans-serif'
        ctx.fillText(title, 16, 32)
    }
    if (subtitle) {
        ctx.fillStyle = '#6B7280'
        ctx.font = '400 13px Arial, sans-serif'
        ctx.fillText(subtitle, 16, 54)
    }

    for (let i = 0; i < drawable.length; i++) {
        const chart = drawable[i]
        const at = layout.positions[i]
        const img = await loadSvgImage(chart.markup)

        ctx.fillStyle = '#111827'
        ctx.font = '700 15px Arial, sans-serif'
        ctx.fillText(chart.title || 'Program', 16, at.captionY + 20)
        ctx.drawImage(img, 0, at.chartY, chart.width, chart.height)
    }

    const blob = await new Promise((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create the image'))), 'image/png')
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = clientChartsFilename(title)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}
