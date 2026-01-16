import { MaterialOption, ColorOption } from "@/types/visualizer";

// UPDATED: Only Quartz, Granite, and Dekton
export const MATERIALS: MaterialOption[] = [
    {
        id: 'm1',
        name: 'Calacatta Quartz',
        texture: 'Quartz',
        description: 'Engineered durability with classic white marble veining.',
        swatchUrl: 'https://images.unsplash.com/photo-1599596646864-46b0a9437a34?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'm2',
        name: 'Cosmic Black',
        texture: 'Granite',
        description: 'Stunning natural granite with gold and white flowing movements.',
        swatchUrl: 'https://images.unsplash.com/photo-1616047065998-095940cb36b7?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'm3',
        name: 'Industrial Grey',
        texture: 'Dekton',
        description: 'Ultra-compact surface with a modern concrete industrial look.',
        swatchUrl: 'https://images.unsplash.com/photo-1568858902507-6f7797825d79?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'm4',
        name: 'Blue Pearl',
        texture: 'Granite',
        description: 'Exotic granite with iridescent blue mineral deposits.',
        swatchUrl: 'https://images.unsplash.com/photo-1582200235336-d62f627447d4?q=80&w=300&auto=format&fit=crop'
    },
    {
        id: 'm5',
        name: 'Pure White',
        texture: 'Quartz',
        description: 'Clean, solid white engineered stone for minimalism.',
        swatchUrl: 'https://images.unsplash.com/photo-1595085350394-4d1cc4178657?q=80&w=300&auto=format&fit=crop'
    }
];

export const COLORS: ColorOption[] = [
    { id: 'natural', name: 'Natural / Unchanged', hex: '#e2e8f0' },
    { id: 'cool', name: 'Cool / Grey', hex: '#94a3b8' },
    { id: 'warm', name: 'Warm / Beige', hex: '#d6d3d1' },
    { id: 'dark', name: 'Dark / Charcoal', hex: '#334155' },
    { id: 'dramatic', name: 'High Contrast', hex: '#0f172a' },
];