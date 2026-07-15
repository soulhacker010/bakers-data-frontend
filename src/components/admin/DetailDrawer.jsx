import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable slide-in detail drawer for the admin dashboard.
 *
 * Slides in from the right over a dimmed backdrop, keeping the list visible
 * underneath so closing returns the admin to exactly where they were. Closes on
 * Escape or a backdrop click, and locks background scroll while open.
 *
 * Generic on purpose - Programs use it now; Therapists and Clients reuse it.
 */
export default function DetailDrawer({ isOpen, onClose, title, subtitle, children }) {
    // Drives the enter transition: mount, then flip to the on-screen position.
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const raf = requestAnimationFrame(() => setShow(true));
            return () => cancelAnimationFrame(raf);
        }
        setShow(false);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                role="dialog"
                aria-modal="true"
                className={`absolute top-0 right-0 h-full w-full max-w-xl bg-gray-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${show ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 bg-white">
                    <div className="min-w-0">
                        <h2 className="font-heading text-xl font-bold text-gray-900 truncate">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
