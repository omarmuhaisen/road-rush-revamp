import { useEffect, useRef } from 'react';
import {
  CarConfig,
  LevelTheme,
  Stage,
  VIEW_W,
  VIEW_H,
  ROAD_LEFT,
  ROAD_RIGHT,
  ROAD_WIDTH,
  LANE_COUNT,
  LANE_WIDTH,
  CAR_W,
  CAR_H,
} from './config';

type Entity = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'obstacle' | 'coin';
  color?: string;
  accent?: string;
};

interface Props {
  car: CarConfig;
  theme: LevelTheme;
  stage: Stage;
  isPlaying: boolean;
  onCoin: () => void;
  onCrash: () => void;
  onScoreTick: (delta: number) => void;
  onProgress?: (pct: number) => void; // 0..1 distance progress
  onFinish?: () => void;
}

const px = (n: number) => Math.round(n);

// distance in pixels required to finish a stage (scales with index)
const stageDistance = (stage: Stage) => 1800 + stage.index * 80; // ~1880..9800

export const PixelGame = ({
  car,
  theme,
  stage,
  isPlaying,
  onCoin,
  onCrash,
  onScoreTick,
  onProgress,
  onFinish,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerLane = useRef(2);
  const playerX = useRef(ROAD_LEFT + LANE_WIDTH * 2.5);
  const targetPlayerX = useRef(ROAD_LEFT + LANE_WIDTH * 2.5);
  const dragging = useRef(false);
  const entities = useRef<Entity[]>([]);
  const idCounter = useRef(0);
  const roadOffset = useRef(0);
  const spawnTimer = useRef(0);
  const coinTimer = useRef(0);
  const scoreAccum = useRef(0);
  const distance = useRef(0);
  const finishY = useRef<number | null>(null); // y of finish line on screen
  const finished = useRef(false);
  const rafId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);
  const crashLock = useRef(false); // ignore one frame after crash dispatched

  const moveLane = (dir: 'left' | 'right') => {
    if (!isPlaying) return;
    if (dir === 'left') playerLane.current = Math.max(0, playerLane.current - 1);
    else playerLane.current = Math.min(LANE_COUNT - 1, playerLane.current + 1);
    targetPlayerX.current = ROAD_LEFT + LANE_WIDTH * (playerLane.current + 0.5);
  };

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) moveLane('left');
      if (['ArrowRight', 'd', 'D'].includes(e.key)) moveLane('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // touch / pointer drag — finger position controls car
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const localXFromEvent = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = VIEW_W / rect.width;
      return (clientX - rect.left) * ratio;
    };

    const setFromX = (x: number) => {
      // clamp to road and snap to nearest lane center
      const clamped = Math.max(ROAD_LEFT + LANE_WIDTH / 2, Math.min(ROAD_RIGHT - LANE_WIDTH / 2, x));
      targetPlayerX.current = clamped;
      const lane = Math.round((clamped - ROAD_LEFT - LANE_WIDTH / 2) / LANE_WIDTH);
      playerLane.current = Math.max(0, Math.min(LANE_COUNT - 1, lane));
    };

    const down = (e: PointerEvent) => {
      if (!isPlaying) return;
      dragging.current = true;
      canvas.setPointerCapture?.(e.pointerId);
      setFromX(localXFromEvent(e.clientX));
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current || !isPlaying) return;
      setFromX(localXFromEvent(e.clientX));
    };
    const up = (e: PointerEvent) => {
      dragging.current = false;
      try {
        canvas.releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', up);

    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('pointerleave', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // reset on stage / play change
  useEffect(() => {
    entities.current = [];
    idCounter.current = 0;
    roadOffset.current = 0;
    spawnTimer.current = 0;
    coinTimer.current = 0;
    scoreAccum.current = 0;
    distance.current = 0;
    finishY.current = null;
    finished.current = false;
    crashLock.current = false;
    playerLane.current = 2;
    playerX.current = ROAD_LEFT + LANE_WIDTH * 2.5;
    targetPlayerX.current = playerX.current;
  }, [stage.themeId, stage.index, isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const speed = car.speed * stage.speedMul;
    const totalDist = stageDistance(stage);

    const tick = (time: number) => {
      const dt = lastTime.current ? Math.min(0.05, (time - lastTime.current) / 1000) : 0.016;
      lastTime.current = time;

      if (isPlaying && !finished.current) {
        roadOffset.current = (roadOffset.current + speed * dt) % 32;

        // smooth lerp toward target
        playerX.current += (targetPlayerX.current - playerX.current) * Math.min(1, car.handling * 14 * dt);

        // distance + finish line spawn
        distance.current += speed * dt;
        if (onProgress) onProgress(Math.min(1, distance.current / totalDist));

        if (distance.current >= totalDist && finishY.current === null) {
          finishY.current = -16; // spawn finish line above viewport
        }
        if (finishY.current !== null) {
          finishY.current += speed * dt;
          // when finish line reaches the player band, declare finish
          if (finishY.current >= VIEW_H - CAR_H - 12 && !finished.current) {
            finished.current = true;
            onFinish?.();
          }
        }

        // move entities
        for (const e of entities.current) e.y += speed * dt;
        entities.current = entities.current.filter((e) => e.y < VIEW_H + 40);

        // collisions
        if (!crashLock.current) {
          const px_ = playerX.current - CAR_W / 2;
          const py = VIEW_H - CAR_H - 12;
          let crashed = false;
          const remaining: Entity[] = [];
          for (const e of entities.current) {
            const overlap =
              px_ < e.x + e.w / 2 &&
              px_ + CAR_W > e.x - e.w / 2 &&
              py < e.y + e.h &&
              py + CAR_H > e.y;
            if (overlap) {
              if (e.type === 'coin') {
                onCoin();
                continue;
              }
              if (e.type === 'obstacle') {
                crashed = true;
              }
            }
            remaining.push(e);
          }
          entities.current = remaining;
          if (crashed) {
            crashLock.current = true;
            onCrash();
          }
        }

        // stop spawning once finish line is on screen
        if (finishY.current === null) {
          spawnTimer.current += dt;
          const spawnEvery = 1 / stage.obstacleRate;
          while (spawnTimer.current > spawnEvery) {
            spawnTimer.current -= spawnEvery;
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const x = ROAD_LEFT + LANE_WIDTH * (lane + 0.5);
            idCounter.current += 1;
            entities.current.push({
              id: idCounter.current,
              x,
              y: -40,
              w: CAR_W,
              h: CAR_H,
              type: 'obstacle',
              color: theme.obstacleColor,
              accent: theme.obstacleAccent,
            });
          }
          coinTimer.current += dt;
          const coinEvery = 1 / stage.coinRate;
          while (coinTimer.current > coinEvery) {
            coinTimer.current -= coinEvery;
            const lane = Math.floor(Math.random() * LANE_COUNT);
            const x = ROAD_LEFT + LANE_WIDTH * (lane + 0.5);
            idCounter.current += 1;
            entities.current.push({
              id: idCounter.current,
              x,
              y: -20,
              w: 10,
              h: 10,
              type: 'coin',
            });
          }
        }

        scoreAccum.current += speed * dt * 0.1;
        if (scoreAccum.current >= 1) {
          const inc = Math.floor(scoreAccum.current);
          scoreAccum.current -= inc;
          onScoreTick(inc);
        }
      }

      draw(ctx);
      rafId.current = requestAnimationFrame(tick);
    };

    const draw = (g: CanvasRenderingContext2D) => {
      g.fillStyle = theme.sky;
      g.fillRect(0, 0, VIEW_W, VIEW_H);
      g.fillStyle = theme.ground;
      g.fillRect(0, 0, ROAD_LEFT, VIEW_H);
      g.fillRect(ROAD_RIGHT, 0, VIEW_W - ROAD_RIGHT, VIEW_H);

      g.fillStyle = theme.groundAccent;
      const off = Math.floor(roadOffset.current);
      for (let y = -32 + off; y < VIEW_H; y += 16) {
        g.fillRect(8, y, 16, 6);
        g.fillRect(VIEW_W - 24, y + 8, 16, 6);
      }

      drawDecor(g, theme, off);

      g.fillStyle = theme.road;
      g.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, VIEW_H);
      g.fillStyle = theme.roadStripe;
      g.fillRect(ROAD_LEFT - 2, 0, 2, VIEW_H);
      g.fillRect(ROAD_RIGHT, 0, 2, VIEW_H);

      for (let l = 1; l < LANE_COUNT; l++) {
        const x = ROAD_LEFT + LANE_WIDTH * l;
        for (let y = -32 + off; y < VIEW_H; y += 32) {
          g.fillRect(px(x) - 1, y, 2, 16);
        }
      }

      // finish line (checkered)
      if (finishY.current !== null) {
        drawFinishLine(g, finishY.current);
      }

      for (const e of entities.current) {
        if (e.type === 'coin') drawCoin(g, e.x, e.y);
        else drawObstacleCar(g, e.x, e.y, e.color!, e.accent!);
      }

      drawPlayerCar(g, playerX.current, VIEW_H - CAR_H - 12, car);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      lastTime.current = 0;
    };
  }, [car, theme, stage, isPlaying, onCoin, onCrash, onScoreTick, onProgress, onFinish]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W}
      height={VIEW_H}
      className="block w-full h-full touch-none"
      style={{
        imageRendering: 'pixelated',
        objectFit: 'contain',
      }}
    />
  );
};

