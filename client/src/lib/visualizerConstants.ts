import type { MaterialOption, ColorOption } from '@/types/visualizer';

export const MATERIALS: MaterialOption[] = [
    // DEKTON - Sintered Stone
    {
        id: 'dekton-laurent',
        name: 'Dekton Laurent',
        description: 'Deep brown background with dramatic gold and amber veins. Sophisticated matte finish.',
        texture: 'Sintered Stone / Matte',
        // Brown marble with gold veins
        swatchUrl: 'https://images.unsplash.com/photo-1618221823987-4ef2a4424a31?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'dekton-entzo',
        name: 'Dekton Entzo',
        description: 'Crisp white with realistic, jagged grey and gold marble-style veining.',
        texture: 'Sintered Stone / Matte',
        // White marble with grey veins
        swatchUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'dekton-trilium',
        name: 'Dekton Trilium',
        description: 'Industrial oxidized steel look with deep greys, blacks, and rusted copper tones.',
        texture: 'Sintered Stone / Industrial',
        // Dark industrial concrete/steel texture
        swatchUrl: 'https://images.unsplash.com/photo-1553969420-fb915228af51?w=200&h=200&fit=crop&auto=format'
    },

    // EXOTIC GRANITE
    {
        id: 'blue-dunes',
        name: 'Blue Dunes Granite',
        description: 'Earthy blend of beige, charcoal, and subtle blue-grey flowing patterns.',
        texture: 'Exotic Granite / Natural',
        // Beige/grey granite texture
        swatchUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'titanium-gold',
        name: 'Titanium Gold Granite',
        description: 'Intense black base with swirling ribbons of cream, gold, and silver.',
        texture: 'Exotic Granite / Polished',
        // Black granite with gold veins
        swatchUrl: 'https://images.unsplash.com/photo-1544717684-1243da23b545?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'nero-mist',
        name: 'Nero Mist Granite',
        description: 'Moody black with soft, feathery white/grey veins. Best in leathered finish.',
        texture: 'Exotic Granite / Leathered',
        // Black stone with white veins
        swatchUrl: 'https://images.unsplash.com/photo-1605106702734-205df224ecce?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'colonial-white',
        name: 'Colonial White Granite',
        description: 'Bright white with black speckles and occasional burgundy mineral flecks.',
        texture: 'Exotic Granite / Polished',
        // White granite with dark speckles
        swatchUrl: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=200&h=200&fit=crop&auto=format'
    },

    // LUXURY QUARTZ & QUARTZITE
    {
        id: 'taj-mahal',
        name: 'Taj Mahal Quartzite',
        description: 'Soft creamy beige with subtle, elegant cloud-like veining. The ultimate high-end classic.',
        texture: 'Luxury Quartzite / Polished',
        // Cream/beige marble
        swatchUrl: 'https://images.unsplash.com/photo-1618221639244-c1a8502c0eb9?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'calacatta-laza',
        name: 'Calacatta Laza Quartz',
        description: 'Bright white with bold, thick gold veins for a high-contrast luxury look.',
        texture: 'Premium Quartz / Polished',
        // Calacatta gold marble
        swatchUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200&h=200&fit=crop&auto=format'
    },
    {
        id: 'super-white',
        name: 'Super White Quartzite',
        description: 'Icy grey and white with chunky mineral patterns, mimicking expensive marble.',
        texture: 'Luxury Quartzite / Honed',
        // White/grey marble texture
        swatchUrl: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=200&h=200&fit=crop&auto=format'
    },
];

export const COLORS: ColorOption[] = [
    { id: 'minimalist', name: 'Minimalist (Alabaster)', hex: '#F5F5F0' },
    { id: 'warm-earth', name: 'Warm Earth (Ochre)', hex: '#C2A17A' },
    { id: 'cool-industrial', name: 'Cool Industrial (Steel)', hex: '#4A4E52' },
    { id: 'jewel-emerald', name: 'Jewel Emerald', hex: '#043927' },
    { id: 'jewel-navy', name: 'Jewel Navy', hex: '#000080' },
    { id: 'midnight', name: 'Midnight Chrome', hex: '#1A1A1A' },
];
