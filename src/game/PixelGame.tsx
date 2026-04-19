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
  x: number; // center x in logical px
  y: number; // top y
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
}

// integer pixel rect helper
const px = (n: number) => Math.round(n);

export const PixelGame = ({ car, theme, stage, isPlaying, onCoin, onCrash, onScoreTick }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerLane = useRef(2); // start middle of 5 lanes
  const playerX = useRef(ROAD_LEFT + LANE_WIDTH * 2.5);
  const entities = useRef<Entity[]>([]);
  const idCounter = useRef(0);
  const roadOffset = useRef(0);
  const spawnTimer = useRef(0);
  const coinTimer = useRef(0);
  const scoreAccum = useRef(0);
  const rafId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);

  // expose lane control via key/touch handlers
  const move = (dir: 'left' | 'right') => {
    if (!isPlaying) return;
    if (dir === 'left') playerLane.current = Math.max(0, playerLane.current - 1);
    else playerLane.current = Math.min(LANE_COUNT - 1, playerLane.current + 1);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) move('left');
      if (['ArrowRight', 'd', 'D'].includes(e.key)) move('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // touch swipe
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let startX = 0;
    let startY = 0;
    const ts = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    };
    const te = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'right' : 'left');
      }
    };
    canvas.addEventListener('touchstart', ts, { passive: true });
    canvas.addEventListener('touchend', te, { passive: true });
    return () => {
      canvas.removeEventListener('touchstart', ts);
      canvas.removeEventListener('touchend', te);
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
    playerLane.current = 2;
    playerX.current = ROAD_LEFT + LANE_WIDTH * 2.5;
  }, [stage.themeId, stage.index, isPlaying]);

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const speed = car.speed * stage.speedMul; // px/sec scroll

    const tick = (time: number) => {
      const dt = lastTime.current ? Math.min(0.05, (time - lastTime.current) / 1000) : 0.016;
      lastTime.current = time;

      if (isPlaying) {
        // road scroll for stripe animation
        roadOffset.current = (roadOffset.current + speed * dt) % 32;

        // smooth lane lerp
        const targetX = ROAD_LEFT + LANE_WIDTH * (playerLane.current + 0.5);
        playerX.current += (targetX - playerX.current) * Math.min(1, car.handling * 12 * dt);

        // move entities
        for (const e of entities.current) e.y += speed * dt;
        entities.current = entities.current.filter((e) => e.y < VIEW_H + 40);

        // collisions
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
              continue; // remove
            }
            if (e.type === 'obstacle') {
              crashed = true;
            }
          }
          remaining.push(e);
        }
        entities.current = remaining;
        if (crashed) {
          onCrash();
        }

        // spawning
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
            w: 12,
            h: 12,
            type: 'coin',
          });
        }

        // score = distance
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
      // sky / outer
      g.fillStyle = theme.sky;
      g.fillRect(0, 0, VIEW_W, VIEW_H);

      // ground
      g.fillStyle = theme.ground;
      g.fillRect(0, 0, ROAD_LEFT, VIEW_H);
      g.fillRect(ROAD_RIGHT, 0, VIEW_W - ROAD_RIGHT, VIEW_H);

      // ground accent stripes (animated)
      g.fillStyle = theme.groundAccent;
      const off = Math.floor(roadOffset.current);
      for (let y = -32 + off; y < VIEW_H; y += 16) {
        g.fillRect(8, y, 16, 6);
        g.fillRect(VIEW_W - 24, y + 8, 16, 6);
      }

      // decor (theme dependent), repeats with road scroll
      drawDecor(g, theme, off);

      // road
      g.fillStyle = theme.road;
      g.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, VIEW_H);

      // road edges
      g.fillStyle = theme.roadStripe;
      g.fillRect(ROAD_LEFT - 2, 0, 2, VIEW_H);
      g.fillRect(ROAD_RIGHT, 0, 2, VIEW_H);

      // lane stripes (dashed, animated)
      for (let l = 1; l < LANE_COUNT; l++) {
        const x = ROAD_LEFT + LANE_WIDTH * l;
        for (let y = -32 + off; y < VIEW_H; y += 32) {
          g.fillRect(px(x) - 1, y, 2, 16);
        }
      }

      // entities
      for (const e of entities.current) {
        if (e.type === 'coin') drawCoin(g, e.x, e.y);
        else drawObstacleCar(g, e.x, e.y, e.color!, e.accent!);
      }

      // player car
      drawPlayerCar(g, playerX.current, VIEW_H - CAR_H - 12, car);
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      lastTime.current = 0;
    };
  }, [car, theme, stage, isPlaying, onCoin, onCrash, onScoreTick]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W}
      height={VIEW_H}
      className="block w-full h-full"
      style={{
        imageRendering: 'pixelated',
        // pixel-perfect scale to fit container while keeping aspect
        objectFit: 'contain',
      }}
    />
  );
};

