import React, { useState, useEffect, useRef } from 'react';

interface MarkerInputModalProps {
    onConfirm: (label: string) => void;
    onCancel: () => void;
}

const MarkerInputModal: React.FC<MarkerInputModalProps> = ({ onConfirm, onCancel }) => {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary/95 p-6 rounded-[2rem] border border-primary/30 shadow-3xl z-50 w-80 animate-in zoom-in-95 duration-300 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center space-x-3 mb-5">
                <div className="w-2 h-2 bg-primary rounded-full animate-shadow-glow" />
                <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Identify Surface</h4>
            </div>

            <input
                ref={inputRef}
                autoFocus
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white mb-6 focus:outline-none focus:border-primary/50 transition-all font-bold uppercase tracking-widest placeholder:text-slate-700"
                placeholder="E.G. COUNTERTOP"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onConfirm(input.trim() || "Surface");
                    if (e.key === 'Escape') onCancel();
                }}
            />

            <div className="flex justify-end items-center space-x-4">
                <button
                    onClick={onCancel}
                    className="text-[9px] uppercase font-black text-slate-500 hover:text-white transition-colors tracking-widest"
                >
                    Cancel
                </button>
                <button
                    onClick={() => onConfirm(input.trim() || "Surface")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-black uppercase tracking-widest px-7 py-3 rounded-xl shadow-lg transition-all active:scale-95"
                >
                    Confirm
                </button>
            </div>
        </div>
    );
};

export default MarkerInputModal;
