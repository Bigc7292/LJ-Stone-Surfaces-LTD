import React, { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
    before: string;
    after: string;
    className?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ before, after, className = "" }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const offset = ((x - rect.left) / rect.width) * 100;

        setSliderPos(Math.min(Math.max(offset, 0), 100));
    };

    const onMouseDown = () => {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const onMouseUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    const onTouchStart = () => {
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('touchend', onTouchEnd);
    };

    const onTouchEnd = () => {
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', onTouchEnd);
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden cursor-col-resize select-none ${className}`}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* After Image (Background) */}
            <img
                src={after}
                alt="After"
                className="w-full h-full object-contain pointer-events-none"
            />

            {/* Before Image (Clipped Overlay) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img
                    src={before}
                    alt="Before"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Slider Line */}
            <div
                className="absolute inset-y-0 z-20 w-1 bg-primary/80 shadow-[0_0_15px_rgba(212,175,55,0.4)] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
            >
                {/* Handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black/80 border border-primary/50 rounded-full flex items-center justify-center backdrop-blur-md">
                    <div className="flex gap-1">
                        <div className="w-0.5 h-3 bg-primary/60" />
                        <div className="w-0.5 h-3 bg-primary/60" />
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/10 pointer-events-none">
                Original
            </div>
            <div className="absolute top-4 right-4 z-10 bg-primary/40 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-black border border-primary/20 pointer-events-none">
                Grok AI View
            </div>
        </div>
    );
};

export default BeforeAfterSlider;
