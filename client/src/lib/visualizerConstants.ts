import type { MaterialOption, ColorOption } from '@/types/visualizer';

export const MATERIALS: MaterialOption[] = [
    // DEKTON - Sintered Stone (using marble/stone texture images)
    { id: 'dekton-laurent', name: 'Dekton Laurent', description: 'Deep brown background with dramatic gold and amber veins. Sophisticated matte finish.', texture: 'Sintered Stone / Matte', swatchUrl: 'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'dekton-entzo', name: 'Dekton Entzo', description: 'Crisp white with realistic, jagged grey and gold marble-style veining.', texture: 'Sintered Stone / Matte', swatchUrl: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'dekton-trilium', name: 'Dekton Trilium', description: 'Industrial oxidized steel look with deep greys, blacks, and rusted copper tones.', texture: 'Sintered Stone / Industrial', swatchUrl: 'https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },

    // EXOTIC GRANITE (using granite texture images)
    { id: 'blue-dunes', name: 'Blue Dunes Granite', description: 'Earthy blend of beige, charcoal, and subtle blue-grey flowing patterns.', texture: 'Exotic Granite / Natural', swatchUrl: 'https://images.pexels.com/photos/2469719/pexels-photo-2469719.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'titanium-gold', name: 'Titanium Gold Granite', description: 'Intense black base with swirling ribbons of cream, gold, and silver.', texture: 'Exotic Granite / Polished', swatchUrl: 'https://images.pexels.com/photos/3756766/pexels-photo-3756766.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'nero-mist', name: 'Nero Mist Granite', description: 'Moody black with soft, feathery white/grey veins. Best in leathered finish.', texture: 'Exotic Granite / Leathered', swatchUrl: 'https://images.pexels.com/photos/1022928/pexels-photo-1022928.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'colonial-white', name: 'Colonial White Granite', description: 'Bright white with black speckles and occasional burgundy mineral flecks.', texture: 'Exotic Granite / Polished', swatchUrl: 'https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },

    // LUXURY QUARTZ & QUARTZITE (using quartz/marble texture images)
    { id: 'taj-mahal', name: 'Taj Mahal Quartzite', description: 'Soft creamy beige with subtle, elegant cloud-like veining. The ultimate high-end classic.', texture: 'Luxury Quartzite / Polished', swatchUrl: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'calacatta-laza', name: 'Calacatta Laza Quartz', description: 'Bright white with bold, thick gold veins for a high-contrast luxury look.', texture: 'Premium Quartz / Polished', swatchUrl: 'https://images.pexels.com/photos/4846097/pexels-photo-4846097.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
    { id: 'super-white', name: 'Super White Quartzite', description: 'Icy grey and white with chunky mineral patterns, mimicking expensive marble.', texture: 'Luxury Quartzite / Honed', swatchUrl: 'https://images.pexels.com/photos/2824173/pexels-photo-2824173.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' },
];

export const COLORS: ColorOption[] = [
    { id: 'minimalist', name: 'Minimalist (Alabaster)', hex: '#F5F5F0' },
    { id: 'warm-earth', name: 'Warm Earth (Ochre)', hex: '#C2A17A' },
    { id: 'cool-industrial', name: 'Cool Industrial (Steel)', hex: '#4A4E52' },
    { id: 'jewel-emerald', name: 'Jewel Emerald', hex: '#043927' },
    { id: 'jewel-navy', name: 'Jewel Navy', hex: '#000080' },
    { id: 'midnight', name: 'Midnight Chrome', hex: '#1A1A1A' },
];
