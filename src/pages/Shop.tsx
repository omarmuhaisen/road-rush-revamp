import { SaveData } from '@/game/config';

interface Pack {
  id: string;
  coins: number;
  label: string;
  badge?: string;
  color: string;
}

const PACKS: Pack[] = [
  { id: 'small', coins: 500, label: 'SMALL STASH', color: '#22c55e' },
  { id: 'med', coins: 2000, label: 'COIN BAG', badge: 'POPULAR', color: '#06b6d4' },
  { id: 'big', coins: 7500, label: 'TREASURE CHEST', badge: '+25% BONUS', color: '#a855f7' },
  { id: 'mega', coins: 25000, label: 'MEGA VAULT', badge: 'BEST VALUE', color: '#f59e0b' },
];

interface Props {
  save: SaveData;
  onWatchAd: (coins: number) => void;
  onBack: () => void;
}

const formatNum = (n: number) => n.toLocaleString('en-US');

export const Shop = ({ save, onWatchAd, onBack }: Props) => {
  const handleWatch = (pack: Pack) => {
    // Trigger AppCreator24 rewarded ad via URL scheme
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'appcreator24://ad_rewarded';
      document.body.appendChild(iframe);
      setTimeout(() => iframe.remove(), 500);
    } catch (_) {}

    // Grant reward immediately
    onWatchAd(pack.coins);
  };

  return (
    <div
      className="absolute inset-0 bg-black/95 p-4 overflow-y-auto"
      style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace' }}
    >
      <div className="max-w-md mx-auto text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-amber-300 text-base">🛒 SHOP</h2>
          <span className="text-[10px] text-amber-200">💰 {formatNum(save.coins)}</span>
        </div>

        <p className="text-[8px] text-white/50 mb-3">
          Watch a short ad to claim free coin packs. No real purchases.
        </p>

        <div className="grid gap-3">
          {PACKS.map((p) => (
            <div
              key={p.id}
              className="p-3 border-4 border-black flex justify-between items-center"
              style={{ background: p.color }}
            >
              <div className="text-black">
                <p className="text-[10px] font-black">{p.label}</p>
                <p className="text-[14px] font-black mt-1">+{formatNum(p.coins)} 💰</p>
                {p.badge && <p className="text-[8px] mt-1 bg-black/30 inline-block px-1">{p.badge}</p>}
              </div>
              <button
                onClick={() => handleWatch(p)}
                disabled={!!pending}
                className="px-3 py-2 bg-black text-amber-300 border-2 border-white text-[9px] font-black active:translate-y-[2px] disabled:opacity-40"
              >
                {pending === p.id ? `⏳ ${countdown}s` : pending ? '⏳ WAIT' : '▶ WATCH AD'}
              </button>
            </div>
          ))}
        </div>

        <button onClick={onBack} disabled={!!pending} className="mt-4 text-[10px] text-white/70 underline disabled:opacity-40">
          ← BACK
        </button>
      </div>
    </div>
  );
};
