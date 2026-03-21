'use client';
import { useState, useRef, useEffect } from 'react';
import nextDynamic from 'next/dynamic';
const CallPage = nextDynamic(() => import('./call-page'), { ssr: false });
import {
    Send,
    Mic,
    MicOff,
    RotateCcw,
    Settings,
    X,
    Bot,
    User,
    Volume2,
    VolumeX,
    Loader2,
    Sparkles,
    Square,
    Phone,
    Image as ImageIcon,
} from 'lucide-react';

interface PropertyImage {
    propertyName: string;
    images: string[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    propertyImages?: PropertyImage[];
}

export const dynamic = 'force-dynamic';

export default function AIPlaygroundPage() {
    const [mode, setMode] = useState<'chat' | 'call'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => `session-${Date.now()}`);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [ttsMode, setTtsMode] = useState<'sarvam' | 'browser'>('sarvam');
    const [context, setContext] = useState({
        propertyName: '',
        propertyLocation: '',
        propertyPrice: '',
        leadName: '',
    });
    const [systemPrompt, setSystemPrompt] = useState('');
    const [outboundPhone, setOutboundPhone] = useState('+91');
    const [isCallingPhone, setIsCallingPhone] = useState(false);
    const [callStatus, setCallStatus] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Speech recognition setup
    const startListening = () => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Try Chrome.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');
            setInput(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
            const currentInput = (document.getElementById('ai-input') as HTMLInputElement)?.value;
            if (currentInput?.trim()) {
                handleSend(currentInput.trim());
            }
        };

        recognition.onerror = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    // Sarvam AI TTS (Hindi)
    const speakSarvam = async (text: string) => {
        try {
            setIsSpeaking(true);
            const response = await fetch('http://localhost:4000/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                }),
            });

            if (!response.ok) {
                // Fallback to browser TTS
                console.warn('Sarvam TTS failed, falling back to browser TTS');
                speakBrowser(text);
                return;
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };
            audio.onerror = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
            };

