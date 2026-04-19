import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

export const Splash = ({ onDone }: Props) => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1800;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / dur) * 100);
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white p-6"
      style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace' }}
    >
      <div className="text-center mb-8">
        <h1
          className="text-4xl text-amber-300 leading-tight"
          style={{ textShadow: '4px 4px 0 #7c2d12, 8px 8px 0 #000' }}
        >
          TURBO
          <br />
          DASH
        </h1>
        <p className="mt-3 text-[10px] text-fuchsia-400 tracking-widest">PIXEL EDITION</p>
      </div>

      {/* big pixel car */}
      <div className="mb-8" style={{ imageRendering: 'pixelated' }}>
        <svg width={96} height={144} viewBox="0 0 24 36" shapeRendering="crispEdges">
          <rect x={2} y={2} width={20} height={32} fill="#3b82f6" />
          <rect x={2} y={16} width={20} height={2} fill="#1e3a8a" />
          <rect x={10} y={2} width={4} height={32} fill="#1e3a8a" />
          <rect x={4} y={5} width={16} height={8} fill="#0f172a" />
          <rect x={4} y={22} width={16} height={6} fill="#0f172a" />
          <rect x={0} y={4} width={3} height={6} fill="#0a0a0a" />
          <rect x={21} y={4} width={3} height={6} fill="#0a0a0a" />
          <rect x={0} y={24} width={3} height={6} fill="#0a0a0a" />
          <rect x={21} y={24} width={3} height={6} fill="#0a0a0a" />
          <rect x={3} y={0} width={3} height={2} fill="#fef9c3" />
          <rect x={18} y={0} width={3} height={2} fill="#fef9c3" />
        </svg>
      </div>

      {/* progress bar */}
      <div className="w-64 h-4 border-4 border-white bg-black">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-fuchsia-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-[10px] text-white/60">LOADING {Math.floor(pct)}%</p>
    </div>
  );
};
