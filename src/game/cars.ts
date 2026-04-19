import { CarConfig } from './config';

// Brand-safe inspired names + 110 generated cars all priced at 11,000 coins
const NAME_PARTS_A = [
  'M-CLASS', 'B-SPORT', 'T-VOLT', 'L-BULL', 'R-PHANTOM', 'F-STALLION', 'P-CARRERA',
  'A-QUATTRO', 'J-PANTHER', 'K-WAVE', 'H-CIVIC', 'N-SKYLINE', 'V-STRADA', 'M-DRAGON',
  'C-VETTE', 'D-CHARGE', 'S-GTR', 'O-PEL', 'R-MUSTANG', 'Z-ROCKET', 'G-WAGEN',
];
const NAME_PARTS_B = [
  'STAR', 'GT', 'VIP', 'X', 'PHANTOM', 'TURBO', 'NITRO', 'STORM', 'BLADE',
  'PRIME', 'RACE', 'SHADOW', 'EDGE', 'PULSE', 'FURY', 'NOVA', 'TITAN',
];
const INSPIRED = [
  'inspired by Mercedes', 'inspired by BMW', 'inspired by Tesla',
  'inspired by Lamborghini', 'inspired by Rolls-Royce', 'inspired by Ferrari',
  'inspired by Porsche', 'inspired by Audi', 'inspired by Jaguar',
  'inspired by Koenigsegg', 'inspired by Honda', 'inspired by Nissan',
  'inspired by Maserati', 'inspired by Dodge', 'inspired by Chevrolet',
  'inspired by Bugatti', 'inspired by Aston Martin', 'inspired by McLaren',
];

// Curated palettes (body, accent, window) for visual variety
const PALETTES: Array<[string, string, string]> = [
  ['#e5e7eb', '#9ca3af', '#1f2937'], // silver
  ['#1e293b', '#60a5fa', '#0ea5e9'], // navy/cyan
  ['#dc2626', '#fbbf24', '#7f1d1d'], // red/gold
  ['#facc15', '#000000', '#0f172a'], // yellow/black
  ['#0f172a', '#fde68a', '#312e81'], // black/cream
  ['#16a34a', '#bbf7d0', '#064e3b'], // green
  ['#9333ea', '#f0abfc', '#3b0764'], // purple
  ['#0ea5e9', '#bae6fd', '#0c4a6e'], // sky
  ['#f97316', '#fed7aa', '#7c2d12'], // orange
  ['#ec4899', '#fbcfe8', '#831843'], // pink
  ['#06b6d4', '#a5f3fc', '#164e63'], // teal
  ['#84cc16', '#d9f99d', '#365314'], // lime
  ['#a855f7', '#e9d5ff', '#581c87'], // violet
  ['#ef4444', '#fee2e2', '#7f1d1d'], // crimson
  ['#22d3ee', '#cffafe', '#155e75'], // aqua
  ['#fbbf24', '#fef3c7', '#78350f'], // amber
  ['#10b981', '#a7f3d0', '#064e3b'], // emerald
  ['#f43f5e', '#ffe4e6', '#881337'], // rose
  ['#6366f1', '#c7d2fe', '#312e81'], // indigo
  ['#fb7185', '#ffe4e6', '#9f1239'], // coral
  ['#475569', '#cbd5e1', '#0f172a'], // slate
  ['#92400e', '#fef3c7', '#451a03'], // bronze
  ['#be185d', '#fbcfe8', '#500724'], // magenta
  ['#0891b2', '#cffafe', '#083344'], // cyan deep
  ['#854d0e', '#fde68a', '#422006'], // gold
];

const TOTAL = 110; // total purchasable cars including starter
const PRICE = 11000;

export const CARS_GENERATED: CarConfig[] = (() => {
  const list: CarConfig[] = [];
  // Starter (free)
  list.push({
    id: 'starter',
    name: 'CITY HATCH',
    inspiredBy: 'Starter ride',
    price: 0,
    body: '#3b82f6',
    accent: '#1e3a8a',
    window: '#0f172a',
    speed: 90,
    handling: 0.6,
  });

  for (let i = 1; i < TOTAL; i++) {
    const palette = PALETTES[i % PALETTES.length];
    const a = NAME_PARTS_A[i % NAME_PARTS_A.length];
    const b = NAME_PARTS_B[(i * 3) % NAME_PARTS_B.length];
    const inspired = INSPIRED[i % INSPIRED.length];
    // Speed and handling scale slightly with index for variety, capped
    const speed = 100 + ((i * 7) % 110); // 100..210
    const handling = Math.min(0.95, 0.6 + ((i * 11) % 36) / 100); // 0.6..0.95
    list.push({
      id: `car-${i}`,
      name: `${a} ${b}`,
      inspiredBy: inspired,
      price: PRICE,
      body: palette[0],
      accent: palette[1],
      window: palette[2],
      speed,
      handling,
    });
  }
  return list;
})();
