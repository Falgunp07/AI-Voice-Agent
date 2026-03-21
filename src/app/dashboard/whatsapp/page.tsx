'use client';
import { useEffect, useState, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Smile,
    Paperclip,
    Check,
    CheckCheck,
    Mic,
} from 'lucide-react';

interface Message {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    status: 'sent' | 'delivered' | 'read';
    created_at: string;
    type: 'text' | 'image' | 'template';
}

interface Lead {
    id: string;
    name: string;
    phone: string;
    last_message?: string;
    last_message_time?: string;
    unread_count?: number;
}

export default function WhatsAppPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch leads with latest message
    useEffect(() => {
        const fetchLeads = async () => {
            const supabase = createSupabaseBrowserClient();
            const { data: leadsData } = await supabase
                .from('leads')
                .select('id, name, phone')
                .order('created_at', { ascending: false });

            if (leadsData) {
                // Fetch last message for each lead (mock for now)
                const leadsWithMsg = await Promise.all(leadsData.map(async (lead) => {
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('content, created_at')
                        .eq('lead_id', lead.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        ...lead,
                        last_message: lastMsg?.content || 'No messages yet',
                        last_message_time: lastMsg?.created_at || new Date().toISOString(),
                    };
                }));
                setLeads(leadsWithMsg);
                if (leadsWithMsg.length > 0 && !selectedLead) {
                    setSelectedLead(leadsWithMsg[0]);
                }
            }
            setLoading(false);
        };
        fetchLeads();
    }, [selectedLead]); // Re-fetch when selection changes to update last msg

    // Fetch messages for selected lead
    useEffect(() => {
        if (!selectedLead) return;

        const fetchMessages = async () => {
            const res = await fetch(`http://localhost:4000/api/whatsapp/${selectedLead.id}/history`);
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll for new messages
        return () => clearInterval(interval);
    }, [selectedLead]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !selectedLead || sending) return;

        setSending(true);
        try {
            const res = await fetch('http://localhost:4000/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedLead.id,
                    content: input.trim(),
                    type: 'text',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => [...prev, data.message]);
                setInput('');
            }
        } catch (err) {
            console.error('Failed to send message', err);
        }
        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex bg-slate-900 rounded-2xl border border-white/10 h-[calc(100vh-120px)] overflow-hidden">
            {/* Sidebar - Contacts */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-slate-900/50">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/30">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden" />
                    <div className="flex gap-4 text-slate-400">
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-500" />
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-500" />
                        <MoreVertical className="w-6 h-6" />
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                    </div>
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Loading contacts...</div>
                    ) : leads.map(lead => (
                        <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-sm font-bold">
                                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0 border-b border-white/5 pb-3">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="font-medium truncate text-slate-200">{lead.name}</h4>
                                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                        {formatTime(lead.last_message_time!)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{lead.last_message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedLead ? (
                <div className="flex-1 flex flex-col bg-[url('/whatsapp-bg-dark.png')] bg-repeat bg-slate-950/90 relative">
                    <div className="absolute inset-0 bg-slate-950/90 pointer-events-none" /> {/* Overlay for dark mode feel */}

                    {/* Chat Header */}
                    <header className="relative z-10 p-3 px-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                                {selectedLead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-200">{selectedLead.name}</h3>
                                <p className="text-xs text-slate-500">{selectedLead.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 text-slate-400">
                            <Video className="w-5 h-5 cursor-pointer hover:text-white" />
                            <Phone className="w-5 h-5 cursor-pointer hover:text-white" />
                            <Search className="w-5 h-5 cursor-pointer hover:text-white" />
                            <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white" />
                        </div>
                    </header>

                    {/* Messages */}
                    <div className="flex-1 relative z-10 overflow-y-auto p-4 space-y-2">
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                <div className="text-center p-4 rounded-xl bg-slate-900/80 border border-white/5">
                                    <p className="text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-1">Encrypted</p>
                                    Messages are end-to-end simulated.
                                </div>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative max-w-[70%] px-3 py-1.5 rounded-lg text-sm shadow-sm ${msg.direction === 'outbound'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-white rounded-tl-none'
                                        }`}
                                >
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <div className="flex items-center justify-end gap-1 mt-0.5">
                                        <span className="text-[10px] text-white/60">
                                            {formatTime(msg.created_at)}
                                        </span>
                                        {msg.direction === 'outbound' && (
                                            msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> :
                                                msg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5 text-white/60" /> :
                                                    <Check className="w-3.5 h-3.5 text-white/60" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <footer className="relative z-10 p-3 bg-slate-900 border-t border-white/10 flex items-center gap-3">
                        <Smile className="w-6 h-6 text-slate-400 cursor-pointer hover:text-white" />
                        <Paperclip className="w-6 h-6 text-slate-400 cursor-pointer hover:text-white" />
                        <div className="flex-1 bg-slate-800 rounded-lg flex items-center px-4 py-2 border border-white/5 focus-within:border-white/20 transition-colors">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message"
                                className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
                            />
                        </div>
                        {input.trim() ? (
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="p-2.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        ) : (
                            <button className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors">
                                <Mic className="w-5 h-5" />
                            </button>
                        )}
                    </footer>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-center p-6 border-b-8 border-emerald-500">
                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-white rounded-full" /> {/* Placeholder for WhatsApp Web illustration */}
                    </div>
                    <h2 className="text-3xl font-light text-slate-200 mb-4">WhatsApp Web Demo</h2>
                    <p className="text-slate-400 max-w-md">
                        Send and receive simulated messages without keeping your phone online.<br />
                        Use WhatsApp on up to 4 linked devices and 1 phone.
                    </p>
                    <div className="mt-8 flex items-center gap-2 text-slate-500 text-xs">
                        <Lock className="w-3 h-3" /> End-to-end encrypted
                    </div>
                </div>
            )}
        </div>
    );
}

function Lock({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
        </svg>
    )
}
