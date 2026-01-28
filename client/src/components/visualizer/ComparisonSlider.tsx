import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
    original: string;
    modified: string;
    isFullScreen?: boolean;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ original, modified, isFullScreen = false }) => {
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
            className={`relative w-full h-full select-none overflow-hidden cursor-ew-resize touch-none group ${isFullScreen ? 'bg-black' : 'rounded-2xl border border-white/5'}`}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
        >
            <img src={modified} alt="After" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
            <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}
            >
                <img src={original} alt="Before" className="absolute inset-0 w-full h-full object-contain" />
            </div>

            {/* Divider Handle */}
            <div
                className="absolute inset-y-0 w-px bg-white/50 shadow-[0_0_20px_rgba(212,175,55,0.6)] z-20 pointer-events-none"
                style={{ left: `${position}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-xl rounded-full border border-primary shadow-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:border-white">
                    <svg className="w-5 h-5 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l-3 3m0 0l3 3m-3-3h12m-3-3l3 3m0 0l-3 3" />
                    </svg>
                </div>

                {/* Visual Labels */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[9px] font-black uppercase text-white border border-white/10 tracking-widest">Modified</span>
                </div>
                <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-full ml-[-48px]">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[9px] font-black uppercase text-white border border-white/10 tracking-widest">Original</span>
                </div>
            </div>
        </div>
    );
};

export default ComparisonSlider;
