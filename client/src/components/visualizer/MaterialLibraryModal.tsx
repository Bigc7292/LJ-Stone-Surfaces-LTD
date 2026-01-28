import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, ChevronDown, X, Grid } from 'lucide-react';

interface MaterialLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (m: any) => void;
    materials: any[];
}

const CATEGORIES = ['All', 'Marble', 'Quartz', 'Granite', 'Dekton'];

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

const MaterialLibraryModal: React.FC<MaterialLibraryModalProps> = ({ isOpen, onClose, onSelect, materials }) => {
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
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-secondary w-full max-w-6xl h-[90vh] rounded-[2rem] border border-white/5 shadow-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-secondary/50 shrink-0">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-white uppercase tracking-tight">Material <span className="text-primary italic">Atelier</span></h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Curated luxury surface collection</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-black/20 border-b border-white/5 shrink-0 space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search 'Calacatta', 'Black'..."
                                className="w-full bg-secondary border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all shadow-inner placeholder:text-slate-600 font-medium font-sans"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex bg-secondary p-1.5 rounded-2xl border border-white/5 shadow-inner">
                            {['All', 'Light', 'Dark', 'Warm'].map(tone => (
                                <button
                                    key={tone}
                                    onClick={() => setActiveTone(tone)}
                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTone === tone ? 'bg-primary text-primary-foreground shadow-lg' : 'text-slate-500 hover:text-white'
                                        }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {visibleMaterials.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => { onSelect(m); onClose(); }}
                                className="group flex flex-col bg-secondary rounded-2xl overflow-hidden border border-white/5 hover:border-primary transition-all hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] text-left relative"
                            >
                                <div className="aspect-[4/5] overflow-hidden relative w-full bg-black p-0.5 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-neutral-900/50"></div>
                                    <img
                                        src={m.swatchUrl}
                                        alt={m.name}
                                        className="w-full h-full object-cover relative z-10 group-hover:scale-110 transition-transform duration-700"
                                        loading="lazy"
                                    />
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <span className="bg-black/80 backdrop-blur px-3 py-1 rounded-lg text-[8px] font-black text-white uppercase border border-white/10 tracking-widest">
                                            3D Texture
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary">
                                    <h4 className="text-[11px] font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors font-sans uppercase tracking-wider">{m.name}</h4>
                                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.15em]">{m.category}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                    {visibleCount < filtered.length && (
                        <div className="mt-16 flex flex-col items-center justify-center pb-12">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 24)}
                                className="flex items-center gap-3 bg-secondary hover:bg-white/5 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all border border-white/10 group active:scale-95"
                            >
                                Discover More <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                            </button>
                            <p className="text-[9px] font-bold text-slate-600 mt-4 uppercase tracking-widest">Displaying {visibleCount} of {filtered.length} artisans</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaterialLibraryModal;
