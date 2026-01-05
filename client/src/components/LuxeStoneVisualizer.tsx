import React, { useState, useRef, useEffect } from 'react';
import type { AppStep, Marker, MaterialOption } from '@/types/visualizer';
import { MATERIALS } from '@/lib/visualizerConstants';

// --- 1. IMPORT THE LOGO ---
import logoImg from "@assets/Screenshot_20251226_103451_WhatsAppBusiness_1766730996434.jpg";

// --- CONSTANTS ---
const FINISH_OPTIONS = ['Polished', 'Honed', 'Leathered'];
const STONE_TONES = [
    { id: 'natural', name: 'Natural / Unchanged', hex: '#e2e8f0' },
    { id: 'cool', name: 'Cool / Grey', hex: '#94a3b8' },
    { id: 'warm', name: 'Warm / Beige', hex: '#d6d3d1' },
    { id: 'dark', name: 'Dark / Charcoal', hex: '#334155' },
    { id: 'dramatic', name: 'High Contrast', hex: '#0f172a' },
];

// ============================================================================
// COMPONENT: COMPARISON SLIDER
// ============================================================================
const ComparisonSlider: React.FC<{ original: string; modified: string; }> = ({ original, modified }) => {
    const [position, setPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        setPosition((x / rect.width) * 100);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            handleMove(clientX);
        };
        const onUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('touchmove', onMove);
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchend', onUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchend', onUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full select-none overflow-hidden cursor-ew-resize touch-none group"
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
        >
            <img src={modified} alt="After" className="absolute inset-0 w-full h-full object-contain bg-slate-950 pointer-events-none" />
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}>
                <img src={original} alt="Before" className="absolute inset-0 w-full h-full object-contain bg-slate-950" />
            </div>
            <div className="absolute inset-y-0 w-1 bg-white/80 shadow-[0_0_20px_rgba(0,0,0,0.5)] z-20 pointer-events-none" style={{ left: `${position}%` }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3m0 0l3 3m-3-3h12m-3-3l3 3m0 0l-3 3" /></svg>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT: FULL SCREEN MODAL
// ============================================================================
const FullScreenResultModal: React.FC<{
    original: string;
    modified: string;
    onClose: () => void;
}> = ({ original, modified, onClose }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col animate-in fade-in duration-300">
            {/* Modal Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur px-4 py-2 rounded-full pointer-events-auto">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Full Screen Compare</span>
                </div>
                <button
                    onClick={onClose}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 pointer-events-auto transition-all backdrop-blur-md border border-white/10"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Slider Content */}
            <div className="flex-1 w-full h-full p-2 md:p-10">
                <ComparisonSlider original={original} modified={modified} />
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT: CHAT INTERFACE
// ============================================================================
const ChatInterface: React.FC<{
    onSendMessage: (msg: string) => void;
    isLoading: boolean;
}> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');

    const send = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800/50 overflow-hidden shadow-xl animate-in fade-in slide-in-from-right duration-500">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <h4 className="text-xs font-black uppercase text-amber-500 tracking-widest">AI Architect Active</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 pl-4">Refine colors, lighting, or veins</p>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-[10px] font-black text-slate-900 shrink-0 shadow-lg">AI</div>
                    <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 text-[11px] text-slate-300 leading-relaxed shadow-sm border border-slate-700/50">
                        <p>I have applied the material to your specifications.</p>
                        <p className="mt-2 text-slate-500 font-bold">Try asking me to:</p>
                        <ul className="mt-1 space-y-1 text-amber-500/80">
                            <li>• "Make the veins darker"</li>
                            <li>• "Increase the gloss reflection"</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl p-1 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
                    <input
                        className="flex-1 bg-transparent border-none text-xs text-white px-3 py-3 focus:outline-none placeholder:text-slate-600 font-bold uppercase tracking-wide"
                        placeholder="TYPE INSTRUCTION..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        disabled={isLoading}
                    />
                    <button
                        onClick={send}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT: MATERIAL OPTION CARD
// ============================================================================
const MaterialOptionItem: React.FC<{
    material: MaterialOption;
    isSelected: boolean;
    onSelect: (m: MaterialOption) => void;
}> = ({ material, isSelected, onSelect }) => (
    <button
        onClick={() => onSelect(material)}
        className={`group w-full p-0 rounded-2xl border text-left transition-all relative flex items-center min-h-[70px] ${isSelected ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}`}
    >
        <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
                <span className={`font-black tracking-widest text-[10px] uppercase leading-none ${isSelected ? 'text-amber-500' : 'text-slate-300 group-hover:text-white'}`}>
                    {material.name}
                </span>
            </div>
            <span className="text-[8px] opacity-40 uppercase tracking-widest font-bold mt-1 ml-3.5">{material.texture}</span>
        </div>
        <div className="relative w-16 h-[70px] border-l border-slate-700/50 shrink-0 overflow-hidden rounded-r-2xl">
            {material.swatchUrl ? (
                <>
                    <img src={material.swatchUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 right-full mr-2 mb-[-20px] w-48 h-48 rounded-xl border-2 border-amber-500 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-4 group-hover:translate-x-0 bg-slate-900 z-50 overflow-hidden">
                        <img src={material.swatchUrl} className="w-full h-full object-cover" />
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20 bg-slate-900">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                </div>
            )}
        </div>
    </button>
);

// ============================================================================
// COMPONENT: MARKER INPUT MODAL
// ============================================================================
const MarkerInputModal: React.FC<{ onConfirm: (label: string) => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 p-5 rounded-2xl border border-amber-500/50 shadow-2xl z-50 w-72 animate-in zoom-in-95 backdrop-blur-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-2 mb-3"><div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" /><h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Identify Surface</h4></div>
            <input ref={inputRef} autoFocus className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-amber-500 uppercase font-bold" placeholder="E.G. COUNTERTOP" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(input.trim() || "Surface"); if (e.key === 'Escape') onCancel(); }} />
            <div className="flex justify-end space-x-2"><button onClick={onCancel} className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2">Cancel</button><button onClick={() => onConfirm(input.trim() || "Surface")} className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-5 py-2 rounded-lg">Confirm</button></div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT: LUXE STONE VISUALIZER
// ============================================================================
export const LuxeStoneVisualizer: React.FC = () => {
    const [step, setStep] = useState<AppStep>('UPLOAD');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [markers, setMarkers] = useState<Marker[]>([]);
    const [pendingMarker, setPendingMarker] = useState<{ x: number, y: number } | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
    const [selectedTone, setSelectedTone] = useState(STONE_TONES[0]);
    const [selectedFinish, setSelectedFinish] = useState('Polished');
    const [isLoading, setIsLoading] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string } | null>(null);
    const [compareMode, setCompareMode] = useState<'SLIDE' | 'TOGGLE'>('SLIDE');
    const [isShowingOriginal, setIsShowingOriginal] = useState(false);

    // FULL SCREEN MODAL STATE
    const [showFsModal, setShowFsModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setOriginalImage(event.target?.result as string);
                setStep('MARK');
                setMarkers([]);
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = (e: React.PointerEvent) => {
        if (step !== 'MARK' && step !== 'CONFIGURE') return;
        if (!imageRef.current || (e.target as HTMLElement).closest('button')) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) setPendingMarker({ x, y });
    };

    const confirmMarker = (label: string) => {
        if (pendingMarker) {
            setMarkers([...markers, { ...pendingMarker, label, customLabel: label }]);
            setPendingMarker(null);
            if (markers.length === 0) setStep('CONFIGURE');
        }
    };

    const startVisualization = async (customPrompt?: string) => {
        if (!originalImage || markers.length === 0) return;
        setIsLoading(true);
        setErrorInfo(null);
        try {
            const imageToProcess = (step === 'RESULT' && resultImage && customPrompt) ? resultImage : originalImage;
            const response = await fetch('/api/ai/re-imager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageToProcess,
                    stoneType: selectedMaterial.name,
                    color: selectedTone.name,
                    finishType: selectedFinish,
                    prompt: customPrompt,
                    markers: markers
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || "AI Server Error");
            if (data.imageUrl) { setResultImage(data.imageUrl); setStep('RESULT'); }
            else { throw new Error("No image returned."); }
        } catch (err: any) {
            console.error(err);
            setErrorInfo({ message: err.message || "Failed to render." });
        } finally { setIsLoading(false); }
    };

    const download = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `LuxeStone-${Date.now()}.png`;
        link.click();
    };

    return (
        <>
            {/* FULL SCREEN RESULT MODAL */}
            {showFsModal && originalImage && resultImage && (
                <FullScreenResultModal
                    original={originalImage}
                    modified={resultImage}
                    onClose={() => setShowFsModal(false)}
                />
            )}

            <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800/50 shadow-2xl flex flex-col h-[850px]">

                {/* --- VISUALIZER HEADER --- */}
                <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center space-x-3">
                        {/* 2. USED THE IMPORTED LOGO HERE */}
                        <img
                            src={logoImg}
                            alt="LJ Stone Surfaces"
                            className="h-9 w-auto object-contain rounded-md"
                        />
                        <h2 className="text-lg font-bold uppercase tracking-tight">Stone<span className="text-amber-500">Vision</span></h2>
                    </div>
                    {step !== 'UPLOAD' && <button onClick={() => { setStep('UPLOAD'); setOriginalImage(null); setMarkers([]); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">New Project</button>}
                </header>

                <main className="flex-1 overflow-hidden p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 relative flex flex-col min-h-0">
                        {errorInfo && (
                            <div className="absolute top-4 left-4 right-4 z-50 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md animate-in slide-in-from-top">
                                <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-2"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>{errorInfo.message}</span>
                                <button onClick={() => setErrorInfo(null)} className="text-[10px] font-black uppercase bg-red-500/20 hover:bg-red-500/40 px-3 py-1 rounded">Dismiss</button>
                            </div>
                        )}

                        <div ref={containerRef} className="flex-1 bg-slate-900 rounded-2xl border border-slate-800/50 shadow-inner relative overflow-hidden flex items-center justify-center select-none">
                            {step === 'RESULT' && (
                                <div className="absolute top-4 right-4 z-40 flex items-center space-x-2 animate-in fade-in">
                                    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-1 border border-white/10 flex space-x-1 shadow-2xl">
                                        <button onClick={() => setCompareMode('SLIDE')} className={`p-2 rounded ${compareMode === 'SLIDE' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg></button>
                                        <button onClick={() => setCompareMode('TOGGLE')} className={`p-2 rounded ${compareMode === 'TOGGLE' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                    </div>
                                    <button onClick={download} className="bg-slate-900/80 backdrop-blur-md p-2.5 rounded-lg border border-white/10 hover:bg-slate-800 text-white shadow-xl"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>

                                    {/* FULL SCREEN TRIGGER */}
                                    <button onClick={() => setShowFsModal(true)} className="bg-slate-900/80 backdrop-blur-md p-2.5 rounded-lg border border-white/10 hover:bg-slate-800 text-white shadow-xl">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {isLoading && <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-6"></div><h3 className="text-xl font-black uppercase tracking-widest text-white">Rendering...</h3></div>}
                            {step === 'UPLOAD' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in zoom-in duration-300">
                                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700"><svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                                    <button onClick={() => fileInputRef.current?.click()} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-4 rounded-xl shadow-lg uppercase text-xs tracking-widest">Select Image</button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                </div>
                            )}
                            {(step === 'MARK' || step === 'CONFIGURE') && originalImage && (
                                <div className="relative w-full h-full flex items-center justify-center bg-black">
                                    <img ref={imageRef} src={originalImage} alt="Workspace" className="max-w-full max-h-full object-contain cursor-crosshair" onPointerUp={handleImageClick} />
                                    {markers.map((m, i) => (<div key={i} style={{ left: `${m.x}%`, top: `${m.y}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 z-30 group"><div className="w-6 h-6 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center shadow-lg"><span className="text-[10px] font-black text-slate-900">{i + 1}</span></div><button onClick={(e) => { e.stopPropagation(); setMarkers(markers.filter((_, idx) => idx !== i)); }} className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">REMOVE</button></div>))}
                                    {pendingMarker && <MarkerInputModal onConfirm={confirmMarker} onCancel={() => setPendingMarker(null)} />}
                                </div>
                            )}
                            {step === 'RESULT' && resultImage && originalImage && (
                                <div className="w-full h-full flex flex-col relative animate-in fade-in duration-700">
                                    {compareMode === 'SLIDE' ? <ComparisonSlider original={originalImage} modified={resultImage} /> : (
                                        <div className="relative w-full h-full cursor-pointer" onMouseDown={() => setIsShowingOriginal(true)} onMouseUp={() => setIsShowingOriginal(false)} onTouchStart={() => setIsShowingOriginal(true)} onTouchEnd={() => setIsShowingOriginal(false)}>
                                            <img src={isShowingOriginal ? originalImage : resultImage} alt="Vis" className="w-full h-full object-contain bg-black" />
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/70 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 pointer-events-none">{isShowingOriginal ? 'Original Photo' : 'Touch & Hold to Compare'}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col min-h-0 space-y-4">
                        {step === 'RESULT' ? (
                            <ChatInterface onSendMessage={startVisualization} isLoading={isLoading} />
                        ) : (
                            <div className="bg-slate-900 rounded-2xl border border-slate-800/50 p-6 flex-1 overflow-y-auto custom-scrollbar shadow-xl">
                                <div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">{step === 'UPLOAD' ? '1' : step === 'MARK' ? '2' : '3'}</div><h3 className="text-sm font-black uppercase tracking-widest text-slate-200">{step === 'UPLOAD' ? 'Start' : step === 'MARK' ? 'Markers' : 'Design'}</h3></div>
                                {(step === 'MARK' || step === 'CONFIGURE') && (
                                    <div className="space-y-6">
                                        <div><h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3">Surfaces ({markers.length})</h4>{markers.length === 0 ? (<div className="p-4 rounded-xl border-2 border-dashed border-slate-800 text-center text-[10px] text-slate-500 uppercase">Tap image to place markers</div>) : (<div className="space-y-2">{markers.map((m, i) => <div key={i} className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700"><span className="text-xs font-bold text-slate-300">#{i + 1} {m.customLabel}</span></div>)}</div>)}</div>
                                        <div className={step === 'CONFIGURE' ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3">Material</h4>
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {MATERIALS.map(m => (
                                                    <MaterialOptionItem key={m.id} material={m} isSelected={selectedMaterial.id === m.id} onSelect={setSelectedMaterial} />
                                                ))}
                                            </div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mt-6 mb-3">Tone Family</h4>
                                            <div className="grid grid-cols-2 gap-2">{STONE_TONES.map(t => (<button key={t.id} onClick={() => setSelectedTone(t)} className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${selectedTone.id === t.id ? 'bg-slate-700 border-white/20' : 'bg-slate-800 border-transparent opacity-60'}`}><div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.hex }} /><span className="text-[9px] font-bold uppercase">{t.name.split(' / ')[0]}</span></button>))}</div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mt-6 mb-3">Surface Finish</h4>
                                            <div className="flex bg-slate-800 p-1 rounded-xl">{FINISH_OPTIONS.map(f => (<button key={f} onClick={() => setSelectedFinish(f)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${selectedFinish === f ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>{f}</button>))}</div>
                                        </div>
                                        <button onClick={() => startVisualization()} disabled={markers.length === 0 || isLoading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black py-4 rounded-xl uppercase text-xs tracking-[0.2em] shadow-xl shadow-amber-500/10 transition-all mt-4">{isLoading ? 'Processing...' : 'Visualize'}</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default LuxeStoneVisualizer;