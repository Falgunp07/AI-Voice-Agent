'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    Square,
    Bot,
    Clock,
    MessageSquare,
} from 'lucide-react';

type CallState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'ended';

interface TranscriptEntry {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface CallPageProps {
    onBack: () => void;
}

export default function CallPage({ onBack }: CallPageProps) {
    const [callState, setCallState] = useState<CallState>('idle');
    const [isMuted, setIsMuted] = useState(false);
    const [speakerOn, setSpeakerOn] = useState(true);
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [currentText, setCurrentText] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [showTranscript, setShowTranscript] = useState(false);
    const [sessionId] = useState(() => `call-${Date.now()}`);

    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const watchdogRef = useRef<NodeJS.Timeout | null>(null);
    const callActiveRef = useRef(false);
    const isMutedRef = useRef(false);
    const callStateRef = useRef<CallState>('idle');
    const isProcessingRef = useRef(false);
    const transcriptSavedRef = useRef(false);

    // Keep muted ref in sync
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    // Call timer
    useEffect(() => {
        if (callState !== 'idle' && callState !== 'ended' && callState !== 'connecting') {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [callState]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Start speech recognition
    const startListening = useCallback(() => {
        if (!callActiveRef.current || isMutedRef.current) return;
        // Don't start if already processing or speaking
        if (isProcessingRef.current) return;
        if (callStateRef.current === 'speaking' || callStateRef.current === 'processing') return;

        // Stop any existing recognition first
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN';  // Hindi speech recognition
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setCurrentText(interim || final);
            if (final.trim()) {
                processUserSpeech(final.trim());
            }
        };

        recognition.onend = () => {
            // Only auto-resume if we're supposed to be listening
            if (callActiveRef.current && !isMutedRef.current &&
                callStateRef.current !== 'speaking' &&
                callStateRef.current !== 'processing' &&
                !isProcessingRef.current) {
                setTimeout(() => {
                    if (callActiveRef.current && !isMutedRef.current &&
                        callStateRef.current !== 'speaking' &&
                        callStateRef.current !== 'processing' &&
                        !isProcessingRef.current) {
                        startListening();
                    }
                }, 300);
            }
        };

        recognition.onerror = (e: any) => {
            console.log('STT error:', e.error);
            // Restart on any recoverable error
            if (callActiveRef.current && !isMutedRef.current &&
                callStateRef.current !== 'speaking' &&
                callStateRef.current !== 'processing' &&
                !isProcessingRef.current) {
                const delay = e.error === 'no-speech' ? 300 : 500;
                setTimeout(() => {
                    if (callActiveRef.current && !isMutedRef.current &&
                        callStateRef.current !== 'speaking' &&
                        callStateRef.current !== 'processing') {
                        startListening();
                    }
                }, delay);
            }
        };

        recognitionRef.current = recognition;
        callStateRef.current = 'listening';
        setCallState('listening');
        try {
            recognition.start();
        } catch (err) {
            console.log('STT start error, retrying...', err);
            setTimeout(() => {
                if (callActiveRef.current && !isMutedRef.current) startListening();
            }, 500);
        }
    }, []);

    // Process user speech — send to AI
    const processUserSpeech = async (text: string) => {
        if (!callActiveRef.current) return;

        // Stop listening while processing
        isProcessingRef.current = true;
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        callStateRef.current = 'processing';
        setCallState('processing');
        setCurrentText('');

        // Add user entry to transcript
        setTranscript(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);

        try {
            // Get AI response
            const res = await fetch('http://localhost:4000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    sessionId,
                }),
            });

            const data = await res.json();

            if (data.success && callActiveRef.current) {
                // Add AI response to transcript
                setTranscript(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);

                // Speak the response
                await speakResponse(data.reply);
            } else if (callActiveRef.current) {
                // Resume listening on error
                isProcessingRef.current = false;
                startListening();
            }
        } catch (err) {
            console.error('Call AI error:', err);
            isProcessingRef.current = false;
            if (callActiveRef.current) {
                startListening();
            }
        }
    };

