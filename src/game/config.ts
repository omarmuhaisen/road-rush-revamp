// Game configuration: pixel-art top-down racer
// 4 themes × 100 stages, expensive cars with brand-safe (lawsuit-safe) names

export const LANE_COUNT = 5; // 5 lanes for variety
export const TILE = 16; // pixel tile size
export const VIEW_W = 240; // logical pixel width (scaled up via CSS)
export const VIEW_H = 360; // logical pixel height
export const ROAD_LEFT = 32; // px from left where road starts
export const ROAD_RIGHT = VIEW_W - 32; // px from left where road ends
export const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
export const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

// player car logical size (pixels)
export const CAR_W = 24;
export const CAR_H = 36;

export type CarConfig = {
  id: string;
  name: string;
  inspiredBy: string; // for player display only
  price: number;
  body: string; // hex color
  accent: string;
  window: string;
  speed: number; // base speed (pixels/second of world scroll)
  handling: number; // lane change snappiness (0..1)
};

// Brand-safe inspired names + premium pricing
export const CARS: CarConfig[] = [
  {
    id: 'starter',
    name: 'CITY HATCH',
    inspiredBy: 'Starter ride',
    price: 0,
    body: '#3b82f6',
    accent: '#1e3a8a',
    window: '#0f172a',
    speed: 90,
    handling: 0.6,
  },
  {
    id: 'm-class',
    name: 'M-CLASS STAR',
    inspiredBy: 'inspired by Mercedes',
    price: 25000,
    body: '#e5e7eb',
    accent: '#9ca3af',
    window: '#1f2937',
    speed: 110,
    handling: 0.7,
  },
  {
    id: 'b-sport',
    name: 'B-SPORT GT',
    inspiredBy: 'inspired by BMW',
    price: 75000,
    body: '#1e293b',
    accent: '#60a5fa',
    window: '#0ea5e9',
    speed: 130,
    handling: 0.78,
  },
  {
    id: 't-volt',
    name: 'T-VOLT VIP',
    inspiredBy: 'inspired by Tesla',
    price: 200000,
    body: '#dc2626',
    accent: '#fbbf24',
    window: '#7f1d1d',
    speed: 150,
    handling: 0.85,
  },
  {
    id: 'lambo-x',
    name: 'L-BULL X',
    inspiredBy: 'inspired by Lamborghini',
    price: 500000,
    body: '#facc15',
    accent: '#000000',
    window: '#0f172a',
    speed: 175,
    handling: 0.92,
  },
  {
    id: 'phantom',
    name: 'R-PHANTOM',
    inspiredBy: 'inspired by Rolls-Royce',
    price: 1500000,
    body: '#0f172a',
    accent: '#fde68a',
    window: '#312e81',
    speed: 200,
    handling: 0.95,
  },
];

export type LevelTheme = {
  id: string;
  name: string;
  road: string;
  roadStripe: string;
  ground: string;
  groundAccent: string;
  decor: string;
  decorAccent: string;
  obstacleColor: string;
  obstacleAccent: string;
  sky: string;
  decorKind: 'building' | 'cactus' | 'tree' | 'neon';
};

export const THEMES: LevelTheme[] = [
  {
    id: 'city',
    name: 'CITY',
    road: '#374151',
    roadStripe: '#fde047',
    ground: '#22c55e',
    groundAccent: '#166534',
    decor: '#94a3b8',
    decorAccent: '#fde047',
    obstacleColor: '#ef4444',
    obstacleAccent: '#1f2937',
    sky: '#0f172a',
    decorKind: 'building',
  },
  {
    id: 'desert',
    name: 'DESERT',
    road: '#78350f',
    roadStripe: '#fde68a',
    ground: '#f59e0b',
    groundAccent: '#b45309',
    decor: '#15803d',
    decorAccent: '#facc15',
    obstacleColor: '#9a3412',
    obstacleAccent: '#1f2937',
    sky: '#fed7aa',
    decorKind: 'cactus',
  },
  {
    id: 'snow',
    name: 'SNOW',
    road: '#475569',
    roadStripe: '#f8fafc',
    ground: '#e2e8f0',
    groundAccent: '#cbd5e1',
    decor: '#0f766e',
    decorAccent: '#ffffff',
    obstacleColor: '#1e293b',
    obstacleAccent: '#f1f5f9',
    sky: '#cbd5e1',
    decorKind: 'tree',
  },
  {
    id: 'neon',
    name: 'NEON NIGHT',
    road: '#0a0a0a',
    roadStripe: '#ec4899',
    ground: '#1e1b4b',
    groundAccent: '#312e81',
    decor: '#1e1b4b',
    decorAccent: '#22d3ee',
    obstacleColor: '#f43f5e',
    obstacleAccent: '#ec4899',
    sky: '#020617',
    decorKind: 'neon',
  },
];

// 100 stages per theme
export const STAGES_PER_THEME = 100;

export type Stage = {
  themeId: string;
  index: number; // 1..100
  scoreGoal: number;
  speedMul: number;
  obstacleRate: number; // spawns/sec
  coinRate: number;
};

export const buildStage = (themeId: string, index: number): Stage => {
  // tier 0..3 by theme order so later themes start harder
  const themeTier = THEMES.findIndex((t) => t.id === themeId);
  const baseGoal = 200 + index * 200; // 200..20200
  const goal = Math.round(baseGoal * (1 + themeTier * 0.4));
  const speedMul = 1 + (index - 1) * 0.012 + themeTier * 0.15; // up to ~2.6x
  const obstacleRate = 0.9 + (index - 1) * 0.025 + themeTier * 0.3;
  const coinRate = 1.4 + (index - 1) * 0.01;
  return { themeId, index, scoreGoal: goal, speedMul, obstacleRate, coinRate };
};

export const STORAGE_KEY = 'turbo-dash-pixel-v2';

export type SaveData = {
  coins: number;
  ownedCars: string[];
  activeCarId: string;
  highScore: number;
  // unlocked stage index (1..100) per theme
  progress: Record<string, number>;
};

export const DEFAULT_SAVE: SaveData = {
  coins: 0,
  ownedCars: ['starter'],
  activeCarId: 'starter',
  highScore: 0,
  progress: { city: 1, desert: 0, snow: 0, neon: 0 },
};

// next theme unlock requires finishing all 100 stages of previous
export const themeUnlocked = (save: SaveData, themeId: string): boolean => {
  const idx = THEMES.findIndex((t) => t.id === themeId);
  if (idx <= 0) return true;
  const prev = THEMES[idx - 1];
  return (save.progress[prev.id] ?? 0) >= STAGES_PER_THEME;
};

export const stageUnlocked = (save: SaveData, themeId: string, stage: number): boolean => {
  if (!themeUnlocked(save, themeId)) return false;
  const reached = save.progress[themeId] ?? 0;
  return stage <= Math.max(1, reached + 1);
};
