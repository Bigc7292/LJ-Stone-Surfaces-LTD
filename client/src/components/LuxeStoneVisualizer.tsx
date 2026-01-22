import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Grid, X, Filter, ChevronDown, ZoomIn, Eye, Minus, Plus } from 'lucide-react';
import type { AppStep } from '@/types/visualizer';
// IMPORT YOUR DATA
import libraryData from '@/data/stoneLibrary.json';

// Fallback to prevent crashes if data is missing
const SAFE_LIBRARY = libraryData.length > 0 ? libraryData : [
    { id: 'fallback', name: 'Loading Stones...', category: 'System', texture: 'Matte', swatchUrl: '', description: '' }
];

// --- CONSTANTS ---
const FINISH_OPTIONS = ['Polished', 'Honed', 'Leathered'];
const STONE_TONES = [
    { id: 'natural', name: 'Natural / Unchanged', hex: '#e2e8f0' },
    { id: 'cool', name: 'Cool / Grey', hex: '#94a3b8' },
    { id: 'warm', name: 'Warm / Beige', hex: '#d6d3d1' },
    { id: 'dramatic', name: 'High Contrast', hex: '#0f172a' },
];

const CATEGORIES = ['All', ...Array.from(new Set(SAFE_LIBRARY.map((s: any) => s.category)))];

// --- TONE LOGIC ---
const TONE_KEYWORDS: Record<string, string[]> = {
    'Light': ['white', 'cream', 'snow', 'light', 'bianco', 'vanilla', 'cotton', 'cloud', 'pure', 'mist', 'calacatta', 'statuario'],
    'Dark': ['black', 'dark', 'charcoal', 'grey', 'gray', 'nero', 'notte', 'thunder', 'storm', 'shadow', 'graphite', 'jet', 'marquina', 'soapstone'],
    'Warm': ['beige', 'gold', 'brown', 'earth', 'sand', 'honey', 'oak', 'crema', 'ivory', 'taupe', 'brass'],
    'Cool': ['blue', 'steel', 'concrete', 'silver', 'platinum', 'ice', 'sky']
};

const checkTone = (stone: any, tone: string) => {
    if (tone === 'All') return true;
    const text = (stone.name + ' ' + (stone.description || '')).toLowerCase();
    return TONE_KEYWORDS[tone].some(keyword => text.includes(keyword));
};

