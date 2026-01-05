import { MaterialOption, ColorOption } from "@/types/visualizer";

export const MATERIALS: MaterialOption[] = [
    {
        id: 'm1',
        name: 'Calacatta Gold',
        texture: 'Marble',
        description: 'White background with dramatic gold and grey veining.',
        swatchUrl: 'https://placehold.co/100x100?text=Calacatta'
    },
    {
        id: 'm2',
        name: 'Nero Marquina',
        texture: 'Marble',
        description: 'High-end black marble with distinctive white veins.',
        swatchUrl: 'https://placehold.co/100x100/000000/FFFFFF?text=Nero'
    },
    {
        id: 'm3',
        name: 'Carrara White',
        texture: 'Marble',
        description: 'Classic soft white marble with subtle grey feathering.',
        swatchUrl: 'https://placehold.co/100x100?text=Carrara'
    },
    {
        id: 'm4',
        name: 'Blue Bahia',
        texture: 'Granite',
        description: 'Exotic blue granite with varied mineral patterns.',
        swatchUrl: 'https://placehold.co/100x100/0000FF/FFFFFF?text=Bahia'
    },
    {
        id: 'm5',
        name: 'Travertine',
        texture: 'Limestone',
        description: 'Warm, earthy beige tones with natural pitting.',
        swatchUrl: 'https://placehold.co/100x100/D2B48C/FFFFFF?text=Travertine'
    }
];

// Note: STONE_TONES are now handled inside the main component for flexibility, 
// but we keep this export to prevent import errors in other files.
export const COLORS: ColorOption[] = [
    { id: 'natural', name: 'Natural / Unchanged', hex: '#e2e8f0' },
    { id: 'cool', name: 'Cool / Grey', hex: '#94a3b8' },
    { id: 'warm', name: 'Warm / Beige', hex: '#d6d3d1' },
    { id: 'dark', name: 'Dark / Charcoal', hex: '#334155' },
    { id: 'dramatic', name: 'High Contrast', hex: '#0f172a' },
];