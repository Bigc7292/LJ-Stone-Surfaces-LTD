import React, { useState, useRef, useEffect } from 'react';

// --- Types ---
interface Message {
    role: 'user' | 'ai';
    text: string;
}

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'CHAT' | 'LEAD'>('CHAT');

    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: 'Hello! I am the LJ Stone Assistant. Ask me about materials, processes, or fill out the form for a quote.' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Lead Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', interest: '' });
    const [formStatus, setFormStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');

    // Auto-scroll chat
    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // --- ACTIONS ---

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            // Connects to the route we setup in routes.ts
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: [] })
            });

            const data = await res.json();

            setMessages(prev => [...prev, { role: 'ai', text: data.response || "I am having trouble connecting to the server." }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "Connection error. Please try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const submitLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('SENDING');

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    source: 'Global ChatBot'
                })
            });

            if (res.ok) {
                setFormStatus('SUCCESS');
                setFormData({ name: '', email: '', phone: '', interest: '' });
                // Auto-switch back to chat after 2 seconds
                setTimeout(() => {
                    setActiveTab('CHAT');
                    setMessages(prev => [...prev, { role: 'ai', text: "Thank you! We received your inquiry and will contact you shortly." }]);
                    setFormStatus('IDLE');
                }, 2000);
            } else {
                setFormStatus('ERROR');
            }
        } catch (err) {
            setFormStatus('ERROR');
        }
    };

    // --- RENDER ---
    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end">

            {/* 1. Chat Window (Collapsible) */}
            <div className={`transition-all duration-300 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 h-0 overflow-hidden'}`}>
                <div className="bg-slate-900 border border-slate-700 w-[350px] h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                    {/* Header & Tabs */}
                    <div className="bg-slate-950 border-b border-slate-800 p-1">
                        <div className="flex p-3 items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-white font-bold text-sm tracking-wide">LJ Stone Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-1 px-2 pb-2">
                            <button
                                onClick={() => setActiveTab('CHAT')}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'CHAT' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                Chat
                            </button>
                            <button
                                onClick={() => setActiveTab('LEAD')}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'LEAD' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                Request Quote
                            </button>
                        </div>
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col">

                        {/* --- TAB 1: AI CHAT --- */}
                        {activeTab === 'CHAT' && (
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${m.role === 'user' ? 'bg-amber-500 text-slate-950 rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700"><div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" /></div></div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <div className="p-3 bg-slate-950 border-t border-slate-800">
                                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2 focus-within:border-amber-500 transition-colors">
                                        <input
                                            className="flex-1 bg-transparent border-none text-xs text-white px-2 py-3 focus:outline-none placeholder:text-slate-600"
                                            placeholder="Type your question..."
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        />
                                        <button onClick={sendMessage} className="p-2 text-amber-500 hover:text-amber-400"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* --- TAB 2: LEAD FORM --- */}
                        {activeTab === 'LEAD' && (
                            <div className="p-6 h-full overflow-y-auto">
                                {formStatus === 'SUCCESS' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in">
                                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"><svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                                        <h3 className="text-white font-bold text-lg">Inquiry Sent!</h3>
                                        <p className="text-slate-400 text-xs">We will contact you shortly.</p>
                                        <button onClick={() => setFormStatus('IDLE')} className="text-amber-500 text-xs font-bold uppercase hover:underline">Send another</button>
                                    </div>
                                ) : (
                                    <form onSubmit={submitLead} className="space-y-4">
                                        <h3 className="text-white font-bold text-sm mb-4">Get a Free Consultation</h3>

                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-500">Full Name</label>
                                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" placeholder="John Doe" />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-500">Phone Number</label>
                                            <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" placeholder="+44 7..." />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
                                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" placeholder="john@example.com" />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-slate-500">Interests / Requirements</label>
                                            <textarea required value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none h-24 resize-none" placeholder="Looking for Calacatta Gold..." />
                                        </div>

                                        {formStatus === 'ERROR' && <p className="text-red-500 text-xs">Something went wrong. Please try again.</p>}

                                        <button type="submit" disabled={formStatus === 'SENDING'} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl uppercase text-xs tracking-wider transition-all disabled:opacity-50">
                                            {formStatus === 'SENDING' ? 'Sending...' : 'Submit Inquiry'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Floating Toggle Button (Always Visible) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 group relative z-[10000]"
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <>
                        <svg className="w-6 h-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                        {/* Notification Dot */}
                        <span className="absolute top-0 right-0 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
                    </>
                )}
            </button>
        </div>
    );
}