// ============================================================================
// 1. COMPONENT: ZOOM & PAN VIEW (REPLACES MAGNIFIER)
// ============================================================================
const ZoomableView: React.FC<{ src: string }> = ({ src }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Limit zoom to 4x to maintain stone texture quality
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => {
        const nextScale = Math.max(scale - 0.5, 1);
        setScale(nextScale);
        if (nextScale === 1) setPosition({ x: 0, y: 0 });
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || scale <= 1) return;
        setPosition({
            x: e.clientX - startPos.x,
            y: e.clientY - startPos.y
        });
    };

    const handlePointerUp = () => setIsDragging(false);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                className="w-full h-full flex items-center justify-center"
            >
                <img
                    src={src}
                    alt="Zoomable Result"
                    className="max-h-full max-w-full object-contain pointer-events-none"
                    draggable={false}
                />
            </div>

            {/* Floating Zoom Controls Inside the View Area */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl z-[110]">
                <button
                    onClick={handleZoomOut}
                    className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <div className="text-[10px] font-black text-amber-500 w-12 text-center uppercase tracking-widest">
                    {Math.round(scale * 100)}%
                </div>
                <button
                    onClick={handleZoomIn}
                    className="p-3 hover:bg-white/10 rounded-xl text-white transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// 2. COMPONENT: COMPARISON SLIDER
// ============================================================================
const ComparisonSlider: React.FC<{ original: string; modified: string; isFullScreen?: boolean }> = ({ original, modified, isFullScreen = false }) => {
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
            if (e.cancelable) e.preventDefault();
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            handleMove(clientX);
        };
        const onUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', onMove, { passive: false });
            window.addEventListener('touchmove', onMove, { passive: false });
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
            className={`relative w-full h-full select-none overflow-hidden cursor-ew-resize touch-none group ${isFullScreen ? 'bg-black' : ''}`}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
        >
            <img src={modified} alt="After" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}>
                <img src={original} alt="Before" className="absolute inset-0 w-full h-full object-contain" />
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
// 3. COMPONENT: FULL SCREEN MODAL (UPDATED FOR ZOOM)
// ============================================================================
const FullScreenResultModal: React.FC<{
    original: string;
    modified: string;
    onClose: () => void;
}> = ({ original, modified, onClose }) => {
    // viewMode updated to use 'ZOOM' instead of 'MAGNIFY'
    const [viewMode, setViewMode] = useState<'COMPARE' | 'ZOOM'>('COMPARE');

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-[100dvh] w-screen animate-in fade-in duration-300">

            {/* Main View Area - pb-32 allows space for zoom buttons */}
            <div className="flex-1 w-full h-full relative overflow-hidden pb-32">
                {viewMode === 'COMPARE' ? (
                    <ComparisonSlider original={original} modified={modified} isFullScreen={true} />
                ) : (
                    <ZoomableView src={modified} />
                )}
            </div>

            {/* FLOATING BOTTOM ACTION BAR */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-[10000] flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4">

                {/* Left side: View Toggles */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setViewMode('COMPARE')}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'COMPARE' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Grid className="w-4 h-4" />
                        <span className="hidden sm:inline">Compare</span>
                    </button>
                    <button
                        onClick={() => setViewMode('ZOOM')}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'ZOOM' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ZoomIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Inspect</span>
                    </button>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-8 bg-white/10 mx-2" />

                {/* Right side: RED EXIT Button */}
                <button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                    <X className="w-4 h-4" />
                    <span>Exit</span>
                </button>
            </div>

            {/* Small Hint Text */}
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-none z-40">
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                    {viewMode === 'COMPARE' ? 'Slide Center Bar' : 'Drag Image to Pan'}
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// 4. COMPONENT: MATERIAL LIBRARY MODAL
// ============================================================================
const MaterialLibraryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (m: any) => void;
    materials: any[]
}> = ({ isOpen, onClose, onSelect, materials }) => {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeTone, setActiveTone] = useState('All');
    const [visibleCount, setVisibleCount] = useState(18);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVisibleCount(18);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [search, activeCategory, activeTone]);

    const filtered = useMemo(() => {
        return materials.filter(m => {
            const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                (m.category && m.category.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
            const matchesTone = checkTone(m, activeTone);
            return matchesSearch && matchesCategory && matchesTone;
        });
    }, [materials, search, activeCategory, activeTone]);

    const visibleMaterials = filtered.slice(0, visibleCount);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Stone <span className="text-amber-500">Library</span></h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">Select a material to apply to your markers</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 bg-slate-950/50 border-b border-slate-800 shrink-0 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search 'Calacatta', 'Black', 'Marble'..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                            {['All', 'Light', 'Dark', 'Warm'].map(tone => (
                                <button
                                    key={tone}
                                    onClick={() => setActiveTone(tone)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTone === tone ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {CATEGORIES.map((cat: any) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-slate-800 text-white border-slate-600' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-800/50'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {visibleMaterials.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => { onSelect(m); onClose(); }}
                                className="group flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] text-left relative"
                            >
                                <div className="aspect-square overflow-hidden relative w-full bg-slate-950 p-2 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-neutral-900"></div>
                                    <img
                                        src={m.swatchUrl}
                                        alt={m.name}
                                        className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('bg-slate-800');
                                        }}
                                    />
                                    <div className="absolute top-2 left-2 z-20">
                                        <span className="bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase border border-white/10">
                                            {m.id.startsWith('cs') ? 'Caesarstone' : m.id.startsWith('cos') ? 'Cosentino' : 'Gemini'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-amber-500 transition-colors">{m.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{m.category}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {visibleCount < filtered.length && (
                        <div className="mt-12 flex flex-col items-center justify-center pb-8">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 24)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all border border-slate-700"
                            >
                                Load More <ChevronDown className="w-4 h-4" />
                            </button>
                            <p className="text-[10px] text-slate-500 mt-2">Showing {visibleCount} of {filtered.length} matches</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 5. COMPONENT: CHAT INTERFACE
// ============================================================================
const ChatInterface: React.FC<{ onSendMessage: (msg: string) => void; isLoading: boolean; }> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const send = () => { if (!input.trim() || isLoading) return; onSendMessage(input); setInput(''); };

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
                        <p className="mt-2 text-amber-500/80 font-bold">Try typing:</p>
                        <ul className="mt-1 space-y-1 text-slate-400"><li>• "Make the veins darker"</li><li>• "Apply to all matching walls"</li></ul>
                    </div>
                </div>
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl p-1 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/50 transition-all">
                    <input className="flex-1 bg-transparent border-none text-xs text-white px-3 py-3 focus:outline-none placeholder:text-slate-600 font-bold uppercase tracking-wide" placeholder="TYPE INSTRUCTION..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} disabled={isLoading} />
                    <button onClick={send} disabled={isLoading || !input.trim()} className="p-3 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg">
                        {isLoading ? <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// 6. COMPONENT: SELECTED MATERIAL CARD
// ============================================================================
const SelectedMaterialCard: React.FC<{ material: any; onClick: () => void }> = ({ material, onClick }) => (
    <button
        onClick={onClick}
        className="group w-full p-0 rounded-2xl border border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-left transition-all relative flex items-center min-h-[80px]"
    >
        <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-amber-500 animate-pulse" />
                <span className="font-black tracking-widest text-[10px] uppercase leading-none text-amber-500">
                    {material.name}
                </span>
            </div>
            <span className="text-[8px] opacity-60 uppercase tracking-widest font-bold mt-1 ml-3.5 text-slate-300">
                {material.category} • {material.texture}
            </span>
        </div>
        <div className="relative w-20 h-[80px] border-l border-amber-500/30 shrink-0 overflow-hidden rounded-r-2xl">
            {material.swatchUrl ? <img src={material.swatchUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-900/50"><Grid className="w-6 h-6 text-amber-500/50" /></div>}
        </div>
    </button>
);

// ============================================================================
// 7. COMPONENT: MARKER INPUT MODAL
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
// 8. MAIN COMPONENT: LUXE STONE VISUALIZER
// ============================================================================
export const LuxeStoneVisualizer: React.FC = () => {
    const [angleAFile, setAngleAFile] = useState<string | null>(null);
    const [angleBFile, setAngleBFile] = useState<string | null>(null);
    const [styleReferenceFile, setStyleReferenceFile] = useState<string | null>(null);
    const [step, setStep] = useState<AppStep>('UPLOAD');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState(SAFE_LIBRARY[0]);
    const [selectedTone, setSelectedTone] = useState(STONE_TONES[0]);
    const [selectedFinish, setSelectedFinish] = useState('Polished');
    const [isLoading, setIsLoading] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string } | null>(null);
    const [compareMode, setCompareMode] = useState<'SLIDE' | 'TOGGLE'>('SLIDE');
    const [isShowingOriginal, setIsShowingOriginal] = useState(false);
    const [showFsModal, setShowFsModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);

    const angleAInputRef = useRef<HTMLInputElement>(null);
    const angleBInputRef = useRef<HTMLInputElement>(null);
    const styleReferenceInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAngleAUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setAngleAFile(event.target?.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleAngleBUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setAngleBFile(event.target?.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleStyleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setStyleReferenceFile(event.target?.result as string); };
            reader.readAsDataURL(file);
        }
    };

    // Check if all three images are uploaded to proceed
    const allUploadsComplete = angleAFile && angleBFile && styleReferenceFile;

    // Start automated AI analysis (no manual marking required)
    const startAutoAnalysis = async () => {
        if (!allUploadsComplete) return;

        setOriginalImage(angleAFile);
        setStep('PROCESSING');
        setIsLoading(true);
        setErrorInfo(null);
        setResultImage(null);

        try {
            const response = await fetch('/api/ai/re-imager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: angleAFile,
                    imagePath2: angleBFile,
                    styleReference: styleReferenceFile,
                    stoneSlabPath: selectedMaterial.swatchUrl,
                    stoneType: selectedMaterial.name,
                    stoneDescription: (selectedMaterial as any).description || `A ${selectedMaterial.texture} stone surface named ${selectedMaterial.name}`,
                    color: selectedTone.name,
                    finishType: selectedFinish,
                    autoDetectSurfaces: true // AI will automatically detect surfaces
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || "AI Server Error");
            if (data.imageUrl) {
                setResultImage(data.imageUrl);
                setStep('RESULT');
            } else {
                throw new Error("No image returned.");
            }
        } catch (err: any) {
            console.error(err);
            setErrorInfo({ message: err.message || "Failed to render." });
            setStep('UPLOAD'); // Return to upload on error
        } finally {
            setIsLoading(false);
        }
    };

    // Refinement visualization (for chat-based adjustments after initial result)
    const refineVisualization = async (customPrompt?: string) => {
        if (!originalImage || !resultImage) return;
        setIsLoading(true);
        setErrorInfo(null);
        try {
            const response = await fetch('/api/ai/re-imager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: resultImage,
                    imagePath2: angleBFile,
                    styleReference: styleReferenceFile,
                    stoneSlabPath: selectedMaterial.swatchUrl,
                    stoneType: selectedMaterial.name,
                    stoneDescription: (selectedMaterial as any).description || `A ${selectedMaterial.texture} stone surface named ${selectedMaterial.name}`,
                    color: selectedTone.name,
                    finishType: selectedFinish,
                    prompt: customPrompt,
                    autoDetectSurfaces: true
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || "AI Server Error");
            if (data.imageUrl) { setResultImage(data.imageUrl); }
            else { throw new Error("No image returned."); }
        } catch (err: any) { console.error(err); setErrorInfo({ message: err.message || "Failed to render." }); } finally { setIsLoading(false); }
    };

    const download = () => { if (!resultImage) return; const link = document.createElement('a'); link.href = resultImage; link.download = `LuxeStone-${Date.now()}.png`; link.click(); };

    return (
        <>
            {showFsModal && originalImage && resultImage && (
                <FullScreenResultModal
                    original={originalImage}
                    modified={resultImage}
                    onClose={() => setShowFsModal(false)}
                />
            )}

            <MaterialLibraryModal
                isOpen={showLibraryModal}
                onClose={() => setShowLibraryModal(false)}
                onSelect={setSelectedMaterial}
                materials={SAFE_LIBRARY}
            />

            <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800/50 shadow-2xl flex flex-col h-[850px]">
                <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center space-x-3">
                        <img
                            src="https://lj-stone-app-64679742754.us-central1.run.app/assets/Screenshot_20251226_103451_WhatsAppBusiness_1766730996434-CH0FGqgL.jpg"
                            alt="LJ Stone Surfaces"
                            className="h-10 w-auto object-contain rounded-md"
                        />
                        <h2 className="text-lg font-bold uppercase tracking-tight text-white">
                            LJ Stone <span className="text-amber-500">Visualizer</span>
                        </h2>
                    </div>
                    {step !== 'UPLOAD' && <button onClick={() => { setStep('UPLOAD'); setOriginalImage(null); setResultImage(null); setAngleAFile(null); setAngleBFile(null); setStyleReferenceFile(null); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5">New Project</button>}
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
                                    <button onClick={() => setShowFsModal(true)} className="bg-slate-900/80 backdrop-blur-md p-2.5 rounded-lg border border-white/10 hover:bg-slate-800 text-white shadow-xl"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></button>
                                </div>
                            )}
                            {isLoading && <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"><div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-6"></div><h3 className="text-xl font-black uppercase tracking-widest text-white">Rendering...</h3></div>}
                            {step === 'UPLOAD' && (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
                                    <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
                                        {/* Slot 1: Primary Room View (0°) */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                onClick={() => angleAInputRef.current?.click()}
                                                className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-amber-500 hover:bg-amber-500/5 ${angleAFile ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50'}`}
                                            >
                                                {angleAFile ? (
                                                    <img src={angleAFile} alt="Primary view" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <>
                                                        <svg className="w-8 h-8 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Click to Upload</span>
                                                    </>
                                                )}
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-3 text-center">Primary Room View (0°)</h4>
                                            <p className="text-[9px] text-slate-500 mt-1 text-center">Main angle of your space</p>
                                            <input type="file" ref={angleAInputRef} onChange={handleAngleAUpload} className="hidden" accept="image/*" />
                                        </div>

                                        {/* Slot 2: Opposite Room View (180°) */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                onClick={() => angleBInputRef.current?.click()}
                                                className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-amber-500 hover:bg-amber-500/5 ${angleBFile ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50'}`}
                                            >
                                                {angleBFile ? (
                                                    <img src={angleBFile} alt="Opposite view" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <>
                                                        <svg className="w-8 h-8 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Click to Upload</span>
                                                    </>
                                                )}
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-3 text-center">Opposite Room View (180°)</h4>
                                            <p className="text-[9px] text-slate-500 mt-1 text-center">Opposite angle for depth</p>
                                            <input type="file" ref={angleBInputRef} onChange={handleAngleBUpload} className="hidden" accept="image/*" />
                                        </div>

                                        {/* Slot 3: Jack Davis Style Inspiration */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                onClick={() => styleReferenceInputRef.current?.click()}
                                                className={`w-full aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-amber-500 hover:bg-amber-500/5 ${styleReferenceFile ? 'border-green-500 bg-green-500/10' : 'border-slate-700 bg-slate-800/50'}`}
                                            >
                                                {styleReferenceFile ? (
                                                    <img src={styleReferenceFile} alt="Style reference" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <>
                                                        <svg className="w-8 h-8 text-amber-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Click to Upload</span>
                                                    </>
                                                )}
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-3 text-center">Jack Davis Style Inspiration</h4>
                                            <p className="text-[9px] text-slate-500 mt-1 text-center">Portfolio stone reference</p>
                                            <input type="file" ref={styleReferenceInputRef} onChange={handleStyleReferenceUpload} className="hidden" accept="image/*" />
                                        </div>
                                    </div>

                                    {/* Generate 360° Design Button - Only enabled when all 3 are uploaded */}
                                    <button
                                        onClick={startAutoAnalysis}
                                        disabled={!allUploadsComplete}
                                        className={`mt-8 px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${allUploadsComplete ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/30' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                                    >
                                        {allUploadsComplete ? '✨ Generate 360° Design' : `Upload All 3 Images (${[angleAFile, angleBFile, styleReferenceFile].filter(Boolean).length}/3)`}
                                    </button>
                                </div>
                            )}
                            {step === 'PROCESSING' && (
                                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in duration-500">
                                    {/* Luxury Loading Animation */}
                                    <div className="relative w-32 h-32 mb-8">
                                        <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
                                        <div className="absolute inset-4 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                        <div className="absolute inset-8 border-4 border-transparent border-t-amber-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-[0.3em] text-white mb-3">Analyzing</h3>
                                    <p className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-6">Jack's AI is analyzing your space...</p>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-6">Detecting surfaces • Applying stone textures • Rendering 360°</p>
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
                        {step === 'RESULT' ? (<ChatInterface onSendMessage={refineVisualization} isLoading={isLoading} />) : (
                            <div className="bg-slate-900 rounded-2xl border border-slate-800/50 p-6 flex-1 overflow-y-auto custom-scrollbar shadow-xl">
                                <div className="flex items-center space-x-3 mb-6"><div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs">{step === 'UPLOAD' ? '1' : step === 'PROCESSING' ? '2' : '3'}</div><h3 className="text-sm font-black uppercase tracking-widest text-slate-200">{step === 'UPLOAD' ? 'Upload Images' : step === 'PROCESSING' ? 'AI Processing' : 'View Design'}</h3></div>
                                {step === 'UPLOAD' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3">Material Selection</h4>
                                            <SelectedMaterialCard
                                                material={selectedMaterial}
                                                onClick={() => setShowLibraryModal(true)}
                                            />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3">Tone Family</h4>
                                            <div className="grid grid-cols-2 gap-2">{STONE_TONES.map(t => (<button key={t.id} onClick={() => setSelectedTone(t)} className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${selectedTone.id === t.id ? 'bg-slate-700 border-white/20' : 'bg-slate-800 border-transparent opacity-60'}`}><div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: t.hex }} /><span className="text-[9px] font-bold uppercase">{t.name.split(' / ')[0]}</span></button>))}</div>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-3">Surface Finish</h4>
                                            <div className="flex bg-slate-800 p-1 rounded-xl">{FINISH_OPTIONS.map(f => (<button key={f} onClick={() => setSelectedFinish(f)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-lg transition-all ${selectedFinish === f ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>{f}</button>))}</div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-800">
                                            <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center">Upload all 3 images to generate your 360° design</p>
                                        </div>
                                    </div>
                                )}
                                {step === 'PROCESSING' && (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest">AI is working...</p>
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