'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            <div className="bg-red-500/10 p-4 rounded-full mb-6 border border-red-500/20">
                <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Something went wrong!
            </h2>
            <p className="text-slate-400 max-w-md mb-8">
                We encountered an unexpected error. Our team has been notified.
            </p>

            <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black hover:bg-slate-200 transition-all font-medium"
            >
                <RefreshCw className="w-4 h-4" />
                Try again
            </button>

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-black/50 rounded-lg border border-white/10 text-left max-w-2xl w-full overflow-auto max-h-48">
                    <p className="text-red-400 font-mono text-xs">{error.message}</p>
                    <pre className="text-slate-500 font-mono text-[10px] mt-2">{error.stack}</pre>
                </div>
            )}
        </div>
    );
}
