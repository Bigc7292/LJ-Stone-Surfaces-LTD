import React, { useState, useRef } from 'react';
import { Box, Cuboid } from 'lucide-react';
import type { AppStep } from '@/types/visualizer';
import { STONE_LIBRARY_3D } from '@/data/stoneLibrary3D';
import { shuffleStones } from '@/data/stoneLibrary3D_utils';

// Import Modular Components
import ZoomableView from './visualizer/ZoomableView';
import ComparisonSlider from './visualizer/ComparisonSlider';
import FullScreenResultModal from './visualizer/FullScreenResultModal';
import MaterialLibraryModal from './visualizer/MaterialLibraryModal';
import ChatInterface from './visualizer/ChatInterface';
import SelectedMaterialCard from './visualizer/SelectedMaterialCard';
import ThreeCanvas from './visualizer/ThreeCanvas';

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

export const LuxeStoneVisualizer: React.FC = () => {
    // State management
    const [baseImage, setBaseImage] = useState<string | null>(null);
    const [depthImage, setDepthImage] = useState<string | null>(null);
    const [step, setStep] = useState<AppStep>('UPLOAD');
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [selectedMaterial, setSelectedMaterial] = useState(
        SAFE_LIBRARY.find(m => m.name === 'Taj Mahal Quartzite') || SAFE_LIBRARY[0]
    );
    const [selectedTone, setSelectedTone] = useState(STONE_TONES[0]);
    const [selectedFinish, setSelectedFinish] = useState('Polished');
    const [isLoading, setIsLoading] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string } | null>(null);
    const [compareMode, setCompareMode] = useState<'SLIDE' | 'TOGGLE'>('SLIDE');

    const [showFsModal, setShowFsModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);

    // 3D Scene Data State
    const [sceneDepthMap, setSceneDepthMap] = useState<string | null>(null);
    const [countertopMask, setCountertopMask] = useState<string | null>(null);
    const [use3DView, setUse3DView] = useState(true);
    const baseInputRef = useRef<HTMLInputElement>(null);
    const depthInputRef = useRef<HTMLInputElement>(null);

    // Handlers
    const handleBaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setBaseImage(event.target?.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleDepthUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { setDepthImage(event.target?.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const allUploadsComplete = baseImage && depthImage && selectedMaterial;

    const pollJobStatus = async (jobId: string, isRefine: boolean = false) => {
        const pollInterval = 2000;
        const maxAttempts = 60; // 2 minutes
        let attempts = 0;

        const poll = async () => {
            try {
                const response = await fetch(`/api/re-imager/status/${jobId}`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Failed to check job status");

                if (data.status === 'completed') {
                    if (data.imageUrl) {
                        setResultImage(data.imageUrl);
                        setStep('RESULT');
                        setIsLoading(false);
                    } else {
                        throw new Error("No image returned.");
                    }
                } else if (data.status === 'failed') {
                    throw new Error(data.error || "AI Rendering failed.");
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(poll, pollInterval);
                } else {
                    throw new Error("Rendering timeout. Please try again.");
                }
            } catch (err: any) {
                console.error(err);
                setErrorInfo({ message: err.message || "Failed to render." });
                if (!isRefine) setStep('UPLOAD');
                setIsLoading(false);
            }
        };

        setTimeout(poll, pollInterval);
    };


    // Generate scene data (depth map and countertop mask) for 3D visualization
    const generateSceneData = async () => {
        if (!baseImage || !depthImage) return;

        try {
            const response = await fetch('/api/ai/scene-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primary_room: baseImage,
                    offset_room: depthImage,
                })
            });
            const data = await response.json();

            if (response.ok && data.depthMap && data.countertopMask) {
                setSceneDepthMap(data.depthMap);
                setCountertopMask(data.countertopMask);
            }
        } catch (err) {
            console.error('Failed to generate scene data:', err);
        }
    };
    const startAutoAnalysis = async () => {
        if (!allUploadsComplete) return;

        setOriginalImage(baseImage);
        setStep('PROCESSING');
        setIsLoading(true);
        setErrorInfo(null);
        setResultImage(null);
        setSceneDepthMap(null);
        setCountertopMask(null);

        try {
            const response = await fetch('/api/ai/re-imager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primary_room: baseImage,
                    offset_room: depthImage,
                    stone_texture: selectedMaterial.swatchUrl,
                    stoneType: selectedMaterial.name,
                    stoneCategory: selectedMaterial.category,
                    color: selectedTone.name,
                    finishType: selectedFinish,
                    autoDetectSurfaces: true,
                    useHighResTextures: true,
                })
            });
            const data = await response.json();

            if (response.status === 202 && data.jobId) {
                pollJobStatus(data.jobId);
            } else if (response.ok && data.imageUrl) {
                setResultImage(data.imageUrl);
                // Generate scene data for 3D view
                generateSceneData();
                setStep('RESULT');
                setIsLoading(false);
            } else {
                throw new Error(data.details || data.message || "AI Server Error");
            }
        } catch (err: any) {
            console.error(err);
            setErrorInfo({ message: err.message || "Failed to render." });
            setStep('UPLOAD');
            setIsLoading(false);
        }
    };

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
                    primary_room: baseImage,
                    offset_room: depthImage,
                    stone_texture: selectedMaterial.swatchUrl,
                    stoneType: selectedMaterial.name,
                    color: selectedTone.name,
                    finishType: selectedFinish,
                    prompt: customPrompt,
                    autoDetectSurfaces: true,
                    useHighResTextures: true
                })
            });
            const data = await response.json();

            if (response.status === 202 && data.jobId) {
                pollJobStatus(data.jobId, true);
            } else if (response.ok && data.imageUrl) {
                setResultImage(data.imageUrl);
                setIsLoading(false);
            } else {
                throw new Error(data.details || data.message || "AI Server Error");
            }
        } catch (err: any) {
            console.error(err);
            setErrorInfo({ message: err.message || "Failed to render." });
            setIsLoading(false);
        }
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

            <div className="bg-secondary text-foreground rounded-[2rem] overflow-hidden border border-white/5 shadow-3xl flex flex-col h-[850px] animate-in fade-in duration-500">
                {/* Visualizer Header */}
                <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl px-8 py-6 flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Box className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-bold uppercase tracking-widest text-white leading-none">
                                Stone <span className="text-primary italic">Visualizer</span>
                            </h2>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5">Professional AI Render Engine</p>
                        </div>
                    </div>
                    {step !== 'UPLOAD' && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-black/40 border border-primary/20 rounded-full px-4 py-2 animate-pulse">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="text-[9px] font-black uppercase text-primary tracking-widest">Stereo Visual Active</span>
                            </div>
                            <button
                                onClick={() => { setStep('UPLOAD'); setOriginalImage(null); setResultImage(null); setBaseImage(null); setDepthImage(null); }}
                                className="text-[9px] font-black uppercase text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-4 py-2"
                            >
                                New Project
                            </button>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-hidden p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Viewport Area */}
                    <div className="lg:col-span-2 relative flex flex-col min-h-0">
                        {errorInfo && (
                            <div className="absolute top-4 left-4 right-4 z-50 bg-red-500/10 border border-red-500/20 text-red-200 px-5 py-4 rounded-2xl flex items-center justify-between shadow-3xl backdrop-blur-xl animate-in slide-in-from-top">
                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                                    {errorInfo.message}
                                </span>
                                <button onClick={() => setErrorInfo(null)} className="text-[9px] font-black uppercase bg-red-500/20 hover:bg-red-500/40 px-4 py-2 rounded-xl transition-all">Dismiss</button>
                            </div>
                        )}

                        <div className="flex-1 bg-black/40 rounded-[2rem] border border-white/5 shadow-inner relative overflow-hidden flex items-center justify-center select-none group">
                            {step === 'RESULT' && (
                                <div className="absolute top-6 right-6 z-40 flex items-center space-x-3 animate-in fade-in duration-500">
                                    <div className="bg-secondary/90 backdrop-blur-2xl rounded-2xl p-1.5 border border-white/5 flex space-x-1 shadow-3xl">
                                        <button
                                            onClick={() => setCompareMode('SLIDE')}
                                            className={`p-3 rounded-xl transition-all ${compareMode === 'SLIDE' ? 'bg-primary text-primary-foreground shadow-lg scale-105' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <Box className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCompareMode('TOGGLE')}
                                            className={`p-3 rounded-xl transition-all ${compareMode === 'TOGGLE' ? 'bg-primary text-primary-foreground shadow-lg scale-105' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Toggle</span>
                                        </button>
                                    </div>
                                    <button onClick={download} className="bg-secondary/90 backdrop-blur-2xl p-3 rounded-2xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white shadow-3xl transition-all active:scale-90"><Box className="w-4 h-4" /></button>
                                    <button onClick={() => setShowFsModal(true)} className="bg-secondary/90 backdrop-blur-2xl p-3 rounded-2xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white shadow-3xl transition-all active:scale-90"><Box className="w-4 h-4" /></button>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-in fade-in">
                                    <div className="relative w-24 h-24 mb-8">
                                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-serif italic text-white tracking-widest">Mastering Textures...</h3>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-4">AI Rendering active</p>
                                </div>
                            )}

                            {step === 'UPLOAD' && (
                                <div className="flex flex-col items-center justify-center w-full h-full p-8 animate-in zoom-in-95 duration-500">
                                    <div className="flex flex-col md:flex-row gap-10 w-full max-w-5xl">
                                        {/* Primary Upload */}
                                        <div className="flex-1 flex flex-col items-center">
                                            <div
                                                onClick={() => baseInputRef.current?.click()}
                                                className={`w-full aspect-[4/3] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:border-primary/50 hover:bg-primary/5 group/upload ${baseImage ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-secondary/30'}`}
                                            >
                                                {baseImage ? (
                                                    <img src={baseImage} alt="Primary" className="w-full h-full object-cover rounded-[2rem] shadow-2xl" />
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 transition-transform">
                                                            <Box className="w-8 h-8 text-primary" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover/upload:text-primary transition-colors">Select Primary View</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 text-center">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Central Perspective</h4>
                                                <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">The main focal point</p>
                                            </div>
                                            <input type="file" ref={baseInputRef} onChange={handleBaseUpload} className="hidden" accept="image/*" />
                                        </div>

                                        {/* Offset Upload */}
                                        <div className="flex-1 flex flex-col items-center">
                                            <div
                                                onClick={() => depthInputRef.current?.click()}
                                                className={`w-full aspect-[4/3] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 hover:border-primary/50 hover:bg-primary/5 group/upload ${depthImage ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-secondary/30'}`}
                                            >
                                                {depthImage ? (
                                                    <img src={depthImage} alt="Offset" className="w-full h-full object-cover rounded-[2rem] shadow-2xl" />
                                                ) : (
                                                    <div className="text-center">
                                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover/upload:scale-110 transition-transform">
                                                            <Cuboid className="w-8 h-8 text-primary" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 group-hover/upload:text-primary transition-colors">Select Offset View</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-6 text-center">
                                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Stereo Depth View</h4>
                                                <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Offset 2ft for 3D mapping</p>
                                            </div>
                                            <input type="file" ref={depthInputRef} onChange={handleDepthUpload} className="hidden" accept="image/*" />
                                        </div>
                                    </div>

                                    {/* Link Indicator */}
                                    {baseImage && depthImage && (
                                        <div className="mt-12 flex items-center gap-3 bg-primary/10 px-8 py-3 rounded-full border border-primary/20 animate-in slide-in-from-bottom-4">
                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Spatial Link Established</span>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={startAutoAnalysis}
                                        disabled={!allUploadsComplete}
                                        className={`mt-10 px-16 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.4em] transition-all ${allUploadsComplete ? 'bg-primary text-primary-foreground shadow-3xl shadow-primary/20 hover:scale-[1.02] active:scale-95' : 'bg-secondary text-slate-600 cursor-not-allowed border border-white/5'}`}
                                    >
                                        {allUploadsComplete ? `Initiate AI Render` : `Upload Views to Begin`}
                                    </button>
                                </div>
                            )}

                            {step === 'PROCESSING' && (
                                <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl z-50 flex flex-col items-center justify-center animate-in fade-in duration-700">
                                    <div className="relative w-40 h-40 mb-12">
                                        <div className="absolute inset-0 border-[6px] border-primary/5 rounded-full"></div>
                                        <div className="absolute inset-0 border-[6px] border-transparent border-t-primary rounded-full animate-spin"></div>
                                        <div className="absolute inset-6 border-[6px] border-transparent border-t-primary/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-10 h-10 bg-primary rounded-full animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.4)]"></div>
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-serif italic text-white mb-4 tracking-[0.2em] animate-pulse">Refining Space</h3>
                                    <p className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-10">Jack's AI is calculating spatial depth...</p>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2.5 h-2.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-primary/100 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                                    </div>
                                    <div className="mt-12 max-w-xs text-center">
                                        <p className="text-slate-500 text-[9px] uppercase tracking-[0.3em] font-medium leading-[2.5] italic">Surface Detection • PBR Material Mapping • Ray-Traced Shadow Integration</p>
                                    </div>
                                </div>
                            )}

                            {step === 'RESULT' && resultImage && (
                                <div className="w-full h-full p-10 animate-in fade-in duration-1000 flex flex-col relative">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#141414_0%,_transparent_100%)] opacity-40"></div>
                                    <div className="relative z-10 w-full h-full bg-black/40 rounded-[2.5rem] border border-white/5 flex items-center justify-center text-center p-12 overflow-hidden shadow-inner relative group/viewport">
                                        <div className="absolute inset-0 bg-secondary/20 backdrop-blur-[2px] opacity-0 group-hover/viewport:opacity-100 transition-opacity" />
                                        <div className="relative z-20">
                                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 mx-auto border border-primary/20 group-hover/viewport:scale-110 transition-transform">
                                                <Cuboid className="w-10 h-10 text-primary animate-pulse" />
                                            </div>
                                            <h3 className="text-2xl font-serif font-bold text-white uppercase tracking-[0.3em] mb-4">Master Viewport</h3>
                                            <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em] font-black">Interactive 3D Stereo Reconstruction</p>
                                            <div className="mt-12">
                                                <button onClick={() => setShowFsModal(true)} className="bg-primary hover:bg-white text-primary-foreground hover:text-black px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-3xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                                    Open Full Experience
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Area */}
                    <aside className="flex flex-col min-h-0 space-y-6">
                        {step === 'RESULT' ? (
                            <ChatInterface onSendMessage={refineVisualization} isLoading={isLoading} />
                        ) : (
                            <div className="bg-secondary p-8 rounded-[2rem] border border-white/5 flex-1 overflow-y-auto custom-scrollbar shadow-3xl">
                                <div className="flex items-center space-x-4 mb-10">
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black border border-primary/20 shadow-lg">
                                        {step === 'UPLOAD' ? '01' : '02'}
                                    </div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
                                        Curate {step === 'UPLOAD' ? 'Foundation' : 'Execution'}
                                    </h3>
                                </div>

                                {step === 'UPLOAD' && (
                                    <div className="space-y-10">
                                        {/* Material Selection */}
                                        <div>
                                            <div className="flex justify-between items-center mb-5">
                                                <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Select Surface Texture</h4>
                                                <span className="text-primary text-[8px] font-black uppercase tracking-widest cursor-pointer hover:underline" onClick={() => setShowLibraryModal(true)}>Browse Full Library</span>
                                            </div>
                                            <SelectedMaterialCard
                                                material={selectedMaterial}
                                                onClick={() => setShowLibraryModal(true)}
                                                isSelected={true}
                                            />
                                        </div>

                                        {/* Palette Tones */}
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-5">Ambience Palette</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {STONE_TONES.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setSelectedTone(t)}
                                                        className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all duration-300 ${selectedTone.id === t.id ? 'bg-primary/10 border-primary/40 shadow-lg' : 'bg-black/20 border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                                    >
                                                        <div className="w-5 h-5 rounded-lg border border-white/10 shadow-inner" style={{ backgroundColor: t.hex }} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTone.id === t.id ? 'text-primary' : 'text-slate-400'}`}>{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Finish Options */}
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] mb-5">Artisan Finish</h4>
                                            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 space-x-1 shadow-inner">
                                                {FINISH_OPTIONS.map(f => (
                                                    <button
                                                        key={f}
                                                        onClick={() => setSelectedFinish(f)}
                                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${selectedFinish === f ? 'bg-white text-black shadow-3xl scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {f}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Disclaimer */}
                                        <div className="pt-8 border-t border-white/5">
                                            <p className="text-[8px] text-slate-600 uppercase tracking-widest text-center leading-[2] font-black italic">Upload secondary perspective to enable full spatial depth analysis for professional quoting.</p>
                                        </div>
                                    </div>
                                )}

                                {step === 'PROCESSING' && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(212,175,55,0.4)]"></div>
                                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">Jack's AI is working...</p>
                                        <p className="text-[8px] text-slate-600 uppercase tracking-widest mt-4 max-w-[150px] leading-relaxed">Processing multi-image depth sensors</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </aside>
                </main>

                <footer className="py-6 border-t border-white/5 bg-black/40 text-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(212,175,55,0.03)_50%,transparent_100%)]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <p className="text-[10px] font-black tracking-[0.8em] uppercase text-slate-500 flex items-center gap-3">
                            Luxe Stone Architects <span className="w-1.5 h-1.5 bg-primary/40 rounded-full" /> Engine v4.0.5 <span className="w-1.5 h-1.5 bg-primary/40 rounded-full" /> 3D Stereo Mapping Active
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default LuxeStoneVisualizer;