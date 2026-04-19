import { useEffect, useRef } from 'react';
import { CarConfig } from '@/game/config';

interface Props {
  car: CarConfig;
  size?: number; // pixel size of canvas (CSS px); sprite is logical 24x36
}

// Renders the EXACT same sprite as the in-game player car, scaled up.
export const CarPreview = ({ car, size = 64 }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const W = 24;
  const H = 36;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, W, H);

    const x = 0;
    const y = 0;
    // shadow
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x + 2, y + H - 2, W - 4, 3);
    // body
    g.fillStyle = car.body;
    g.fillRect(x + 2, y + 2, W - 4, H - 4);
    // accent stripe
    g.fillStyle = car.accent;
    g.fillRect(x + 2, y + 16, W - 4, 2);
    g.fillRect(x + 10, y + 2, 4, H - 4);
    // windows
    g.fillStyle = car.window;
    g.fillRect(x + 4, y + 5, W - 8, 8);
    g.fillRect(x + 4, y + 22, W - 8, 6);
    // wheels
    g.fillStyle = '#0a0a0a';
    g.fillRect(x, y + 4, 3, 6);
    g.fillRect(x + W - 3, y + 4, 3, 6);
    g.fillRect(x, y + H - 12, 3, 6);
    g.fillRect(x + W - 3, y + H - 12, 3, 6);
    // headlights
    g.fillStyle = '#fef9c3';
    g.fillRect(x + 3, y, 3, 2);
    g.fillRect(x + W - 6, y, 3, 2);
  }, [car]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{
        imageRendering: 'pixelated',
        width: size * (W / H),
        height: size,
      }}
    />
  );
};
