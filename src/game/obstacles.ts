// Theme-specific 3D obstacle definitions.
// Each obstacle returns geometry params; rendering is done in Game3D via instanced meshes / primitive groups.

export type ObstacleKind =
  // city
  | 'car_red' | 'car_yellow' | 'truck_blue' | 'bus' | 'cone'
  // desert
  | 'rock' | 'camel' | 'cactus_big' | 'barrel'
  // snow
  | 'snowpile' | 'sled' | 'iceblock' | 'snowman'
  // neon
  | 'robot' | 'laser_gate' | 'hover_drone' | 'neon_block';

export type ObstacleDef = {
  kind: ObstacleKind;
  // bounding box for collision (meters)
  width: number;
  depth: number;
  height: number;
};

export const THEME_OBSTACLES: Record<string, ObstacleKind[]> = {
  city: ['car_red', 'car_yellow', 'truck_blue', 'bus', 'cone'],
  desert: ['rock', 'camel', 'cactus_big', 'barrel'],
  snow: ['snowpile', 'sled', 'iceblock', 'snowman'],
  neon: ['robot', 'laser_gate', 'hover_drone', 'neon_block'],
};

export const OBSTACLE_DEFS: Record<ObstacleKind, ObstacleDef> = {
  // CITY
  car_red:    { kind: 'car_red',    width: 1.0, depth: 1.9, height: 0.9 },
  car_yellow: { kind: 'car_yellow', width: 1.0, depth: 1.9, height: 0.9 },
  truck_blue: { kind: 'truck_blue', width: 1.1, depth: 2.6, height: 1.5 },
  bus:        { kind: 'bus',        width: 1.2, depth: 3.2, height: 1.7 },
  cone:       { kind: 'cone',       width: 0.5, depth: 0.5, height: 0.7 },
  // DESERT
  rock:       { kind: 'rock',       width: 1.2, depth: 1.2, height: 0.9 },
  camel:      { kind: 'camel',      width: 1.0, depth: 1.6, height: 1.7 },
  cactus_big: { kind: 'cactus_big', width: 0.7, depth: 0.7, height: 1.8 },
  barrel:     { kind: 'barrel',     width: 0.6, depth: 0.6, height: 1.0 },
  // SNOW
  snowpile:   { kind: 'snowpile',   width: 1.3, depth: 1.3, height: 0.8 },
  sled:       { kind: 'sled',       width: 0.9, depth: 1.6, height: 0.6 },
  iceblock:   { kind: 'iceblock',   width: 1.0, depth: 1.0, height: 1.0 },
  snowman:    { kind: 'snowman',    width: 0.8, depth: 0.8, height: 1.6 },
  // NEON
  robot:       { kind: 'robot',       width: 0.9, depth: 0.9, height: 1.7 },
  laser_gate:  { kind: 'laser_gate',  width: 1.4, depth: 0.2, height: 1.5 },
  hover_drone: { kind: 'hover_drone', width: 1.0, depth: 1.0, height: 0.6 },
  neon_block:  { kind: 'neon_block',  width: 1.1, depth: 1.1, height: 1.1 },
};

export const pickObstacleForTheme = (themeId: string): ObstacleKind => {
  const list = THEME_OBSTACLES[themeId] ?? THEME_OBSTACLES.city;
  return list[Math.floor(Math.random() * list.length)];
};
