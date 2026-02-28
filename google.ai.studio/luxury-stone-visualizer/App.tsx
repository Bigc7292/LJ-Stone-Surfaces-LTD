
import React, { useState, useRef, useEffect } from 'react';
import { AppStep, Marker, MaterialOption, ColorOption } from './types';
import { MATERIALS, COLORS } from './constants';
import { visualizeStone, generateMaterialSwatch, ArchitecturalEngineError } from './services/geminiService';

const ComparisonSlider: React.FC<{
  original: string;
  modified: string;
}> = ({ original, modified }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((relativeX / rect.width) * 100);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video rounded-3xl overflow-hidden cursor-ew-resize shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-slate-800/50 group/slider"
      onMouseMove={(e) => e.buttons === 1 && handleMove(e)}
      onTouchMove={handleMove}
      onMouseDown={handleMove}
    >
      <img src={modified} alt="After" className="absolute inset-0 w-full h-full object-cover select-none" />
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-all duration-100 ease-out"
        style={{ width: `${position}%`, borderRight: '1px solid rgba(255,255,255,0.8)' }}
      >
        <img 
          src={original} 
          alt="Before" 
          className="absolute inset-0 w-full h-full object-cover select-none max-w-none"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
        />
      </div>
      <div 
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)] z-20 pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-slate-900 group-hover/slider:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7l-5 5m0 0l5 5m-5-5h18m-5-5l5 5m0 0l-5 5" />
          </svg>
        </div>
      </div>
      {/* Icon from screenshot */}
      <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl z-30 pointer-events-none opacity-90 transition-opacity group-hover/slider:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7l-5 5m0 0l5 5m-5-5h18m-5-5l5 5m0 0l-5 5" />
        </svg>
      </div>
    </div>
  );
};

const MaterialOptionItem: React.FC<{
  material: MaterialOption;
  isSelected: boolean;
  onSelect: (m: MaterialOption) => void;
}> = ({ material, isSelected, onSelect }) => {
  const [swatch, setSwatch] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<'QUOTA' | 'OTHER' | null>(null);

  const fetchSwatch = async () => {
    setLoading(true);
    setErrorType(null);
    try {
      const res = await generateMaterialSwatch(material.name, material.texture);
      setSwatch(res);
    } catch (err: any) {
      setErrorType(err.code === 'QUOTA' ? 'QUOTA' : 'OTHER');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwatch();
  }, [material]);

  return (
    <button
      onClick={() => onSelect(material)}
      className={`w-full p-0 rounded-2xl border text-left transition-all relative overflow-hidden flex items-stretch min-h-[120px] ${isSelected ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50' : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'}`}
    >
      <div className="flex-1 p-5 flex flex-col justify-center space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
          <span className={`font-black tracking-widest text-[11px] uppercase leading-none ${isSelected ? 'text-amber-500' : 'text-slate-300'}`}>
            {material.name}
          </span>
        </div>
        <span className="text-[9px] opacity-40 leading-tight block uppercase tracking-widest font-bold">{material.texture}</span>
        <p className="text-[10px] text-slate-400 block leading-relaxed line-clamp-2 pr-4">{material.description}</p>
      </div>

      <div className="w-32 md:w-40 shrink-0 border-l border-slate-700/50 bg-slate-900/50 relative overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-4 h-4 border-t-amber-500 border-2 rounded-full animate-spin" />
          </div>
        ) : errorType ? (
          <div className="text-center p-2 opacity-40 group hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[7px] font-black uppercase tracking-tighter block">{errorType === 'QUOTA' ? 'Rate Limit' : 'Error'}</span>
            <button onClick={(e) => { e.stopPropagation(); fetchSwatch(); }} className="text-[7px] underline mt-1 text-amber-500">Retry</button>
          </div>
        ) : swatch ? (
          <img src={swatch} alt={material.name} className="w-full h-full object-cover" />
        ) : null}
      </div>
    </button>
  );
};

