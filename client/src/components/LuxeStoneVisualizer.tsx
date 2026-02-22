import React, { useState, useRef } from 'react';
import { Box, Play, Download, RefreshCw, Check, Video, ChevronRight, Upload, Maximize } from 'lucide-react';
import type { AppStep } from '@/types/visualizer';
import { STONE_LIBRARY_3D } from '@/data/stoneLibrary3D';
import { shuffleStones } from '@/data/stoneLibrary3D_utils';

// Import Modular Components
import FullScreenResultModal from './visualizer/FullScreenResultModal';
import MaterialLibraryModal from './visualizer/MaterialLibraryModal';
import SelectedMaterialCard from './visualizer/SelectedMaterialCard';
import BeforeAfterSlider from './visualizer/BeforeAfterSlider';

// --- CONSTANTS ---
const ALLOWED_CATEGORIES = ['Marble', 'Quartz', 'Granite', 'Dekton'];
const FILTERED_LIBRARY = STONE_LIBRARY_3D.filter((s: any) =>
    ALLOWED_CATEGORIES.includes(s.category) &&
    !s.name.toLowerCase().includes('tile') &&
    !s.category.toLowerCase().includes('tile')
);

const SAFE_LIBRARY = shuffleStones(FILTERED_LIBRARY.length > 0 ? FILTERED_LIBRARY : [
    { id: 'fallback', name: 'Loading Stones...', category: 'System', swatchUrl: '', texturePath: '', tone: 'Light' }
]);

const FINISH_OPTIONS = ['Polished', 'Honed', 'Leathered'];
const STONE_TONES = [
    { id: 'natural', name: 'Natural', hex: '#E2E8F0' },
    { id: 'cool', name: 'Cool', hex: '#94A3B8' },
    { id: 'warm', name: 'Warm', hex: '#D6D3D1' },
    { id: 'dramatic', name: 'Dramatic', hex: '#0F172A' },
];

type GrokAppStep = 'UPLOAD' | 'PROCESSING' | 'RESULT' | 'VIDEO_GEN' | 'VIDEO_DONE';

