// 3D theme palettes (separate from the legacy 2D theme so we don't break existing UI).
export type Theme3D = {
  road: string;
  ground: string;
  groundAccent: string;
  sky: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  sunColor: string;
  sunIntensity: number;
  decor: 'building' | 'cactus' | 'tree' | 'neon';
};

export const THEMES_3D: Record<string, Theme3D> = {
  city: {
    road: '#374151',
    ground: '#16a34a',
    groundAccent: '#166534',
    sky: '#60a5fa',
    fog: '#9bbdf2',
    fogNear: 18,
    fogFar: 60,
    ambient: 0.55,
    sunColor: '#fffbeb',
    sunIntensity: 1.1,
    decor: 'building',
  },
  desert: {
    road: '#78350f',
    ground: '#f59e0b',
    groundAccent: '#b45309',
    sky: '#fed7aa',
    fog: '#fcd9a8',
    fogNear: 14,
    fogFar: 55,
    ambient: 0.7,
    sunColor: '#fed7aa',
    sunIntensity: 1.3,
    decor: 'cactus',
  },
  snow: {
    road: '#475569',
    ground: '#e2e8f0',
    groundAccent: '#cbd5e1',
    sky: '#cbd5e1',
    fog: '#e0e7ef',
    fogNear: 12,
    fogFar: 45,
    ambient: 0.75,
    sunColor: '#f8fafc',
    sunIntensity: 0.9,
    decor: 'tree',
  },
  neon: {
    road: '#0a0a0a',
    ground: '#1e1b4b',
    groundAccent: '#312e81',
    sky: '#020617',
    fog: '#0b0a23',
    fogNear: 12,
    fogFar: 50,
    ambient: 0.25,
    sunColor: '#a78bfa',
    sunIntensity: 0.45,
    decor: 'neon',
  },
};

export const getTheme3D = (id: string): Theme3D => THEMES_3D[id] ?? THEMES_3D.city;
