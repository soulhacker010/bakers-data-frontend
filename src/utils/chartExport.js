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
