import { useEffect, useState } from 'react';

interface AdModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  reward?: { coins?: number; label?: string };
  onComplete: () => void;
  onSkip?: () => void;
  durationSec?: number;
}

// Fake/simulated rewarded ad. NOT a real ad SDK.
export const AdModal = ({
  open,
  title,
  subtitle,
  ctaLabel,
  reward,
  onComplete,
  onSkip,
  durationSec = 5,
}: AdModalProps) => {
  const [seconds, setSeconds] = useState(durationSec);

  useEffect(() => {
    if (!open) {
      setSeconds(durationSec);
      return;
    }
    setSeconds(durationSec);
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [open, durationSec]);

  if (!open) return null;

  const canClaim = seconds === 0;

  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm bg-neutral-900 border-4 border-amber-400 rounded-none shadow-[8px_8px_0_0_rgba(0,0,0,0.6)] overflow-hidden"
        style={{ fontFamily: '"Press Start 2P", monospace, system-ui' }}
      >
        {/* Ad header bar */}
        <div className="flex items-center justify-between bg-amber-400 text-black px-3 py-1 text-[10px] font-extrabold tracking-widest">
          <span>● AD</span>
          <span>SPONSORED</span>
        </div>

        {/* Fake ad content */}
        <div className="p-6 text-center bg-gradient-to-b from-fuchsia-700 via-purple-800 to-indigo-900 text-white">
          <div className="text-3xl mb-3 animate-bounce">🎮 🚗 💎</div>
          <h3 className="text-sm font-black uppercase tracking-wider mb-2">{title}</h3>
          {subtitle && <p className="text-[10px] text-white/80 leading-relaxed">{subtitle}</p>}
          <div className="mt-4 px-3 py-2 bg-black/40 border border-white/20 inline-block text-[9px] text-white/70">
            DOWNLOAD NOW · FREE · 4.8★
          </div>
        </div>

        {/* Reward / countdown */}
        <div className="bg-neutral-950 p-4 text-center border-t-4 border-amber-400">
          {reward?.coins && (
            <p className="text-amber-300 text-xs font-bold mb-3">
              REWARD: +{reward.coins} 💰 {reward.label ?? ''}
            </p>
          )}
          {!canClaim ? (
            <div className="text-white/60 text-[10px] mb-3">
              AD CLOSES IN {seconds}s
            </div>
          ) : (
            <div className="text-emerald-400 text-[10px] mb-3">READY ✓</div>
          )}
          <div className="flex gap-2 justify-center">
            {onSkip && (
              <button
                onClick={onSkip}
                disabled={!canClaim}
                className="px-3 py-2 text-[9px] bg-neutral-800 text-white/70 disabled:opacity-30 hover:bg-neutral-700"
              >
                SKIP
              </button>
            )}
            <button
              onClick={onComplete}
              disabled={!canClaim}
              className="px-4 py-2 text-[10px] bg-amber-400 text-black font-black disabled:opacity-30 hover:brightness-110"
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
