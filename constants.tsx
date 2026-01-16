
import { MaterialOption, ColorOption } from './types';

export const MATERIALS: MaterialOption[] = [
  // DEKTON
  { id: 'dekton-laurent', name: 'Dekton Laurent', description: 'Deep brown background with dramatic gold and amber veins. Sophisticated matte finish.', texture: 'Sintered Stone / Matte' },
  { id: 'dekton-entzo', name: 'Dekton Entzo', description: 'Crisp white with realistic, jagged grey and gold marble-style veining.', texture: 'Sintered Stone / Matte' },
  { id: 'dekton-trilium', name: 'Dekton Trilium', description: 'Industrial oxidized steel look with deep greys, blacks, and rusted copper tones.', texture: 'Sintered Stone / Industrial' },
  
  // EXOTIC GRANITE
  { id: 'blue-dunes', name: 'Blue Dunes Granite', description: 'Earthy blend of beige, charcoal, and subtle blue-grey flowing patterns.', texture: 'Exotic Granite / Natural' },
  { id: 'titanium-gold', name: 'Titanium Gold Granite', description: 'Intense black base with swirling ribbons of cream, gold, and silver.', texture: 'Exotic Granite / Polished' },
  { id: 'nero-mist', name: 'Nero Mist Granite', description: 'Moody black with soft, feathery white/grey veins. Best in leathered finish.', texture: 'Exotic Granite / Leathered' },
  { id: 'colonial-white', name: 'Colonial White Granite', description: 'Bright white with black speckles and occasional burgundy mineral flecks.', texture: 'Exotic Granite / Polished' },

  // LUXURY QUARTZ & QUARTZITE
  { id: 'taj-mahal', name: 'Taj Mahal Quartzite', description: 'Soft creamy beige with subtle, elegant cloud-like veining. The ultimate high-end classic.', texture: 'Luxury Quartzite / Polished' },
  { id: 'calacatta-laza', name: 'Calacatta Laza Quartz', description: 'Bright white with bold, thick gold veins for a high-contrast luxury look.', texture: 'Premium Quartz / Polished' },
  { id: 'super-white', name: 'Super White Quartzite', description: 'Icy grey and white with chunky mineral patterns, mimicking expensive marble.', texture: 'Luxury Quartzite / Honed' },
];

export const COLORS: ColorOption[] = [
  { id: 'minimalist', name: 'Minimalist (Alabaster)', hex: '#F5F5F0' },
  { id: 'warm-earth', name: 'Warm Earth (Ochre)', hex: '#C2A17A' },
  { id: 'cool-industrial', name: 'Cool Industrial (Steel)', hex: '#4A4E52' },
  { id: 'jewel-emerald', name: 'Jewel Emerald', hex: '#043927' },
  { id: 'jewel-navy', name: 'Jewel Navy', hex: '#000080' },
  { id: 'midnight', name: 'Midnight Chrome', hex: '#1A1A1A' },
];
