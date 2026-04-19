interface Props {
  open: boolean;
  onResume: () => void;
  onExit: () => void; // user confirmed exit
}

import { useState } from 'react';

export const PauseMenu = ({ open, onResume, onExit }: Props) => {
  const [confirming, setConfirming] = useState(false);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-sm p-6">
      <div className="w-72 border-4 border-black bg-neutral-900 p-5 text-center" style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace' }}>
        {!confirming ? (
          <>
            <h3 className="text-amber-300 text-base mb-4">PAUSED</h3>
            <p className="text-[9px] text-white/60 mb-5">Take a breath. Your coins are safe.</p>
            <button
              onClick={onResume}
              className="w-full mb-2 bg-emerald-500 text-black border-4 border-black px-3 py-3 text-[11px] font-black active:translate-y-[2px]"
            >
              ▶ RESUME
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="w-full bg-rose-600 text-white border-4 border-black px-3 py-2 text-[10px] font-black active:translate-y-[2px]"
            >
              ✕ EXIT TO MENU
            </button>
          </>
        ) : (
          <>
            <h3 className="text-rose-400 text-sm mb-2">EXIT NOW?</h3>
            <p className="text-[9px] text-white/70 mb-4">
              Your stage progress will be lost,<br/>but coins you collected
              <span className="text-amber-300"> will be saved</span>.
            </p>
            <button
              onClick={onExit}
              className="w-full mb-2 bg-rose-600 text-white border-4 border-black px-3 py-3 text-[11px] font-black active:translate-y-[2px]"
            >
              YES, EXIT &amp; KEEP COINS
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="w-full bg-neutral-700 text-white border-4 border-black px-3 py-2 text-[10px] font-black active:translate-y-[2px]"
            >
              ← KEEP PLAYING
            </button>
          </>
        )}
      </div>
    </div>
  );
};