            await audio.play();
        } catch (err) {
            console.error('TTS error:', err);
            speakBrowser(text);
        }
    };

    // Browser TTS fallback
    const speakBrowser = (text: string) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 1;
        utterance.pitch = 1;
        const voices = window.speechSynthesis.getVoices();
        const indianVoice = voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en'));
        if (indianVoice) utterance.voice = indianVoice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const speak = (text: string) => {
        if (!voiceEnabled) return;
        if (ttsMode === 'sarvam') {
            speakSarvam(text);
        } else {
            speakBrowser(text);
        }
    };

    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
    };

    const handleSend = async (text?: string) => {
        const message = text || input.trim();
        if (!message || loading) return;

        const userMsg: Message = { role: 'user', content: message, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:4000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    sessionId,
                    systemPrompt: systemPrompt || undefined,
                    context: (context.propertyName || context.leadName) ? context : undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                const aiMsg: Message = { role: 'assistant', content: data.reply, timestamp: new Date(), propertyImages: data.propertyImages };
                setMessages(prev => [...prev, aiMsg]);
                speak(data.reply);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.error}`,
                    timestamp: new Date(),
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Failed to connect to AI. Make sure the backend is running.',
                timestamp: new Date(),
            }]);
        }

        setLoading(false);
    };

    const resetConversation = async () => {
        await fetch('http://localhost:4000/api/ai/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
        });
        setMessages([]);
        stopSpeaking();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Outbound phone call
    const makeOutboundCall = async () => {
        if (!outboundPhone || outboundPhone.length < 10 || isCallingPhone) return;
        setIsCallingPhone(true);
        setCallStatus('Calling...');
        try {
            const res = await fetch('http://localhost:4000/api/twilio/outbound', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: outboundPhone, leadName: '' }),
            });
            const data = await res.json();
            if (data.success) {
                setCallStatus(`✅ Call initiated!`);
                setTimeout(() => setCallStatus(''), 4000);
            } else {
                setCallStatus(`❌ ${data.error}`);
                setTimeout(() => setCallStatus(''), 4000);
            }
        } catch {
            setCallStatus('❌ Server error');
            setTimeout(() => setCallStatus(''), 4000);
        } finally {
            setIsCallingPhone(false);
        }
    };

    return (
        <>
            {mode === 'call' ? (
                <CallPage onBack={() => setMode('chat')} />
            ) : (
                <div className="flex gap-4 h-[calc(100vh-120px)]">
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Arjun — PropCall AI Agent</h3>
                                    <p className="text-xs text-slate-500">Powered by Groq • Llama 3.3 70B</p>
                                </div>
                                {isSpeaking && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <div className="w-1 h-3 bg-orange-400 rounded-full animate-pulse" />
                                        <div className="w-1 h-4 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                                        <div className="w-1 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                                        <span className="text-xs text-orange-400 ml-1">Speaking...</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMode('call')}
                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all flex items-center gap-1.5"
                                    title="Switch to Browser Voice Call"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    Browser Call
                                </button>
                                {/* Outbound Phone Call */}
                                <div className="flex items-center gap-1">
                                    <input
                                        type="tel"
                                        value={outboundPhone}
                                        onChange={(e) => setOutboundPhone(e.target.value)}
                                        placeholder="+91 XXXXXXXXXX"
                                        className="w-36 px-2 py-1.5 rounded-lg bg-slate-800/60 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40"
                                    />
                                    <button
                                        onClick={makeOutboundCall}
                                        disabled={isCallingPhone || outboundPhone.length < 10}
                                        className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium hover:bg-orange-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="AI calls this phone number"
                                    >
                                        {isCallingPhone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                                        📞 Call Phone
                                    </button>
                                </div>
                                {callStatus && (
                                    <span className={`text-[10px] ${callStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                                        {callStatus}
                                    </span>
                                )}
                                <button
                                    onClick={isSpeaking ? stopSpeaking : () => setVoiceEnabled(!voiceEnabled)}
                                    className={`p-2 rounded-lg transition-all ${isSpeaking ? 'bg-red-500/20 text-red-400 animate-pulse' : voiceEnabled ? 'bg-orange-500/10 text-orange-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                    title={isSpeaking ? 'Stop speaking' : voiceEnabled ? 'Voice on' : 'Voice off'}
                                >
                                    {isSpeaking ? <div className="w-4 h-4 flex items-center justify-center"><div className="w-2.5 h-2.5 bg-current rounded-sm" /></div> : voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={resetConversation}
                                    className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                                    title="Reset conversation"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-orange-500/10 text-orange-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                    title="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4">
                                        <Sparkles className="w-8 h-8 text-orange-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">AI Voice Playground</h3>
                                    <p className="text-slate-400 text-sm max-w-sm">
                                        Chat with Arjun, PropCall&apos;s AI property consultant. Type or use voice to test his responses.
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                                        {[
                                            'Hi, I\'m looking for a 3BHK in Mumbai',
                                            'What properties do you have under 1 Crore?',
                                            'I need a flat near good schools',
                                            'Is there any offer going on?',
                                        ].map((suggestion, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setInput(suggestion); }}
                                                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-orange-500/30 transition-all"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'assistant'
                                        ? 'bg-gradient-to-br from-orange-500 to-red-500'
                                        : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                                        }`}>
                                        {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                        ? 'bg-indigo-500/20 border border-indigo-500/20 rounded-tr-none'
                                        : 'bg-white/5 border border-white/10 rounded-tl-none'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        {/* Property Images - Labeled by property name */}
                                        {msg.propertyImages && msg.propertyImages.length > 0 && (
                                            <div className="mt-3 space-y-3">
                                                {msg.propertyImages.map((propImg, pIdx) => (
                                                    <div key={pIdx} className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                                                        <div className="px-3 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-white/10">
                                                            <p className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                                                                <ImageIcon className="w-3 h-3" />
                                                                {propImg.propertyName}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-1 p-1">
                                                            {propImg.images.map((img, idx) => (
                                                                <div key={idx} className="relative rounded-lg overflow-hidden group cursor-pointer">
                                                                    <img
                                                                        src={img}
                                                                        alt={`${propImg.propertyName} - ${idx + 1}`}
                                                                        className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        loading="lazy"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-slate-600 mt-1.5">
                                            {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/30">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`p-3 rounded-xl transition-all flex-shrink-0 ${isListening
                                        ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                        }`}
                                    title={isListening ? 'Stop listening' : 'Start voice input'}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <input
                                    id="ai-input"
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isListening ? 'Listening...' : 'Type a message or click 🎤 to speak...'}
                                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
                                    disabled={loading}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                    className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white disabled:opacity-30 hover:shadow-lg hover:shadow-orange-500/20 transition-all flex-shrink-0"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            {isListening && (
                                <p className="text-xs text-red-400 mt-2 text-center animate-pulse">🎤 Listening... Speak now</p>
                            )}
                            {/* Prominent Stop Button */}
                            {isSpeaking && (
                                <div className="mt-2">
                                    <button
                                        onClick={stopSpeaking}
                                        className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 animate-pulse"
                                    >
                                        <Square className="w-4 h-4 fill-current" />
                                        Stop Speaking
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="w-80 rounded-2xl border border-white/10 bg-slate-900/50 p-5 space-y-5 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Context & Settings</h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Voice Mode */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voice Output</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setTtsMode('sarvam')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${ttsMode === 'sarvam' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                                    >
                                        🎙️ Sarvam AI
                                    </button>
                                    <button
                                        onClick={() => setTtsMode('browser')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${ttsMode === 'browser' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}
                                    >
                                        🌐 Browser
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-600">
                                    {ttsMode === 'sarvam' ? 'Fluent Hindi voice (Sarvam AI)' : 'Browser built-in voice (robotic)'}
                                </p>
                            </div>



                            {/* Property Context */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Property Context</p>
                                <input
                                    type="text"
                                    value={context.propertyName}
                                    onChange={(e) => setContext({ ...context, propertyName: e.target.value })}
                                    placeholder="Property Name"
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                                />
                                <input
                                    type="text"
                                    value={context.propertyLocation}
                                    onChange={(e) => setContext({ ...context, propertyLocation: e.target.value })}
                                    placeholder="Location"
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                                />
                                <input
                                    type="text"
                                    value={context.propertyPrice}
                                    onChange={(e) => setContext({ ...context, propertyPrice: e.target.value })}
                                    placeholder="Price (e.g. ₹85 Lakhs)"
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                                />
                            </div>

                            {/* Lead Context */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead Context</p>
                                <input
                                    type="text"
                                    value={context.leadName}
                                    onChange={(e) => setContext({ ...context, leadName: e.target.value })}
                                    placeholder="Lead Name"
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50"
                                />
                            </div>

                            {/* System Prompt */}
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Prompt</p>
                                <textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Leave empty for default Riya persona..."
                                    rows={6}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 resize-none"
                                />
                                <p className="text-[10px] text-slate-600">Customize the AI&apos;s persona and behavior</p>
                            </div>

                            {/* Reset */}
                            <button
                                onClick={resetConversation}
                                className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Conversation
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