    // TTS — speak AI response
    const speakResponse = async (text: string) => {
        if (!callActiveRef.current || !speakerOn) {
            // If speaker is off, skip TTS and resume listening
            isProcessingRef.current = false;
            if (callActiveRef.current) startListening();
            return;
        }

        callStateRef.current = 'speaking';
        setCallState('speaking');

        try {
            // Try Sarvam AI Hindi TTS first
            const response = await fetch('http://localhost:4000/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audioRef.current = audio;

                audio.onended = () => {
                    callStateRef.current = 'listening';
                    setCallState('listening');
                    URL.revokeObjectURL(audioUrl);
                    audioRef.current = null;
                    isProcessingRef.current = false;
                    // Resume listening after AI finishes speaking
                    if (callActiveRef.current) {
                        startListening();
                    }
                };

                audio.onerror = () => {
                    URL.revokeObjectURL(audioUrl);
                    audioRef.current = null;
                    // Fallback to browser TTS
                    speakBrowser(text);
                };

                await audio.play();
            } else {
                // Fallback to browser TTS
                speakBrowser(text);
            }
        } catch {
            speakBrowser(text);
        }
    };

    // Browser TTS fallback
    const speakBrowser = (text: string) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';  // Hindi TTS
        utterance.rate = 1;
        utterance.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find((v: SpeechSynthesisVoice) => v.lang === 'hi-IN')
            || voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('hi'))
            || voices.find((v: SpeechSynthesisVoice) => v.lang.includes('IN'));
        if (hindiVoice) utterance.voice = hindiVoice;

        utterance.onend = () => {
            if (callActiveRef.current) {
                callStateRef.current = 'listening';
                setCallState('listening');
                isProcessingRef.current = false;
                startListening();
            }
        };
        window.speechSynthesis.speak(utterance);
    };

    // Stop AI speaking
    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        isProcessingRef.current = false;
        if (callActiveRef.current) {
            callStateRef.current = 'listening';
            setCallState('listening');
            startListening();
        }
    };

    // Start call
    const startCall = () => {
        callActiveRef.current = true;
        transcriptSavedRef.current = false;
        setCallState('connecting');
        setCallDuration(0);
        setTranscript([]);

        // Simulate connection delay
        setTimeout(() => {
            if (callActiveRef.current) {
                // AI greets first
                processGreeting();
            }
        }, 1500);
    };

    // AI greeting
    const processGreeting = async () => {
        setCallState('processing');
        try {
            const res = await fetch('http://localhost:4000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: 'CALL_STARTED',
                    sessionId,
                }),
            });

            const data = await res.json();
            if (data.success && callActiveRef.current) {
                setTranscript(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
                await speakResponse(data.reply);
            }
        } catch {
            if (callActiveRef.current) startListening();
        }
    };

    // Save transcript to backend + localStorage
    const saveTranscript = async (entries: TranscriptEntry[], duration: number) => {
        // Guard: only save once per call
        if (transcriptSavedRef.current) return;
        if (entries.length === 0) return;
        transcriptSavedRef.current = true;
        const structuredTranscript = entries.map(e => ({
            role: e.role,
            content: e.content,
            time: e.timestamp.toISOString(),
        }));

        // Save to localStorage as backup
        try {
            const savedCalls = JSON.parse(localStorage.getItem('call_transcripts') || '[]');
            savedCalls.unshift({
                id: sessionId,
                caller_name: 'Caller',
                date: new Date().toISOString(),
                duration,
                messageCount: entries.length,
                transcript: structuredTranscript,
            });
            localStorage.setItem('call_transcripts', JSON.stringify(savedCalls.slice(0, 50)));
        } catch { /* ignore storage errors */ }

        // Save to backend (new ai-calls endpoint)
        try {
            await fetch('http://localhost:4000/api/ai-calls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caller_name: 'Caller',
                    session_id: sessionId,
                    duration,
                    transcript: structuredTranscript,
                    message_count: entries.length,
                    status: 'completed',
                }),
            });
        } catch (err) {
            console.error('Failed to save transcript:', err);
        }
    };

    // End call
    const endCall = () => {
        callActiveRef.current = false;
        isProcessingRef.current = false;
        callStateRef.current = 'ended';
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        if (timerRef.current) clearInterval(timerRef.current);
        if (watchdogRef.current) clearInterval(watchdogRef.current);
        setCallState('ended');

        // Save transcript
        setTranscript(prev => {
            saveTranscript(prev, callDuration);
            return prev;
        });
    };

    // Toggle mute
    const toggleMute = () => {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        if (newMuted) {
            recognitionRef.current?.stop();
        } else if (callState === 'listening' || callState === 'processing') {
            startListening();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            callActiveRef.current = false;
            try { recognitionRef.current?.stop(); } catch { /* ignore */ }
            if (audioRef.current) audioRef.current.pause();
            window.speechSynthesis?.cancel();
            if (timerRef.current) clearInterval(timerRef.current);
            if (watchdogRef.current) clearInterval(watchdogRef.current);
        };
    }, []);

    // Waveform animation bars
    const WaveformBars = ({ active, color }: { active: boolean; color: string }) => (
        <div className="flex items-center gap-[3px] h-8">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`w-[3px] rounded-full transition-all ${color} ${active ? 'animate-waveform' : 'h-1 opacity-30'}`}
                    style={active ? {
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.4 + Math.random() * 0.3}s`,
                    } : {}}
                />
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
            {/* Ambient glow */}
            <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000 ${callState === 'speaking' ? 'bg-orange-500/20' :
                callState === 'listening' ? 'bg-green-500/15' :
                    callState === 'processing' ? 'bg-blue-500/15' :
                        'bg-slate-500/10'
                }`} />

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-4">
                <button onClick={callState === 'idle' || callState === 'ended' ? onBack : undefined} className="text-slate-400 hover:text-white text-sm transition-colors">
                    {callState === 'idle' || callState === 'ended' ? '← Back to Chat' : ''}
                </button>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                    {callState !== 'idle' && callState !== 'ended' && (
                        <>
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>Live Call</span>
                        </>
                    )}
                </div>
                {callState !== 'idle' && callState !== 'ended' && (
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className={`p-2 rounded-lg transition-all ${showTranscript ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
                {/* Avatar */}
                <div className={`relative mb-8 ${callState === 'speaking' ? 'scale-105' : 'scale-100'} transition-transform duration-500`}>
                    {/* Pulse rings */}
                    {(callState === 'speaking' || callState === 'listening') && (
                        <>
                            <div className={`absolute inset-0 rounded-full ${callState === 'speaking' ? 'bg-orange-500/20' : 'bg-green-500/20'} animate-ping`} style={{ animationDuration: '2s' }} />
                            <div className={`absolute -inset-3 rounded-full ${callState === 'speaking' ? 'bg-orange-500/10' : 'bg-green-500/10'} animate-ping`} style={{ animationDuration: '3s' }} />
                        </>
                    )}
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center relative ${callState === 'idle' ? 'bg-gradient-to-br from-slate-700 to-slate-800' :
                        callState === 'connecting' ? 'bg-gradient-to-br from-yellow-600 to-orange-600 animate-pulse' :
                            callState === 'speaking' ? 'bg-gradient-to-br from-orange-500 to-red-500' :
                                callState === 'listening' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                                    callState === 'processing' ? 'bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse' :
                                        'bg-gradient-to-br from-slate-600 to-slate-700'
                        } shadow-2xl`}>
                        <Bot className="w-14 h-14 text-white" />
                    </div>
                </div>

                {/* Name and status */}
                <h2 className="text-2xl font-bold text-white mb-1">Falgun ka Voice Agent</h2>
                <p className="text-sm text-slate-400 mb-4">Hindi AI Agent</p>

                {/* Status text */}
                <div className="h-8 flex items-center gap-3 mb-2">
                    {callState === 'idle' && (
                        <p className="text-slate-500 text-sm">Ready to call</p>
                    )}
                    {callState === 'connecting' && (
                        <p className="text-yellow-400 text-sm animate-pulse">Connecting...</p>
                    )}
                    {callState === 'listening' && (
                        <div className="flex items-center gap-2">
                            <WaveformBars active={true} color="bg-green-400" />
                            <p className="text-green-400 text-sm">{isMuted ? 'Muted' : 'Listening...'}</p>
                        </div>
                    )}
                    {callState === 'processing' && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-blue-400 text-sm">Thinking...</p>
                        </div>
                    )}
                    {callState === 'speaking' && (
                        <div className="flex items-center gap-2">
                            <WaveformBars active={true} color="bg-orange-400" />
                            <p className="text-orange-400 text-sm">Bol raha hai...</p>
                        </div>
                    )}
                    {callState === 'ended' && (
                        <p className="text-slate-500 text-sm">Call ended</p>
                    )}
                </div>

                {/* Interim text */}
                {currentText && callState === 'listening' && (
                    <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-xl px-4 py-2 mb-4">
                        <p className="text-sm text-slate-300 italic">"{currentText}"</p>
                    </div>
                )}

                {/* Timer */}
                {callState !== 'idle' && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono">{formatTime(callDuration)}</span>
                    </div>
                )}
            </div>

            {/* Call Summary (on end) */}
            {callState === 'ended' && (
                <div className="relative z-10 mx-6 mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 max-h-[40vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-orange-400" />
                        Call Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-400">{formatTime(callDuration)}</p>
                            <p className="text-xs text-slate-500">Duration</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">{transcript.filter(t => t.role === 'user').length}</p>
                            <p className="text-xs text-slate-500">Your Messages</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{transcript.filter(t => t.role === 'assistant').length}</p>
                            <p className="text-xs text-slate-500">AI Responses</p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-4 space-y-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Transcript</p>
                        {transcript.map((entry, i) => (
                            <div key={i} className={`flex gap-2 ${entry.role === 'user' ? 'justify-end' : ''}`}>
                                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${entry.role === 'user'
                                    ? 'bg-indigo-500/20 border border-indigo-500/20 text-indigo-200'
                                    : 'bg-orange-500/10 border border-orange-500/20 text-orange-200'
                                    }`}>
                                    <p className="text-[10px] font-semibold mb-0.5 opacity-60">{entry.role === 'user' ? 'You' : 'Arjun'}</p>
                                    {entry.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={startCall}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg hover:shadow-green-500/20 transition-all text-sm"
                        >
                            Call Again
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all text-sm"
                        >
                            Back to Chat
                        </button>
                    </div>
                </div>
            )}

            {/* Live transcript sidebar */}
            {showTranscript && callState !== 'idle' && callState !== 'ended' && (
                <div className="absolute right-0 top-14 bottom-24 w-80 bg-slate-900/95 border-l border-white/10 z-20 overflow-y-auto p-4 space-y-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Live Transcript</p>
                    {transcript.map((entry, i) => (
                        <div key={i} className={`text-sm ${entry.role === 'user' ? 'text-indigo-300' : 'text-orange-300'}`}>
                            <span className="text-[10px] font-semibold opacity-50">{entry.role === 'user' ? 'You' : 'Arjun'}</span>
                            <p className="mt-0.5">{entry.content}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="relative z-10 pb-10 pt-6 px-6">
                {callState === 'idle' && (
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={startCall}
                            className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/30 hover:scale-105 active:scale-95 transition-transform"
                        >
                            <Phone className="w-8 h-8 text-white" />
                        </button>
                        <p className="text-slate-500 text-sm">Call shuru karne ke liye dabaiye</p>
                    </div>
                )}

                {callState !== 'idle' && callState !== 'ended' && (
                    <div className="flex items-center justify-center gap-6">
                        {/* Mute */}
                        <button
                            onClick={toggleMute}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                                }`}
                        >
                            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        {/* Stop Speaking (only when AI is speaking) */}
                        {callState === 'speaking' && (
                            <button
                                onClick={stopSpeaking}
                                className="w-14 h-14 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center justify-center hover:bg-yellow-500/30 transition-all animate-pulse"
                            >
                                <Square className="w-5 h-5 fill-current" />
                            </button>
                        )}

                        {/* End Call */}
                        <button
                            onClick={endCall}
                            className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-transform"
                        >
                            <PhoneOff className="w-7 h-7 text-white" />
                        </button>

                        {/* Speaker */}
                        <button
                            onClick={() => setSpeakerOn(!speakerOn)}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${speakerOn
                                ? 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                                : 'bg-slate-500/20 text-slate-500 border border-slate-500/30'
                                }`}
                        >
                            {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                    </div>
                )}
            </div>

            {/* Waveform CSS */}
            <style jsx global>{`
                @keyframes waveform {
                    0%, 100% { height: 4px; }
                    50% { height: 28px; }
                }
                .animate-waveform {
                    animation: waveform ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