// ============ pixel sprite drawers ============

const drawPlayerCar = (g: CanvasRenderingContext2D, cx: number, y: number, car: CarConfig) => {
  const x = Math.round(cx - CAR_W / 2);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x + 1, y + CAR_H - 2, CAR_W - 2, 3);
  g.fillStyle = car.body;
  g.fillRect(x + 1, y + 2, CAR_W - 2, CAR_H - 4);
  g.fillStyle = car.accent;
  g.fillRect(x + 1, y + 13, CAR_W - 2, 2);
  g.fillRect(x + Math.floor(CAR_W / 2) - 1, y + 2, 2, CAR_H - 4);
  g.fillStyle = car.window;
  g.fillRect(x + 3, y + 4, CAR_W - 6, 6);
  g.fillRect(x + 3, y + 17, CAR_W - 6, 5);
  g.fillStyle = '#0a0a0a';
  g.fillRect(x - 1, y + 4, 2, 5);
  g.fillRect(x + CAR_W - 1, y + 4, 2, 5);
  g.fillRect(x - 1, y + CAR_H - 9, 2, 5);
  g.fillRect(x + CAR_W - 1, y + CAR_H - 9, 2, 5);
  g.fillStyle = '#fef9c3';
  g.fillRect(x + 2, y, 2, 2);
  g.fillRect(x + CAR_W - 4, y, 2, 2);
};

