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

// player car logical size (pixels) — smaller for cleaner top-down look
export const CAR_W = 18;
export const CAR_H = 28;

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

// 110 cars total — starter free, all others 11,000 coins
import { CARS_GENERATED } from './cars';
export const CARS: CarConfig[] = CARS_GENERATED;

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
  // sharper difficulty curve: scoreGoal grows quadratically with index
  const baseGoal = 250 + index * 250 + Math.pow(index, 1.4) * 6;
  const goal = Math.round(baseGoal * (1 + themeTier * 0.5));
  // speed scales steeper; capped via use site
  const speedMul = 1 + (index - 1) * 0.022 + themeTier * 0.22; // up to ~3.3x
  // obstacle rate ramps much faster per stage
  const obstacleRate = 0.9 + (index - 1) * 0.045 + themeTier * 0.4;
  // coin rate grows mildly so coins remain rewarding
  const coinRate = 1.4 + (index - 1) * 0.014 + themeTier * 0.1;
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
