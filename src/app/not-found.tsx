import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 select-none">
                404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Page Not Found
            </h2>
            <p className="text-slate-400 max-w-md mb-8">
                Oops! The page you&apos;re looking for seems to have vanished into the digital void.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium"
                >
                    <Home className="w-4 h-4" />
                    Back Home
                </Link>
            </div>
        </div>
    );
}
