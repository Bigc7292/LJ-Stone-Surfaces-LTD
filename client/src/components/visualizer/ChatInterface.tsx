import React, { useState } from 'react';

interface ChatInterfaceProps {
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const send = () => { if (!input.trim() || isLoading) return; onSendMessage(input); setInput(''); };

    return (
        <div className="flex flex-col h-full bg-secondary/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right duration-500 backdrop-blur-md">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/5 bg-secondary/30">
                <div className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                    <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">AI Architect Online</h4>
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 tracking-widest pl-5">Refine textures, lighting, or veining</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground shrink-0 shadow-lg">AI</div>
                    <div className="bg-secondary/80 rounded-[1.5rem] rounded-tl-none p-5 text-[11px] text-slate-300 leading-relaxed shadow-sm border border-white/5 font-sans">
                        <p className="font-medium text-white/90">The material has been applied to your spatial specifications.</p>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-primary/80 font-black uppercase tracking-widest text-[9px] mb-2">Refinement Curation:</p>
                            <ul className="space-y-2 text-[10px] text-slate-400 font-medium">
                                <li className="flex items-center gap-2">• <span className="text-slate-200">"Make the veins deeper gold"</span></li>
                                <li className="flex items-center gap-2">• <span className="text-slate-200">"Apply more gloss to the island"</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-xl">
                <div className="flex items-center space-x-3 bg-secondary border border-white/10 rounded-2xl p-1.5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-inner">
                    <input
                        className="flex-1 bg-transparent border-none text-[11px] text-white px-4 py-3 focus:outline-none placeholder:text-slate-600 font-bold uppercase tracking-widest"
                        placeholder="INSTRUCT AI ARCHITECT..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        disabled={isLoading}
                    />
                    <button
                        onClick={send}
                        disabled={isLoading || !input.trim()}
                        className="p-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl active:scale-90"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        )}
                    </button>
                </div>
                <p className="text-[8px] text-slate-600 text-center mt-3 font-black uppercase tracking-widest">Powered by Gemini 2.0 Flash</p>
            </div>
        </div>
    );
};

export default ChatInterface;
