import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext()

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now()
        const newToast = { id, message, type }

        setToasts(prev => [...prev, newToast])

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }

        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    // Convenience methods. MUST be referentially stable: pages put `toast`
    // in fetch-effect deps, so a new identity per render turns one failed
    // fetch into an infinite fetch -> error-toast -> refetch loop.
    const toast = useMemo(() => ({
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration ?? 6000), // Errors stay longer
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    }), [addToast])

    const contextValue = useMemo(() => ({ toast, removeToast }), [toast, removeToast])

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    )
}

function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    )
}

function Toast({ toast, onClose }) {
    const icons = {
        success: <CheckCircle size={20} className="text-green-500 flex-shrink-0" />,
        error: <XCircle size={20} className="text-red-500 flex-shrink-0" />,
        warning: <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />,
        info: <Info size={20} className="text-blue-500 flex-shrink-0" />,
    }

    const backgrounds = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-amber-50 border-amber-200',
        info: 'bg-blue-50 border-blue-200',
    }

    return (
        <div
            className={`
                pointer-events-auto
                flex items-start gap-3 p-4 rounded-xl border shadow-lg
                ${backgrounds[toast.type]}
                animate-slide-in-right
            `}
        >
            {icons[toast.type]}
            <p className="text-gray-800 text-sm font-medium flex-1">{toast.message}</p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
                <X size={16} />
            </button>
        </div>
    )
}

export default ToastProvider