export const LuxeStoneVisualizer: React.FC = () => {
    // State management
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [step, setStep] = useState<GrokAppStep>('UPLOAD');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState(
        SAFE_LIBRARY.find(m => m.name === 'Taj Mahal Quartzite') || SAFE_LIBRARY[0]
    );
    const [selectedTone, setSelectedTone] = useState(STONE_TONES[0]);
    const [selectedFinish, setSelectedFinish] = useState('Polished');
    const [isLoading, setIsLoading] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [showFullScreen, setShowFullScreen] = useState(false);

    const [showLibraryModal, setShowLibraryModal] = useState(false);

    const baseInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Compress image to prevent massive payloads causing connection resets
    const compressImage = (dataUrl: string, maxDim = 1920, quality = 0.85): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    const ratio = Math.min(maxDim / width, maxDim / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = dataUrl;
        });
    };

    // Handlers
    const handleBaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('[Visualizer] No file selected');
            return;
        }

        console.log(`[Visualizer] Uploading: ${file.name} (${Math.round(file.size / 1024)}KB)`);
        setErrorInfo(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const dataUrl = event.target?.result as string;
                console.log('[Visualizer] File read complete. Starting compression...');

                const compressed = await compressImage(dataUrl);
                console.log('[Visualizer] Compression success. Updating state...');

                setBaseImage(compressed);
                console.log('[Visualizer] Base image state updated.');
            } catch (err: any) {
                console.error('[Visualizer] Upload error:', err);
                setErrorInfo({ message: `Upload failed: ${err.message || "Unknown error during processing"}` });
            }
        };

        reader.onerror = (err) => {
            console.error('[Visualizer] FileReader error:', err);
            setErrorInfo({ message: "Failed to read file from disk." });
        };

        reader.readAsDataURL(file);
    };

    const allUploadsComplete = !!baseImage && !!selectedMaterial;

    const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            console.warn('[Visualizer] Could not fetch stone swatch for reference');
            return null;
        }
    };

    const startGrokImageGeneration = async () => {
        if (!allUploadsComplete) return;

        setOriginalImage(baseImage);
        setIsLoading(true);
        setErrorInfo(null);
        setLoadingMessage('Loading stone reference...');

        try {
            // Fetch the stone swatch image and convert to base64 for Grok reference
            let stoneTextureBase64: string | null = null;
            if (selectedMaterial.swatchUrl) {
                setLoadingMessage('Preparing stone texture reference...');
                const rawSwatch = await fetchImageAsBase64(selectedMaterial.swatchUrl);
                if (rawSwatch) {
                    // Compress swatch to keep payload manageable (512px max, 80% quality)
                    stoneTextureBase64 = await compressImage(rawSwatch, 512, 0.80);
                    console.log('[Visualizer] Stone swatch loaded as reference image');
                }
            }

            setLoadingMessage('Grok AI analyzing surfaces...');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

            const response = await fetch('/api/grok/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomImage: baseImage,
                    stoneName: selectedMaterial.name,
                    stoneCategory: selectedMaterial.category,
                    stoneDescription: (selectedMaterial as any).description,
                    stoneTexture: selectedMaterial.swatchUrl,
                    stoneTextureBase64: stoneTextureBase64,
                    finishType: selectedFinish,
                    ambience: selectedTone.name,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (response.ok && data.imageUrl) {
                setResultImage(data.imageUrl);
                setStep('RESULT');
                setIsLoading(false);
            } else {
                throw new Error(data.message || "AI generation failed");
            }
        } catch (err: any) {
            console.error(err);
            setErrorInfo({ message: err.message || "Failed to generate image." });
            setIsLoading(false);
        }
    };

    const startVideoGeneration = async () => {
        if (!resultImage) return;

        setStep('VIDEO_GEN');
        setIsLoading(true);
        setErrorInfo(null);
        setLoadingMessage('Creating walkthrough video...');

        try {
            const response = await fetch('/api/grok/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transformedImage: resultImage,
                    duration: 10,
                    resolution: '720p'
                })
            });

            const data = await response.json();

            if (response.status === 202 && data.jobId) {
                pollVideoStatus(data.jobId);
            } else {
                throw new Error(data.message || "Video generation failed to start");
            }
        } catch (err: any) {
            console.error(err);
            setErrorInfo({ message: err.message || "Failed to start video generation." });
            setStep('RESULT');
            setIsLoading(false);
        }
    };

    const pollVideoStatus = async (jobId: string) => {
        const pollInterval = 3000;
        let attempts = 0;

        const poll = async () => {
            try {
                const response = await fetch(`/api/grok/video-status/${jobId}`);
                const data = await response.json();

                if (data.status === 'completed' && data.videoUrl) {
                    setVideoUrl(data.videoUrl);
                    setStep('VIDEO_DONE');
                    setIsLoading(false);
                } else if (data.status === 'failed') {
                    throw new Error(data.error || "Video generation failed.");
                } else {
                    attempts++;
                    const progress = Math.min(Math.round((attempts / 60) * 100), 98);
                    setLoadingMessage(`Rendering walkthrough... ${progress}%`);
                    setTimeout(poll, pollInterval);
                }
            } catch (err: any) {
                setErrorInfo({ message: err.message || "Video rendering failed." });
                setStep('RESULT');
                setIsLoading(false);
            }
        };
        setTimeout(poll, pollInterval);
    };

    const resetAll = () => {
        setStep('UPLOAD');
        setOriginalImage(null);
        setResultImage(null);
        setVideoUrl(null);
        setBaseImage(null);
        setErrorInfo(null);
    };

    return (
        <div className="bg-[#050505] text-foreground rounded-[2.5rem] overflow-hidden border border-white/5 shadow-4xl flex flex-col h-[900px] animate-in fade-in duration-500 max-w-7xl mx-auto font-sans">
            <MaterialLibraryModal
                isOpen={showLibraryModal}
                onClose={() => setShowLibraryModal(false)}
                onSelect={setSelectedMaterial}
                materials={SAFE_LIBRARY}
            />

            {/* Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl px-10 py-6 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center space-x-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                        <Box className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-black uppercase tracking-[0.2em] text-white leading-none">
                            Luxe <span className="text-primary italic">Visualizer</span>
                        </h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">
                            xAI Grok • Real-time Surface Transformation
                        </p>
                    </div>
                </div>
                {baseImage && (
                    <button onClick={resetAll} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                        Reset Workspace
                    </button>
                )}
            </header>

            <main className="flex-1 flex min-h-0 overflow-hidden">
                {/* 1. CONFIGURATION PANEL */}
                <aside className="w-[400px] flex flex-col bg-black/20 border-r border-white/5 p-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-10">
                        {/* Step 1: Upload */}
                        <section>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black border border-primary/20">01</div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Upload Room</h3>
                            </div>

                            <div
                                onClick={() => baseInputRef.current?.click()}
                                className={`group relative w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ${baseImage ? 'border-primary/40 bg-primary/5' : 'border-white/10 bg-white/5 hover:border-primary/50'}`}
                            >
                                {baseImage ? (
                                    <div className="absolute inset-0 p-2">
                                        <img src={baseImage} alt="Base" className="w-full h-full object-cover rounded-2xl shadow-2xl" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                            <Upload className="w-8 h-8 text-white animate-bounce" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 text-slate-600 mb-4 group-hover:text-primary transition-colors mx-auto" />
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">Select Image</span>
                                    </div>
                                )}
                                <input type="file" ref={baseInputRef} onChange={handleBaseUpload} className="hidden" accept="image/*" />
                            </div>
                        </section>

                        {/* Step 2: Material Selection */}
                        <section className={!baseImage ? 'opacity-30 pointer-events-none transition-opacity' : 'transition-opacity'}>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black border border-primary/20">02</div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Choose Stone</h3>
                            </div>

                            <SelectedMaterialCard
                                material={selectedMaterial}
                                onClick={() => setShowLibraryModal(true)}
                                isSelected={true}
                            />

                            <div className="mt-8 space-y-6">
                                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 space-x-1 shadow-inner">
                                    {FINISH_OPTIONS.map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setSelectedFinish(f)}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedFinish === f ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={startGrokImageGeneration}
                                    disabled={!allUploadsComplete || isLoading}
                                    className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${allUploadsComplete ? 'bg-primary text-black shadow-xl shadow-primary/20 hover:scale-[1.02]' : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'}`}
                                >
                                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Box className="w-4 h-4" />}
                                    Apply Transformation
                                </button>
                            </div>
                        </section>

                        {/* Error Info */}
                        {errorInfo && (
                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-200">
                                <p className="text-[10px] font-black uppercase tracking-widest">{errorInfo.message}</p>
                                <button onClick={() => setErrorInfo(null)} className="mt-3 text-[9px] font-black uppercase underline tracking-widest opacity-60 hover:opacity-100">Dismiss</button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* 2. RESULTS AREA */}
                <section className="flex-1 bg-black relative flex flex-col p-8 overflow-hidden">
                    {!resultImage && !isLoading ? (
                        <div className="flex-1 border border-white/5 rounded-[3rem] bg-black/40 flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-700">
                            <Box className="w-20 h-20 text-white/10 mb-8" />
                            <h3 className="text-4xl font-serif italic text-white/20 tracking-widest uppercase mb-4">Awaiting Input</h3>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/5">Upload space or select stone to begin</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0 space-y-6">
                            {/* STATIC IMAGE PANEL (Always visible if exists) */}
                            <div className={`relative rounded-[3rem] border border-white/10 overflow-hidden shadow-4xl transition-all duration-700 ${step === 'VIDEO_DONE' ? 'flex-1' : 'flex-1'}`}>
                                {isLoading && !resultImage ? (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-50 flex flex-col items-center justify-center">
                                        <div className="w-24 h-24 border-[8px] border-primary/10 border-t-primary rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(212,175,55,0.2)]" />
                                        <h3 className="text-2xl font-serif italic text-white tracking-[0.2em] animate-pulse">{loadingMessage}</h3>
                                    </div>
                                ) : resultImage && originalImage ? (
                                    <BeforeAfterSlider
                                        before={originalImage}
                                        after={resultImage}
                                        className="w-full h-full"
                                    />
                                ) : null}
                            </div>

                            {/* VIDEO VIEWPORT (Only show if gen started or done) */}
                            {(step === 'VIDEO_GEN' || step === 'VIDEO_DONE') && (
                                <div className="h-[300px] relative rounded-[3rem] border border-primary/20 bg-black overflow-hidden shadow-4xl animate-in slide-in-from-bottom-20 duration-1000">
                                    {step === 'VIDEO_GEN' ? (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl z-40 flex flex-col items-center justify-center">
                                            <Video className="w-12 h-12 text-primary animate-pulse mb-6" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{loadingMessage}</p>
                                        </div>
                                    ) : videoUrl ? (
                                        <video
                                            src={videoUrl}
                                            autoPlay
                                            loop
                                            muted
                                            className="w-full h-full object-contain"
                                        />
                                    ) : null}

                                    <div className="absolute top-6 left-10 z-50 bg-black/60 backdrop-blur-xl px-5 py-2 rounded-full border border-white/10 flex items-center gap-3">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white">Live 3D Walkthrough View</span>
                                    </div>
                                </div>
                            )}

                            {/* CONTROLS BAR (Bottom of results) */}
                            {resultImage && (step === 'RESULT' || step === 'VIDEO_DONE') && (
                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
                                    {step === 'RESULT' && (
                                        <button
                                            onClick={startVideoGeneration}
                                            className="bg-primary hover:bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 transition-all shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 group"
                                        >
                                            <Play className="w-5 h-5 fill-black group-hover:scale-110 transition-transform" />
                                            Walk Around the Room
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowFullScreen(true)}
                                        className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/10 text-white px-8 py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3"
                                    >
                                        <Maximize className="w-4 h-4" />
                                        Full Screen
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const blob = await fetch(resultImage).then(r => r.blob());
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `LJStone-Design.png`;
                                            a.click();
                                        }}
                                        className="bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/10 text-white px-8 py-5 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-3"
                                    >
                                        <Download className="w-4 h-4" />
                                        Save Design
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* FULLSCREEN MODAL */}
                    {showFullScreen && originalImage && resultImage && (
                        <FullScreenResultModal
                            original={originalImage}
                            modified={resultImage}
                            onClose={() => setShowFullScreen(false)}
                        />
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="py-6 px-12 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex justify-between items-center shrink-0">
                <p className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-500 flex items-center gap-4">
                    Luxe Stone Architects <span className="w-1.5 h-1.5 bg-primary/40 rounded-full" /> Grok AI v1.0 <span className="w-1.5 h-1.5 bg-primary/40 rounded-full" /> Walkthrough Mode Enabled
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Connectivity</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                </div>
            </footer>
        </div>
    );
};

export default LuxeStoneVisualizer;