const drawObstacleCar = (g: CanvasRenderingContext2D, cx: number, y: number, color: string, accent: string) => {
  const x = Math.round(cx - CAR_W / 2);
  y = Math.round(y);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x + 1, y + CAR_H - 2, CAR_W - 2, 3);
  g.fillStyle = color;
  g.fillRect(x + 1, y + 2, CAR_W - 2, CAR_H - 4);
  g.fillStyle = accent;
  g.fillRect(x + 1, y + CAR_H - 7, CAR_W - 2, 2);
  g.fillStyle = '#0f172a';
  g.fillRect(x + 3, y + CAR_H - 11, CAR_W - 6, 5);
  g.fillRect(x + 3, y + 4, CAR_W - 6, 5);
  g.fillStyle = '#fbbf24';
  g.fillRect(x + 2, y + CAR_H - 3, 2, 2);
  g.fillRect(x + CAR_W - 4, y + CAR_H - 3, 2, 2);
  g.fillStyle = '#0a0a0a';
  g.fillRect(x - 1, y + 4, 2, 5);
  g.fillRect(x + CAR_W - 1, y + 4, 2, 5);
  g.fillRect(x - 1, y + CAR_H - 9, 2, 5);
  g.fillRect(x + CAR_W - 1, y + CAR_H - 9, 2, 5);
};