const WorkspaceMarker: React.FC<{
  marker: Marker;
  index: number;
  zoom: number;
  onRemove: (idx: number) => void;
}> = ({ marker, index, zoom, onRemove }) => (
    <div 
      style={{ 
        left: `${marker.x}%`, 
        top: `${marker.y}%`,
        transform: `translate(-50%, -50%) scale(${1/zoom})` 
      }}
      className="absolute group/marker z-20 pointer-events-auto transition-all duration-300"
    >
      <button 
        aria-label={`Remove marker at position ${index}`}
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
        className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/marker:opacity-100 transition-all hover:bg-red-600 z-30"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="w-8 h-8 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center shadow-2xl marker-animate relative z-20">
        <span className="text-[10px] font-black text-slate-900">{index + 1}</span>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 px-2 py-1 rounded shadow-2xl whitespace-nowrap z-10">
        <span className="text-[8px] font-black uppercase text-white tracking-widest">{marker.customLabel}</span>
      </div>
    </div>
);

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('UPLOAD');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [pendingMarker, setPendingMarker] = useState<{ x: number, y: number } | null>(null);
  const [markerInput, setMarkerInput] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption>(MATERIALS[0]);
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ code: string; message: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareMode, setCompareMode] = useState<'SLIDE' | 'TOGGLE'>('SLIDE');
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMovedDuringClick, setHasMovedDuringClick] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pendingMarker && labelInputRef.current) labelInputRef.current.focus();
  }, [pendingMarker]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setOriginalImage(event.target?.result as string);
        setStep('MARK');
      };
      reader.readAsDataURL(file);
    }
  };

  const containerToPercent = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const ix = (clientX - rect.left - pan.x) / zoom;
    const iy = (clientY - rect.top - pan.y) / zoom;
    return { x: (ix / rect.width) * 100, y: (iy / rect.height) * 100 };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((step !== 'MARK' && step !== 'CONFIGURE') || pendingMarker) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setHasMovedDuringClick(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      setHasMovedDuringClick(true);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (step === 'MARK' && !hasMovedDuringClick && !pendingMarker) {
      const pos = containerToPercent(e.clientX, e.clientY);
      if (pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100) setPendingMarker(pos);
    }
    setIsDragging(false);
  };

  const submitPendingMarker = () => {
    if (pendingMarker && markerInput.trim()) {
      setMarkers([...markers, { ...pendingMarker, label: markerInput.trim(), customLabel: markerInput.trim() }]);
      setPendingMarker(null);
      setMarkerInput('');
    }
  };

  const startVisualization = async () => {
    if (!originalImage || (markers.length === 0 && step !== 'RESULT')) return;
    setIsLoading(true);
    setErrorInfo(null);
    try {
      const result = await visualizeStone(originalImage, markers, selectedMaterial.name, selectedColor.name);
      setResultImage(result);
      setStep('RESULT');
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch (err: any) {
      setErrorInfo({
        code: err.code || 'UNKNOWN',
        message: err.message || "The architectural engine encountered a delay. Retrying might help."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('UPLOAD');
    setOriginalImage(null);
    setResultImage(null);
    setMarkers([]);
    setPendingMarker(null);
    setMarkerInput('');
    setErrorInfo(null);
  };

  const getMarkerAlignment = (x: number, y: number) => {
    let transformX = '-50%';
    let transformY = '-50%';
    let left = `${x}%`;
    let top = `${y}%`;
    if (x < 30) { transformX = '0%'; left = `calc(${x}% + 20px)`; } 
    else if (x > 70) { transformX = '-100%'; left = `calc(${x}% - 20px)`; }
    if (y < 30) { transformY = '0%'; top = `calc(${y}% + 20px)`; } 
    else if (y > 70) { transformY = '-100%'; top = `calc(${y}% - 20px)`; }
    return { left, top, transform: `translate(${transformX}, ${transformY}) scale(${1/zoom})` };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <style>{`
        @keyframes marker-pop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        .marker-animate { animation: marker-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>

      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold uppercase tracking-tight">LUXE<span className="text-amber-500">STONE</span></h1>
          </div>
          {step !== 'UPLOAD' && <button onClick={reset} className="text-xs font-black uppercase text-slate-500 hover:text-white transition-colors">New Project</button>}
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {errorInfo && (
          <div className="mb-6 animate-in slide-in-from-top duration-300">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-red-400 tracking-widest">Architectural Error</h4>
                  <p className="text-[10px] text-red-400/80 uppercase font-bold mt-1 leading-tight">{errorInfo.message}</p>
                </div>
              </div>
              <button onClick={() => setErrorInfo(null)} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Dismiss</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div 
              ref={containerRef}
              className="bg-slate-900 rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl min-h-[550px] flex flex-col items-center justify-center relative touch-none"
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
            >
              {step === 'UPLOAD' && (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-700 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-black mb-3 uppercase tracking-tight">Architectural Mapping</h2>
                  <p className="text-slate-500 mb-10 max-w-sm mx-auto text-[10px] font-bold uppercase tracking-widest leading-relaxed">Provide high-resolution imagery for photorealistic stone refitting.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-12 py-5 rounded-2xl shadow-xl shadow-amber-500/20 text-[11px] uppercase tracking-[0.2em] transition-all">Upload Portfolio Photo</button>
                  <input id="portfolio-file-upload" type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" aria-label="Upload portfolio photo for architectural mapping" />
                </div>
              )}

              {(step === 'MARK' || step === 'CONFIGURE') && originalImage && (
                <div 
                  className="relative w-full h-full select-none cursor-crosshair transition-transform duration-75 ease-out"
                  style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
                >
                  <img src={originalImage} alt="Workspace" className="w-full h-auto block pointer-events-none" />
                  {markers.map((m, i) => <WorkspaceMarker key={i} marker={m} index={i} zoom={zoom} onRemove={(idx) => setMarkers(prev => prev.filter((_, mi) => mi !== idx))} />)}
                  
                  {pendingMarker && (
                    <div 
                      style={getMarkerAlignment(pendingMarker.x, pendingMarker.y)} 
                      className="absolute z-50 p-5 bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] flex flex-col space-y-4 min-w-[240px]"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        <label htmlFor="surface-type-input" className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Identify Surface Type</label>
                      </div>
                      <input 
                        id="surface-type-input"
                        ref={labelInputRef} 
                        type="text" 
                        value={markerInput} 
                        onChange={(e) => setMarkerInput(e.target.value)} 
                        placeholder="e.g. wall, bathtub, sink" 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter' && markerInput.trim()) submitPendingMarker(); 
                          if (e.key === 'Escape') setPendingMarker(null);
                        }} 
                        className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-[11px] focus:ring-2 focus:ring-amber-500 outline-none uppercase font-black tracking-wider text-white" 
                      />
                      <div className="flex justify-end items-center space-x-4">
                        <button onClick={() => setPendingMarker(null)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors">Cancel</button>
                        <button 
                          onClick={submitPendingMarker} 
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all"
                        >
                          Confirm Pin
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 'RESULT' && resultImage && originalImage && (
                <div className="w-full h-full p-8 animate-in fade-in duration-700 flex flex-col">
                  <div className="w-full mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-2xl font-black uppercase text-white tracking-tight">MASTER INSTALLATION</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Architectural Stone Refit Analysis</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                      <button 
                        onClick={() => setCompareMode('SLIDE')} 
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${compareMode === 'SLIDE' ? 'bg-white text-slate-950 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-white'}`}
                      >
                        Slide View
                      </button>
                      <button 
                        onClick={() => setCompareMode('TOGGLE')} 
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${compareMode === 'TOGGLE' ? 'bg-white text-slate-950 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-white'}`}
                      >
                        Toggle View
                      </button>
                      <button aria-label="Toggle fullscreen view" onClick={() => setIsFullscreen(true)} className="p-3 text-slate-400 hover:text-white transition-all bg-slate-800/40 rounded-xl ml-2 hover:bg-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 flex items-center justify-center min-h-[450px]">
                    {compareMode === 'SLIDE' ? <ComparisonSlider original={originalImage} modified={resultImage} /> : (
                      <div 
                        className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl cursor-pointer group" 
                        onMouseDown={() => setIsShowingOriginal(true)} 
                        onMouseUp={() => setIsShowingOriginal(false)} 
                        onMouseLeave={() => setIsShowingOriginal(false)}
                      >
                        <img src={isShowingOriginal ? originalImage : resultImage} alt="Toggle" className="w-full h-full object-cover select-none" />
                        <div className="absolute top-8 left-8 px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl">{isShowingOriginal ? 'Original State' : 'New Installation'}</div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/30 backdrop-blur-[2px] pointer-events-none">
                          <p className="bg-white/10 backdrop-blur-2xl px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.3em] border border-white/20 shadow-2xl">Hold To View Original</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-center">
                  <div className="w-24 h-24 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin mb-10 shadow-[0_0_50px_rgba(245,158,11,0.2)]"></div>
                  <h3 className="text-3xl font-black uppercase tracking-tight">Finalizing Refit</h3>
                  <p className="text-slate-500 text-center px-12 text-[11px] font-bold max-w-sm leading-loose uppercase tracking-[0.3em] mt-4">The AI Architect is calculating ray-traced lighting for your custom installation.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800/50 p-8 shadow-2xl sticky top-24 overflow-hidden">
              {step === 'UPLOAD' ? (
                <div className="text-center py-20 opacity-30 flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H2a2 2 0 00-2 2" /></svg>
                  <p className="text-[11px] font-black uppercase tracking-[0.4em]">Pending Data</p>
                </div>
              ) : step === 'RESULT' ? (
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                  <div className="flex items-center space-x-3"><div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg></div><h3 className="text-xl font-black uppercase text-green-500 tracking-widest">Installation Verified</h3></div>
                  <div className="bg-slate-800/30 rounded-2xl p-7 space-y-4 border border-slate-700/50 shadow-inner">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black"><span className="text-slate-500 tracking-widest">Mineral:</span><span className="text-amber-500 tracking-widest">{selectedMaterial.name}</span></div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black"><span className="text-slate-500 tracking-widest">Chroma:</span><span className="text-amber-500 tracking-widest">{selectedColor.name}</span></div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => setStep('MARK')} className="w-full bg-slate-800 hover:bg-slate-750 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all border border-slate-700 active:scale-95">Edit Markers</button>
                    <button onClick={() => setStep('CONFIGURE')} className="w-full bg-slate-800 hover:bg-slate-750 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all border border-slate-700 active:scale-95">Refine Material</button>
                    <button onClick={reset} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl shadow-amber-500/20 active:scale-95">Initiate New Project</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className={`${step !== 'CONFIGURE' ? 'opacity-100' : 'opacity-30 pointer-events-none scale-95'} transition-all duration-500`}>
                    <div className="flex items-center space-x-4 mb-8"><span className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black shadow-lg">1</span><h3 className="font-black text-sm uppercase tracking-widest">Mapping</h3></div>
                    <p className="text-[10px] text-slate-500 mb-8 font-bold uppercase leading-loose tracking-[0.1em]">Pinpoint bathtub, vanity, or wall sections. Continuous architectural planes will be automatically filled for a cohesive finish.</p>
                    <button onClick={() => setStep('CONFIGURE')} className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] transition-all border border-slate-700 active:scale-95">Confirm {markers.length} Areas</button>
                    <p className="text-[9px] text-slate-600 font-bold uppercase mt-4 text-center tracking-widest italic">* Floor tiles are preserved by default</p>
                  </div>
                  
                  <div className={`${step !== 'CONFIGURE' ? 'opacity-30 pointer-events-none scale-95 blur-[4px]' : 'scale-100'} transition-all duration-500`}>
                    <div className="flex items-center space-x-4 mb-8"><span className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-[11px] font-black shadow-lg">2</span><h3 className="font-black text-sm uppercase tracking-widest">Curation</h3></div>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                      {MATERIALS.map(m => <MaterialOptionItem key={m.id} material={m} isSelected={selectedMaterial.id === m.id} onSelect={setSelectedMaterial} />)}
                    </div>
                    <div className="mt-10 p-6 bg-slate-950/60 rounded-3xl border border-white/5 space-y-5">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] uppercase font-black text-amber-500 tracking-[0.2em] block">Tone Palette</label>
                      </div>
                      <div className="flex flex-wrap gap-4">{COLORS.map(c => <button key={c.id} aria-label={`Select ${c.name} color`} onClick={() => setSelectedColor(c)} className={`w-11 h-11 rounded-2xl border-2 transition-all p-1.5 ${selectedColor.id === c.id ? 'border-amber-500 ring-4 ring-amber-500/10 shadow-lg' : 'border-slate-800 hover:border-slate-600'}`}><div className="w-full h-full rounded-xl" style={{ backgroundColor: c.hex }} /></button>)}</div>
                    </div>
                    <button onClick={startVisualization} disabled={isLoading} className="w-full mt-10 bg-amber-500 hover:bg-amber-400 text-slate-950 py-7 rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] shadow-xl shadow-amber-500/20 active:scale-95">{isLoading ? 'Processing...' : 'Initiate Installation'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-900 bg-slate-950/50 backdrop-blur-xl text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center space-y-6">
          <p className="text-[11px] font-black tracking-[0.6em] uppercase text-slate-500">Luxe Stone Architects • Architectural Engine v3.7</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
