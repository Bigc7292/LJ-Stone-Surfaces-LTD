import React, { useState, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

interface ZoomableViewProps {
    src: string;
}

const ZoomableView: React.FC<ZoomableViewProps> = ({ src }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

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
                    alt="Inspection View"
                    className="max-h-full max-w-full object-contain pointer-events-none shadow-2xl"
                    draggable={false}
                />
            </div>

            {/* Premium Floating Zoom Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-secondary/80 backdrop-blur-2xl border border-white/5 p-2 rounded-2xl shadow-3xl z-[110]">
                <button
                    onClick={handleZoomOut}
                    className="p-3 hover:bg-white/5 rounded-xl text-white transition-all hover:text-primary active:scale-90"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <div className="text-[10px] font-black text-primary w-14 text-center uppercase tracking-[0.2em] font-sans">
                    {Math.round(scale * 100)}%
                </div>
                <button
                    onClick={handleZoomIn}
                    className="p-3 hover:bg-white/5 rounded-xl text-white transition-all hover:text-primary active:scale-90"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ZoomableView;