const drawCoin = (g: CanvasRenderingContext2D, cx: number, cy: number) => {
  const x = Math.round(cx - 5);
  const y = Math.round(cy);
  g.fillStyle = '#ca8a04';
  g.fillRect(x + 2, y, 6, 10);
  g.fillRect(x, y + 2, 10, 6);
  g.fillStyle = '#fbbf24';
  g.fillRect(x + 3, y + 1, 4, 8);
  g.fillRect(x + 1, y + 3, 8, 4);
  g.fillStyle = '#fef3c7';
  g.fillRect(x + 4, y + 2, 1, 5);
};

const drawFinishLine = (g: CanvasRenderingContext2D, y: number) => {
  const yy = Math.round(y);
  const cell = 8;
  // top white border
  g.fillStyle = '#ffffff';
  g.fillRect(ROAD_LEFT, yy - 2, ROAD_WIDTH, 2);
  // checkered band
  for (let row = 0; row < 2; row++) {
    for (let cx = ROAD_LEFT, i = 0; cx < ROAD_RIGHT; cx += cell, i++) {
      g.fillStyle = (i + row) % 2 === 0 ? '#ffffff' : '#000000';
      g.fillRect(cx, yy + row * cell, cell, cell);
    }
  }
  g.fillStyle = '#ffffff';
  g.fillRect(ROAD_LEFT, yy + cell * 2, ROAD_WIDTH, 2);
};

const drawDecor = (g: CanvasRenderingContext2D, theme: LevelTheme, off: number) => {
  const positions = [10, VIEW_W - 26];
  const bandH = 60;
  const bands = Math.ceil(VIEW_H / bandH) + 2;
  for (let i = -1; i < bands; i++) {
    const y = i * bandH + (off * 2) % bandH;
    for (const x of positions) {
      const seed = i * 31 + x;
      drawDecorItem(g, x, y, theme, seed);
    }
  }
};

const drawDecorItem = (g: CanvasRenderingContext2D, x: number, y: number, theme: LevelTheme, seed: number) => {
  const r = (n: number) => {
    const s = Math.sin(seed * 9999 + n * 13) * 10000;
    return s - Math.floor(s);
  };
  if (theme.decorKind === 'building') {
    const h = 30 + Math.floor(r(1) * 24);
    g.fillStyle = theme.decor;
    g.fillRect(x, y, 16, h);
    g.fillStyle = theme.decorAccent;
    for (let wy = y + 4; wy < y + h - 4; wy += 6) {
      for (let wx = x + 2; wx < x + 14; wx += 4) {
        if (r(wy + wx) > 0.4) g.fillRect(wx, wy, 2, 2);
      }
    }
  } else if (theme.decorKind === 'cactus') {
    g.fillStyle = theme.decor;
    g.fillRect(x + 6, y + 4, 4, 20);
    g.fillRect(x + 2, y + 10, 4, 8);
    g.fillRect(x + 10, y + 8, 4, 10);
    g.fillStyle = theme.decorAccent;
    g.fillRect(x + 7, y + 6, 1, 1);
    g.fillRect(x + 9, y + 14, 1, 1);
  } else if (theme.decorKind === 'tree') {
    g.fillStyle = '#5a3825';
    g.fillRect(x + 7, y + 18, 2, 8);
    g.fillStyle = theme.decor;
    g.fillRect(x + 4, y + 14, 8, 6);
    g.fillRect(x + 5, y + 8, 6, 6);
    g.fillRect(x + 6, y + 4, 4, 6);
    g.fillStyle = theme.decorAccent;
    g.fillRect(x + 5, y + 14, 6, 1);
    g.fillRect(x + 6, y + 8, 4, 1);
    g.fillRect(x + 7, y + 4, 2, 1);
  } else {
    g.fillStyle = theme.decor;
    g.fillRect(x + 5, y + 4, 6, 28);
    g.fillStyle = theme.decorAccent;
    g.fillRect(x + 7, y + 6, 2, 24);
    g.fillRect(x + 4, y + 10, 8, 1);
    g.fillRect(x + 4, y + 22, 8, 1);
  }
};
