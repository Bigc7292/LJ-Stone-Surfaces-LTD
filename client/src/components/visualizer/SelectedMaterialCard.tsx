import React from 'react';
import { Box } from 'lucide-react';

interface SelectedMaterialCardProps {
    material: any;
    onClick: () => void;
    isSelected?: boolean;
}

const SelectedMaterialCard: React.FC<SelectedMaterialCardProps> = ({ material, onClick, isSelected }) => (
    <button
        onClick={onClick}
        className={`group w-full p-0 rounded-2xl border transition-all duration-500 relative flex items-center min-h-[90px] overflow-hidden ${isSelected
            ? 'border-primary bg-primary/5 shadow-[0_20px_40px_rgba(212,175,55,0.1)]'
            : 'border-white/5 bg-secondary/50 hover:border-white/20'
            }`}
    >
        {/* Active Indicator Bar */}
        {isSelected && <div className="absolute left-0 inset-y-0 w-1 bg-primary animate-pulse shadow-glow shadow-primary/50" />}

        <div className="flex-1 p-5 flex flex-col justify-center text-left">
            <div className="flex items-center space-x-3">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${isSelected ? 'bg-primary scale-110 shadow-glow' : 'bg-slate-600 animate-pulse'}`} />
                <span className={`font-black tracking-[0.2em] text-[10px] uppercase leading-none transition-colors ${isSelected ? 'text-primary' : 'text-slate-300'}`}>
                    {material.name}
                </span>
            </div>
            <span className="text-[8px] opacity-40 uppercase tracking-[0.25em] font-black mt-2 ml-4.5 text-slate-300">
                {material.category} • HD Texture
            </span>
        </div>

        {/* Swatch Area */}
        <div className={`relative w-24 h-[90px] border-l shrink-0 overflow-hidden ${isSelected ? 'border-primary/20' : 'border-white/5'}`}>
            {material.swatchUrl ? (
                <img src={material.swatchUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/40">
                    <Box className="w-6 h-6 text-slate-700" />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20" />
        </div>
    </button>
);

export default SelectedMaterialCard;
