export type AppStep = 'UPLOAD' | 'MARK' | 'CONFIGURE' | 'RESULT';

export interface Marker {
    x: number;
    y: number;
    label?: string;
    customLabel?: string;
}

export interface MaterialOption {
    id: string;
    name: string;
    texture: string;
    description: string;
    swatchUrl?: string; // This is new
}

export interface ColorOption {
    id: string;
    name: string;
    hex: string;
}