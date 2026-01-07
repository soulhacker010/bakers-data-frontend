/**
 * Avatar Component - Generates unique avatars using Multiavatar
 * Each client gets a unique, consistent avatar based on their name/id
 */
import multiavatar from '@multiavatar/multiavatar'

export default function Avatar({ name, size = 48, className = '' }) {
    // Generate SVG avatar from the name string
    const svgCode = multiavatar(name || 'default')

    return (
        <div
            className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svgCode }}
        />
    )
}
