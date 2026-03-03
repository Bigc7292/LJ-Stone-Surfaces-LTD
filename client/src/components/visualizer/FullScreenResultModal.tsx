import React, { useState } from 'react';
import { Grid, ZoomIn, X, Video, RotateCw, RotateCcw, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import BeforeAfterSlider from './BeforeAfterSlider';
import ZoomableView from './ZoomableView';

interface FullScreenResultModalProps {
    original: string;
    modified: string;
    material: any;
    finish: string;
    tone: string;
    clockwiseVideo?: string | null;
    counterClockwiseVideo?: string | null;
    onClose: () => void;
}

const FullScreenResultModal: React.FC<FullScreenResultModalProps> = ({
    original,
    modified,
    material,
    finish,
    tone,
    clockwiseVideo,
    counterClockwiseVideo,
    onClose
}) => {
    const [viewMode, setViewMode] = useState<'COMPARE' | 'ZOOM' | 'VIDEO'>('COMPARE');
    const [showInfo, setShowInfo] = useState(true);
    const [muted, setMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef1 = React.useRef<HTMLVideoElement>(null);
    const videoRef2 = React.useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
        if (videoRef1.current) isPlaying ? videoRef1.current.pause() : videoRef1.current.play();
        if (videoRef2.current) isPlaying ? videoRef2.current.pause() : videoRef2.current.play();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-[100dvh] w-screen animate-in fade-in duration-500 overflow-hidden text-white">
            <div className="flex-1 w-full h-full relative overflow-hidden">
                {viewMode === 'COMPARE' && (
                    <BeforeAfterSlider before={original} after={modified} className="w-full h-full" />
                )}
                {viewMode === 'ZOOM' && (
                    <ZoomableView src={modified} />
                )}
                {viewMode === 'VIDEO' && (
                    <div className="flex gap-4 p-4 h-full">
                        <div className="flex-1 relative bg-black/40 rounded-3xl overflow-hidden border border-white/5 flex flex-col">
                            <video
                                ref={videoRef1}
                                src={clockwiseVideo || ''}
                                autoPlay
                                loop
                                muted={muted}
                                className="flex-1 w-full object-cover"
                            />
                            <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                                <RotateCw className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Clockwise Tour</span>
                            </div>
                        </div>
                        <div className="flex-1 relative bg-black/40 rounded-3xl overflow-hidden border border-white/5 flex flex-col">
                            <video
                                ref={videoRef2}
                                src={counterClockwiseVideo || ''}
                                autoPlay
                                loop
                                muted={muted}
                                className="flex-1 w-full object-cover"
                            />
                            <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                                <RotateCcw className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Counter-Clockwise Tour</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Material Info Overlay (Toggleable) */}
                {showInfo && (
                    <div className="absolute top-8 right-8 w-80 bg-black/60 backdrop-blur-3xl border border-white/10 p-8 rounded-[2rem] shadow-4xl z-[10001] animate-in slide-in-from-right-10">
                        <button
                            onClick={() => setShowInfo(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h4 className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">Material Profile</h4>
                        <h3 className="text-2xl font-serif italic text-white mb-6 underline decoration-primary/30 underline-offset-8">{material.name}</h3>
                        <p className="text-[11px] leading-relaxed text-slate-400 font-medium tracking-wide">
                            {material.description || `A premium selection featuring ${tone.toLowerCase()} tones. Perfect for high-end architectural surfaces.`}
                        </p>
                        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Finish: {finish}</div>
                            <div className="w-2 h-2 rounded-full bg-primary/40" />
                        </div>
                    </div>
                )}

                {!showInfo && (
                    <button
                        onClick={() => setShowInfo(true)}
                        className="absolute top-8 right-8 bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-primary hover:text-white z-[10001] transition-all"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
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
                    {(clockwiseVideo || counterClockwiseVideo) && (
                        <button
                            onClick={() => setViewMode('VIDEO')}
                            className={`flex items-center space-x-3 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'VIDEO' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Video className="w-4 h-4" />
                            <span className="hidden sm:inline">3D Walk</span>
                        </button>
                    )}
                </div>

                {viewMode === 'VIDEO' && (
                    <>
                        <div className="w-px h-10 bg-white/10 mx-2" />
                        <div className="flex gap-2">
                            <button
                                onClick={togglePlay}
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setMuted(!muted)}
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                            >
                                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </>
                )}
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
                    {viewMode === 'COMPARE' ? 'Slide Center Handle' : viewMode === 'ZOOM' ? 'Drag to explore textures' : 'Dual 3D Walkthrough View'}
                </p>
            </div>
        </div>
    );
};

export default FullScreenResultModal;
