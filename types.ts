
export interface Marker {
  x: number;
  y: number;
  label: string;
  customLabel?: string;
}

export interface MaterialOption {
  id: string;
  name: string;
  description: string;
  texture: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export type AppStep = 'UPLOAD' | 'MARK' | 'CONFIGURE' | 'RESULT';
