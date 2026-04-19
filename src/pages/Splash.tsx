import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

export const Splash = ({ onDone }: Props) => {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 1900;
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
      className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 overflow-hidden"
      style={{
        fontFamily: '"Press Start 2P", ui-monospace, monospace',
        background:
          'radial-gradient(circle at 50% 0%, #312e81 0%, #0b0a23 55%, #000 100%)',
      }}
    >
      {/* animated grid floor */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 opacity-40"
        style={{
          background:
            'linear-gradient(transparent 0%, #ec4899 100%), repeating-linear-gradient(0deg, transparent 0 19px, rgba(236,72,153,0.5) 19px 20px), repeating-linear-gradient(90deg, transparent 0 19px, rgba(34,211,238,0.4) 19px 20px)',
          backgroundBlendMode: 'multiply',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }}
      />

      {/* sun glow */}
      <div
        aria-hidden
        className="absolute top-[18%] w-72 h-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', opacity: 0.6 }}
      />

      <div className="relative z-10 text-center mb-6">
        <h1
          className="text-5xl leading-tight tracking-tight"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #f97316 70%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 30px rgba(251, 146, 60, 0.5)',
            filter: 'drop-shadow(4px 4px 0 #000)',
          }}
        >
          TURBO
          <br />
          DASH
        </h1>
        <p className="mt-3 text-[10px] tracking-[0.4em] text-cyan-300">3D · EDITION</p>
      </div>

      {/* spinning wheel icon */}
      <div className="relative z-10 mb-8 w-16 h-16 rounded-full border-4 border-amber-300 border-t-transparent animate-spin" />

      <div className="relative z-10 w-64 h-3 border-2 border-white/40 bg-black/60 rounded-full overflow-hidden">
        <div
          className="h-full transition-[width] duration-100"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #22d3ee 0%, #fde047 50%, #ec4899 100%)',
            boxShadow: '0 0 12px rgba(236,72,153,0.8)',
          }}
        />
      </div>
      <p className="relative z-10 mt-3 text-[10px] text-white/60 tracking-widest">
        LOADING {Math.floor(pct)}%
      </p>
    </div>
  );
};