// ============ pixel sprite drawers ============

const drawPlayerCar = (g: CanvasRenderingContext2D, cx: number, y: number, car: CarConfig) => {
  const x = Math.round(cx - CAR_W / 2);
  // shadow
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x + 2, y + CAR_H - 2, CAR_W - 4, 3);
  // body
  g.fillStyle = car.body;
  g.fillRect(x + 2, y + 2, CAR_W - 4, CAR_H - 4);
  // accent stripe
  g.fillStyle = car.accent;
  g.fillRect(x + 2, y + 16, CAR_W - 4, 2);
  g.fillRect(x + 10, y + 2, 4, CAR_H - 4);
  // windshield
  g.fillStyle = car.window;
  g.fillRect(x + 4, y + 5, CAR_W - 8, 8);
  g.fillRect(x + 4, y + 22, CAR_W - 8, 6);
  // wheels (top-down view shows tire edges)
  g.fillStyle = '#0a0a0a';
  g.fillRect(x, y + 4, 3, 6);
  g.fillRect(x + CAR_W - 3, y + 4, 3, 6);
  g.fillRect(x, y + CAR_H - 12, 3, 6);
  g.fillRect(x + CAR_W - 3, y + CAR_H - 12, 3, 6);
  // headlights at front (bottom in our view? player goes up, so front is top)
  g.fillStyle = '#fef9c3';
  g.fillRect(x + 3, y, 3, 2);
  g.fillRect(x + CAR_W - 6, y, 3, 2);
};

const drawObstacleCar = (g: CanvasRenderingContext2D, cx: number, y: number, color: string, accent: string) => {
  const x = Math.round(cx - CAR_W / 2);
  y = Math.round(y);
  g.fillStyle = 'rgba(0,0,0,0.35)';
  g.fillRect(x + 2, y + CAR_H - 2, CAR_W - 4, 3);
  g.fillStyle = color;
  g.fillRect(x + 2, y + 2, CAR_W - 4, CAR_H - 4);
  g.fillStyle = accent;
  g.fillRect(x + 2, y + CAR_H - 8, CAR_W - 4, 2);
  // windows (facing player, so windshield at bottom)
  g.fillStyle = '#0f172a';
  g.fillRect(x + 4, y + CAR_H - 14, CAR_W - 8, 7);
  g.fillRect(x + 4, y + 4, CAR_W - 8, 7);
  // taillights at top (going same direction or opposite — give red lights at top to look threatening)
  g.fillStyle = '#fbbf24';
  g.fillRect(x + 3, y + CAR_H - 3, 3, 2);
  g.fillRect(x + CAR_W - 6, y + CAR_H - 3, 3, 2);
  g.fillStyle = '#0a0a0a';
  g.fillRect(x, y + 4, 3, 6);
  g.fillRect(x + CAR_W - 3, y + 4, 3, 6);
  g.fillRect(x, y + CAR_H - 12, 3, 6);
  g.fillRect(x + CAR_W - 3, y + CAR_H - 12, 3, 6);
};

const drawCoin = (g: CanvasRenderingContext2D, cx: number, cy: number) => {
  const x = Math.round(cx - 6);
  const y = Math.round(cy);
  g.fillStyle = '#ca8a04';
  g.fillRect(x + 2, y, 8, 12);
  g.fillRect(x, y + 2, 12, 8);
  g.fillStyle = '#fbbf24';
  g.fillRect(x + 3, y + 1, 6, 10);
  g.fillRect(x + 1, y + 3, 10, 6);
  g.fillStyle = '#fef3c7';
  g.fillRect(x + 5, y + 3, 2, 6);
};

const drawDecor = (g: CanvasRenderingContext2D, theme: LevelTheme, off: number) => {
  // draw two columns (left/right of road) of decor that scrolls with road
  const positions = [10, VIEW_W - 26];
  // deterministic per repeat band
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
    // windows pattern
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
    // trunk
    g.fillStyle = '#5a3825';
    g.fillRect(x + 7, y + 18, 2, 8);
    // pine
    g.fillStyle = theme.decor;
    g.fillRect(x + 4, y + 14, 8, 6);
    g.fillRect(x + 5, y + 8, 6, 6);
    g.fillRect(x + 6, y + 4, 4, 6);
    // snow caps
    g.fillStyle = theme.decorAccent;
    g.fillRect(x + 5, y + 14, 6, 1);
    g.fillRect(x + 6, y + 8, 4, 1);
    g.fillRect(x + 7, y + 4, 2, 1);
  } else {
    // neon pillar
    g.fillStyle = theme.decor;
    g.fillRect(x + 5, y + 4, 6, 28);
    g.fillStyle = theme.decorAccent;
    g.fillRect(x + 7, y + 6, 2, 24);
    g.fillRect(x + 4, y + 10, 8, 1);
    g.fillRect(x + 4, y + 22, 8, 1);
  }
};
