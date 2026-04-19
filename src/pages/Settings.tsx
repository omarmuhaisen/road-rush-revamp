import { SaveData } from '@/game/config';

interface Props {
  save: SaveData;
  sound: boolean;
  music: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onReset: () => void;
  onBack: () => void;
}

export const Settings = ({ sound, music, onToggleSound, onToggleMusic, onReset, onBack }: Props) => {
  return (
    <div
      className="absolute inset-0 bg-black/95 p-4 overflow-y-auto"
      style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace' }}
    >
      <div className="max-w-md mx-auto text-white">
        <h2 className="text-amber-300 text-base mb-4">⚙ SETTINGS</h2>

        <div className="grid gap-3">
          <button
            onClick={onToggleSound}
            className="flex justify-between items-center p-3 border-4 border-black bg-neutral-900 text-[10px]"
          >
            <span>SOUND FX</span>
            <span className={sound ? 'text-emerald-400' : 'text-red-400'}>{sound ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={onToggleMusic}
            className="flex justify-between items-center p-3 border-4 border-black bg-neutral-900 text-[10px]"
          >
            <span>MUSIC</span>
            <span className={music ? 'text-emerald-400' : 'text-red-400'}>{music ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset ALL progress? This cannot be undone.')) onReset();
            }}
            className="p-3 border-4 border-black bg-red-600 text-white text-[10px] font-black active:translate-y-[2px]"
          >
            🗑 RESET PROGRESS
          </button>
        </div>

        <div className="mt-6 p-3 border-4 border-black bg-neutral-900 text-[8px] text-white/60">
          <p className="text-amber-300 mb-1 text-[10px]">CREDITS</p>
          <p>Turbo Dash · Pixel Edition</p>
          <p>Built with React + Canvas</p>
          <p className="mt-2 text-white/40">All car names are inspired/parody and not affiliated with any real brand.</p>
        </div>

        <button onClick={onBack} className="mt-4 text-[10px] text-white/70 underline">
          ← BACK
        </button>
      </div>
    </div>
  );
};
