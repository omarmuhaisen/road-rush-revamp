// Game configuration: lanes, cars, levels (themes)

export const LANES_X = [-3, -1, 1, 3]; // 4 lanes positions on X axis
export const LANE_COUNT = LANES_X.length;

export type CarConfig = {
  id: string;
  name: string;
  price: number;
  body: string; // hex color for body
  accent: string; // accent/glass color
  speed: number; // base forward speed
};

export const CARS: CarConfig[] = [
  { id: 'classic', name: 'Classic Blue', price: 0, body: '#2563eb', accent: '#0ea5e9', speed: 18 },
  { id: 'sport', name: 'Sport Red', price: 500, body: '#dc2626', accent: '#fbbf24', speed: 22 },
  { id: 'vip', name: 'Tesla VIP', price: 2000, body: '#f59e0b', accent: '#facc15', speed: 26 },
];

export type LevelTheme = {
  id: string;
  name: string;
  unlockScore: number; // score to unlock this level
  road: string; // road color
  ground: string; // side ground color
  fog: string; // fog/sky color
  fogNear: number;
  fogFar: number;
  ambient: number; // ambient light intensity
  sun: number; // directional light intensity
  sunColor: string;
  decorColor: string; // buildings/rocks/trees color
  decorAccent: string;
  obstacleColor: string;
  neon?: boolean; // neon lighting style
};

export const LEVELS: LevelTheme[] = [
  {
    id: 'city',
    name: 'CITY',
    unlockScore: 0,
    road: '#1f2937',
    ground: '#374151',
    fog: '#94a3b8',
    fogNear: 20,
    fogFar: 80,
    ambient: 0.6,
    sun: 1.2,
    sunColor: '#fff7ed',
    decorColor: '#475569',
    decorAccent: '#f59e0b',
    obstacleColor: '#ef4444',
  },
  {
    id: 'desert',
    name: 'DESERT',
    unlockScore: 1500,
    road: '#78350f',
    ground: '#d97706',
    fog: '#fcd34d',
    fogNear: 25,
    fogFar: 90,
    ambient: 0.8,
    sun: 1.6,
    sunColor: '#fef3c7',
    decorColor: '#b45309',
    decorAccent: '#fde68a',
    obstacleColor: '#7c2d12',
  },
  {
    id: 'snow',
    name: 'SNOW',
    unlockScore: 4000,
    road: '#475569',
    ground: '#f1f5f9',
    fog: '#e2e8f0',
    fogNear: 15,
    fogFar: 70,
    ambient: 0.9,
    sun: 1.0,
    sunColor: '#dbeafe',
    decorColor: '#0f766e',
    decorAccent: '#ffffff',
    obstacleColor: '#1e293b',
  },
  {
    id: 'neon',
    name: 'NEON NIGHT',
    unlockScore: 8000,
    road: '#0a0a0a',
    ground: '#111827',
    fog: '#1e0b3a',
    fogNear: 18,
    fogFar: 75,
    ambient: 0.25,
    sun: 0.4,
    sunColor: '#a78bfa',
    decorColor: '#1e1b4b',
    decorAccent: '#ec4899',
    obstacleColor: '#f43f5e',
    neon: true,
  },
];

export const STORAGE_KEY = 'turbo-dash-pro-save-v1';

export type SaveData = {
  coins: number;
  ownedCars: string[];
  activeCarId: string;
  highScore: number;
  unlockedLevels: string[];
};

export const DEFAULT_SAVE: SaveData = {
  coins: 0,
  ownedCars: ['classic'],
  activeCarId: 'classic',
  highScore: 0,
  unlockedLevels: ['city'],
};
