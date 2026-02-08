import React, { useState } from 'react';
import { Grid, ZoomIn, X } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import ZoomableView from './ZoomableView';

interface FullScreenResultModalProps {
    original: string;
    modified: string;
    onClose: () => void;
}

const FullScreenResultModal: React.FC<FullScreenResultModalProps> = ({
    original,
    modified,
    onClose
}) => {
    const [viewMode, setViewMode] = useState<'COMPARE' | 'ZOOM'>('COMPARE');

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-[100dvh] w-screen animate-in fade-in duration-500 overflow-hidden text-white">
            <div className="flex-1 w-full h-full relative overflow-hidden pb-40">
                {viewMode === 'COMPARE' ? (
                    <BeforeAfterSlider before={original} after={modified} className="w-full h-full" />
                ) : (
                    <ZoomableView src={modified} />
                )}
            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-[10000] flex items-center justify-between bg-secondary/90 backdrop-blur-2xl border border-white/5 p-3 rounded-2xl shadow-3xl animate-in slide-in-from-bottom-8">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('COMPARE')}
                        className={`flex items-center space-x-3 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'COMPARE' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Grid className="w-4 h-4" />
                        <span className="hidden sm:inline">Compare</span>
                    </button>
                    <button
                        onClick={() => setViewMode('ZOOM')}
                        className={`flex items-center space-x-3 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ZOOM' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ZoomIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Inspect</span>
                    </button>
                </div>
                <div className="w-px h-10 bg-white/10 mx-4" />
                <button
                    onClick={onClose}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-red-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    <span>Exit</span>
                </button>
            </div>

            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-40">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] whitespace-nowrap bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
                    {viewMode === 'COMPARE' ? 'Slide Center Handle' : 'Drag to explore textures'}
                </p>
            </div>
        </div>
    );
};

export default FullScreenResultModal;
