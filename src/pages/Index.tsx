import { useCallback, useEffect, useMemo, useState } from 'react';
import { Game3D } from '@/game/Game3D';
import { AdModal } from '@/components/AdModal';
import { CarPreview } from '@/components/CarPreview';
import { PauseMenu } from '@/components/PauseMenu';
import { Splash } from './Splash';
import { Settings } from './Settings';
import { Shop } from './Shop';
import {
  CARS,
  THEMES,
  STAGES_PER_THEME,
  STORAGE_KEY,
  DEFAULT_SAVE,
  SaveData,
  LevelTheme,
  buildStage,
  themeUnlocked,
  stageUnlocked,
} from '@/game/config';

type Screen =
  | 'SPLASH'
  | 'MENU'
  | 'PLAYING'
  | 'GAME_OVER'
  | 'STAGE_CLEAR'
  | 'GARAGE'
  | 'STAGES'
  | 'WORLDS'
  | 'SETTINGS'
  | 'SHOP';
type AdMode = null | 'CONTINUE' | 'STAGE_BONUS' | 'SHOP_PACK';

const MAX_LIVES = 3;

const loadSave = (): SaveData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE,
      ...parsed,
      progress: { ...DEFAULT_SAVE.progress, ...(parsed.progress ?? {}) },
    };
  } catch {
    return DEFAULT_SAVE;
  }
};

const formatNum = (n: number) => n.toLocaleString('en-US');

const Index = () => {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>('SPLASH');
  const [theme, setTheme] = useState<LevelTheme>(THEMES[0]);
  const [stageIndex, setStageIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [progress, setProgress] = useState(0);
  const [adMode, setAdMode] = useState<AdMode>(null);
  const [adReward, setAdReward] = useState(0);
  const [usedContinue, setUsedContinue] = useState(false);
  const [adRotation, setAdRotation] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);

  const activeCar = CARS.find((c) => c.id === save.activeCarId) ?? CARS[0];
  const stage = useMemo(() => buildStage(theme.id, stageIndex), [theme.id, stageIndex]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  const startStage = useCallback((t: LevelTheme, idx: number) => {
    setTheme(t);
    setStageIndex(idx);
    setScore(0);
    setRunCoins(0);
    setLives(MAX_LIVES);
    setProgress(0);
    setUsedContinue(false);
    setPaused(false);
    setScreen('PLAYING');
  }, []);

  const handleCoin = useCallback(() => setRunCoins((c) => c + 10), []);
  const handleScoreTick = useCallback((d: number) => setScore((s) => s + d), []);
  const handleProgress = useCallback((p: number) => setProgress(p), []);

  const handleCrash = useCallback(() => {
    setLives((l) => {
      const next = l - 1;
      if (next <= 0) setScreen('GAME_OVER');
      return Math.max(0, next);
    });
  }, []);

  const handleFinish = useCallback(() => setScreen('STAGE_CLEAR'), []);

  // Save coins/highscore/progress. cleared=true => unlock next stage.
  // Coins are ALWAYS saved (even when exiting mid-run).
  const finalizeRun = useCallback(
    (cleared: boolean, bonusCoins = 0) => {
      setSave((s) => {
        const totalCoins = s.coins + runCoins + bonusCoins;
        const newHigh = Math.max(s.highScore, score);
        const progressMap = { ...s.progress };
        if (cleared) {
          progressMap[theme.id] = Math.max(progressMap[theme.id] ?? 0, stageIndex);
          if (stageIndex >= STAGES_PER_THEME) {
            const tIdx = THEMES.findIndex((t) => t.id === theme.id);
            const nextTheme = THEMES[tIdx + 1];
            if (nextTheme && (progressMap[nextTheme.id] ?? 0) < 1) {
              progressMap[nextTheme.id] = Math.max(progressMap[nextTheme.id] ?? 0, 1);
            }
          }
        }
        return { ...s, coins: totalCoins, highScore: newHigh, progress: progressMap };
      });
      // reset run-coins so they aren't double-counted on next finalize
      setRunCoins(0);
    },
    [runCoins, score, theme.id, stageIndex]
  );

  const continueAfterAd = useCallback(() => {
    setAdMode(null);
    setLives(1);
    setUsedContinue(true);
    setScreen('PLAYING');
  }, []);

  const skipAdOnDeath = useCallback(() => {
    setAdMode(null);
    finalizeRun(false);
  }, [finalizeRun]);

  const buyCar = (carId: string) => {
    const car = CARS.find((c) => c.id === carId);
    if (!car) return;
    if (save.ownedCars.includes(carId)) {
      setSave((s) => ({ ...s, activeCarId: carId }));
      return;
    }
    if (save.coins >= car.price) {
      setSave((s) => ({
        ...s,
        coins: s.coins - car.price,
        ownedCars: [...s.ownedCars, carId],
        activeCarId: carId,
      }));
    }
  };

  // STAGE_CLEAR -> auto-show bonus ad
  useEffect(() => {
    if (screen === 'STAGE_CLEAR' && adMode === null) {
      const id = setTimeout(() => {
        setAdReward(100 + stageIndex * 5);
        setAdMode('STAGE_BONUS');
      }, 700);
      return () => clearTimeout(id);
    }
  }, [screen, adMode, stageIndex]);

  const goNextStage = () => {
    const next = Math.min(STAGES_PER_THEME, stageIndex + 1);
    if (next === stageIndex) {
      setScreen('MENU');
    } else {
      startStage(theme, next);
    }
  };

  const handleShopAd = (coins: number) => {
    setAdReward(coins);
    setAdMode('SHOP_PACK');
  };

  // Pause logic: pauses the 3D loop and saves coins-on-exit
  const handleExitConfirmed = () => {
    finalizeRun(false);
    setPaused(false);
    setScreen('MENU');
  };

  if (screen === 'SPLASH') {
    return <Splash onDone={() => setScreen('MENU')} />;
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black text-white select-none"
      style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace' }}
    >
      <h1 className="sr-only">Turbo Dash 3D — Endless Racer</h1>

      {/* 3D viewport (full screen) */}
      <div className="absolute inset-0">
        <Game3D
          car={activeCar}
          themeId={theme.id}
          stage={stage}
          isPlaying={screen === 'PLAYING'}
          isPaused={paused}
          onCoin={handleCoin}
          onCrash={handleCrash}
          onScoreTick={handleScoreTick}
          onProgress={handleProgress}
          onFinish={handleFinish}
        />

        {/* HUD */}
        {screen === 'PLAYING' && (
          <>
            {/* top row */}
            <div className="absolute top-3 left-3 right-3 flex justify-between items-start text-[10px] gap-2 pointer-events-none">
              <div className="bg-black/70 border-2 border-cyan-300 px-3 py-2 rounded">
                <div className="text-cyan-300 text-[14px] font-black">{formatNum(score)}</div>
                <div className="text-fuchsia-300 text-[8px] mt-1">
                  {theme.name} · STAGE {stageIndex}
                </div>
              </div>
              <div className="bg-black/70 border-2 border-amber-300 px-3 py-2 rounded text-right">
                <div className="text-amber-300 text-[14px] font-black">💰 {formatNum(save.coins + runCoins)}</div>
                <div className="text-amber-200/80 text-[8px] mt-1">+{runCoins} RUN</div>
              </div>
            </div>

            {/* lives + progress under HUD */}
            <div className="absolute top-[72px] left-3 right-3 flex items-center gap-3 pointer-events-none">
              <div className="text-[16px]">
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <span key={i} className={i < lives ? '' : 'opacity-20 grayscale'}>❤</span>
                ))}
              </div>
              <div className="flex-1 h-3 bg-black/60 border-2 border-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full transition-[width] duration-100"
                  style={{
                    width: `${Math.min(100, progress * 100)}%`,
                    background: 'linear-gradient(90deg, #22d3ee, #fde047, #ec4899)',
                  }}
                />
              </div>
              <span className="text-[9px] text-white/70 w-9 text-right">{Math.floor(progress * 100)}%</span>
            </div>

            {/* PAUSE button */}
            <button
              onClick={() => setPaused(true)}
              className="absolute bottom-4 right-4 z-20 bg-black/70 border-2 border-white/40 text-white text-[12px] w-12 h-12 rounded-full font-black active:translate-y-[2px]"
              aria-label="Pause"
            >
              ⏸
            </button>

            {/* hint */}
            <div className="absolute bottom-4 left-4 right-20 text-[9px] text-white/60 pointer-events-none">
              ✋ DRAG TO STEER
            </div>

            {/* PAUSE MENU */}
            <PauseMenu
              open={paused}
              onResume={() => setPaused(false)}
              onExit={handleExitConfirmed}
            />
          </>
        )}
      </div>

      {/* MAIN MENU */}
      {screen === 'MENU' && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, hsl(263 75% 25%) 0%, hsl(240 60% 8%) 60%, #000 100%)',
          }}
        >
          {/* animated grid floor */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2 opacity-30 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent 0 19px, rgba(236,72,153,0.6) 19px 20px), repeating-linear-gradient(90deg, transparent 0 19px, rgba(34,211,238,0.5) 19px 20px)',
              transform: 'perspective(400px) rotateX(60deg)',
              transformOrigin: 'bottom',
            }}
          />
          <div
            aria-hidden
            className="absolute top-[15%] w-72 h-72 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)', opacity: 0.5 }}
          />

          <div className="relative text-center mb-8">
            <h2
              className="text-5xl leading-tight tracking-tight"
              style={{
                background: 'linear-gradient(180deg, #fde047 0%, #f97316 70%, #dc2626 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(4px 4px 0 #000)',
              }}
            >
              TURBO
              <br />
              DASH
            </h2>
            <p className="mt-2 text-[10px] text-cyan-300 tracking-[0.4em]">3D · EDITION</p>
          </div>

          <div className="relative flex flex-col gap-2 w-64">
            <button
              onClick={() =>
                startStage(theme, Math.min(STAGES_PER_THEME, Math.max(1, save.progress[theme.id] || 1)))
              }
              className="bg-gradient-to-b from-emerald-400 to-emerald-600 text-black border-4 border-black px-4 py-4 text-sm font-black active:translate-y-[2px] hover:brightness-110 shadow-[0_6px_0_#000]"
            >
              ▶ START
            </button>
            <button
              onClick={() => setScreen('WORLDS')}
              className="bg-gradient-to-b from-cyan-300 to-cyan-500 text-black border-4 border-black px-4 py-3 text-[11px] font-black active:translate-y-[2px] shadow-[0_4px_0_#000]"
            >
              🌍 WORLDS
            </button>
            <button
              onClick={() => setScreen('GARAGE')}
              className="bg-gradient-to-b from-fuchsia-400 to-fuchsia-600 text-white border-4 border-black px-4 py-3 text-[11px] font-black active:translate-y-[2px] shadow-[0_4px_0_#000]"
            >
              🚗 GARAGE
            </button>
            <button
              onClick={() => setScreen('SHOP')}
              className="bg-gradient-to-b from-amber-300 to-amber-500 text-black border-4 border-black px-4 py-3 text-[11px] font-black active:translate-y-[2px] shadow-[0_4px_0_#000]"
            >
              🛒 SHOP
            </button>
            <button
              onClick={() => setScreen('SETTINGS')}
              className="bg-gradient-to-b from-neutral-600 to-neutral-800 text-white border-4 border-black px-4 py-3 text-[11px] font-black active:translate-y-[2px] shadow-[0_4px_0_#000]"
            >
              ⚙ SETTINGS
            </button>
          </div>

          {/* Manual test claim button */}
          <button
            onClick={() => {
              const bonus = 500;
              setSave((s) => {
                const updated = { ...s, coins: s.coins + bonus };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                return updated;
              });
            }}
            className="relative mt-4 w-64 bg-gradient-to-b from-lime-400 to-lime-600 text-black border-4 border-black px-4 py-3 text-[11px] font-black active:translate-y-[2px] shadow-[0_4px_0_#000] animate-pulse"
          >
            🎁 CLAIM 500 COINS (TEST)
          </button>

          <div className="relative mt-4 flex gap-4 text-[11px]">
            <span className="text-amber-300">💰 {formatNum(save.coins)}</span>
            <span className="text-cyan-300">★ {formatNum(save.highScore)}</span>
          </div>
        </div>
      )}

      {/* WORLDS */}
      {screen === 'WORLDS' && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <h2 className="text-amber-300 text-lg mb-4">🌍 WORLDS</h2>
            <div className="grid gap-3">
              {THEMES.map((t) => {
                const unlocked = themeUnlocked(save, t.id);
                const cleared = save.progress[t.id] ?? 0;
                return (
                  <button
                    key={t.id}
                    disabled={!unlocked}
                    onClick={() => {
                      setTheme(t);
                      setScreen('STAGES');
                    }}
                    className="text-left p-3 border-4 border-black disabled:opacity-40 hover:translate-y-[-2px] transition"
                    style={{ background: t.ground }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black" style={{ color: t.roadStripe }}>
                          {t.name}
                        </p>
                        <p className="text-[8px] text-black/70 mt-1">
                          {unlocked ? `${cleared} / ${STAGES_PER_THEME} stages` : 'LOCKED'}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-3 h-3 border border-black" style={{ background: t.road }} />
                        <span className="w-3 h-3 border border-black" style={{ background: t.decor }} />
                        <span className="w-3 h-3 border border-black" style={{ background: t.obstacleColor }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setScreen('MENU')} className="mt-4 text-[10px] text-white/70 underline">
              ← BACK
            </button>
          </div>
        </div>
      )}

      {/* STAGES */}
      {screen === 'STAGES' && (
        <div className="absolute inset-0 bg-black/95 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <h2 className="text-amber-300 text-base mb-1">{theme.name}</h2>
            <p className="text-[9px] text-white/60 mb-3">
              Stages {save.progress[theme.id] ?? 0} / {STAGES_PER_THEME} cleared · tap any unlocked stage
            </p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: STAGES_PER_THEME }, (_, i) => i + 1).map((n) => {
                const ok = stageUnlocked(save, theme.id, n);
                const done = (save.progress[theme.id] ?? 0) >= n;
                return (
                  <button
                    key={n}
                    disabled={!ok}
                    onClick={() => startStage(theme, n)}
                    className={`aspect-square text-[10px] border-2 border-black font-black ${
                      done
                        ? 'bg-emerald-400 text-black'
                        : ok
                        ? 'bg-amber-300 text-black'
                        : 'bg-neutral-800 text-white/30'
                    }`}
                  >
                    {ok ? n : '🔒'}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setScreen('WORLDS')} className="mt-4 text-[10px] text-white/70 underline">
              ← WORLDS
            </button>
          </div>
        </div>
      )}

      {/* GARAGE */}
      {screen === 'GARAGE' && (
        <div className="absolute inset-0 bg-black/95 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-amber-300 text-base">🚗 GARAGE</h2>
              <span className="text-[10px] text-amber-200">💰 {formatNum(save.coins)}</span>
            </div>
            <p className="text-[8px] text-white/50 mb-3">
              {CARS.length} cars · preview matches the car you'll drive in 3D
            </p>
            <div className="grid gap-2">
              {CARS.map((car) => {
                const owned = save.ownedCars.includes(car.id);
                const active = save.activeCarId === car.id;
                const canBuy = owned || save.coins >= car.price;
                return (
                  <div
                    key={car.id}
                    className="p-3 border-4 border-black bg-neutral-900 flex justify-between items-center gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="bg-neutral-800 border-2 border-black p-1 flex items-center justify-center shrink-0">
                        <CarPreview car={car} size={56} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black truncate" style={{ color: car.body }}>
                          {car.name}
                        </p>
                        <p className="text-[8px] text-white/50 truncate">{car.inspiredBy}</p>
                        <p className="text-[8px] text-cyan-300">
                          SPD {car.speed} · HND {Math.round(car.handling * 10)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => buyCar(car.id)}
                      disabled={!canBuy}
                      className={`px-2 py-2 border-2 border-black text-[9px] font-black disabled:opacity-30 shrink-0 ${
                        active
                          ? 'bg-emerald-400 text-black'
                          : owned
                          ? 'bg-cyan-300 text-black'
                          : 'bg-amber-400 text-black'
                      }`}
                    >
                      {active ? 'ACTIVE' : owned ? 'SELECT' : `${formatNum(car.price)}💰`}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setScreen('MENU')} className="mt-4 text-[10px] text-white/70 underline">
              ← BACK
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {screen === 'SETTINGS' && (
        <Settings
          save={save}
          sound={sound}
          music={music}
          onToggleSound={() => setSound((s) => !s)}
          onToggleMusic={() => setMusic((m) => !m)}
          onReset={() => {
            localStorage.removeItem(STORAGE_KEY);
            setSave(DEFAULT_SAVE);
          }}
          onBack={() => setScreen('MENU')}
        />
      )}

      {/* SHOP */}
      {screen === 'SHOP' && (
        <Shop save={save} onWatchAd={handleShopAd} onBack={() => setScreen('MENU')} />
      )}

      {/* GAME OVER */}
      {screen === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <h2 className="text-3xl text-red-500 mb-2" style={{ textShadow: '4px 4px 0 #000' }}>
            CRASHED!
          </h2>
          <p className="text-[10px] text-white/60 mb-4">
            {theme.name} · STAGE {stageIndex}
          </p>
          <div className="border-4 border-black bg-neutral-900 p-4 mb-4 text-center w-60">
            <p className="text-[8px] text-white/50">SCORE</p>
            <p className="text-2xl text-cyan-300">{formatNum(score)}</p>
            <p className="text-[8px] text-white/50 mt-2">COINS</p>
            <p className="text-lg text-amber-300">+{runCoins}</p>
          </div>
          <div className="flex flex-col gap-2 w-60">
            {!usedContinue && (
              <button
                onClick={() => {
                  setAdRotation((n) => n + 1);
                  setAdMode('CONTINUE');
                }}
                className="bg-fuchsia-500 text-white border-4 border-black px-3 py-3 text-[10px] font-black active:translate-y-[2px]"
              >
                ▶ WATCH AD · CONTINUE
              </button>
            )}
            <button
              onClick={() => {
                finalizeRun(false);
                startStage(theme, stageIndex);
              }}
              className="bg-emerald-500 text-black border-4 border-black px-3 py-2 text-[10px] font-black active:translate-y-[2px]"
            >
              🔄 RETRY
            </button>
            <button
              onClick={() => {
                finalizeRun(false);
                setScreen('MENU');
              }}
              className="bg-neutral-700 text-white border-4 border-black px-3 py-2 text-[10px] font-black active:translate-y-[2px]"
            >
              MENU
            </button>
          </div>
        </div>
      )}

      {/* STAGE CLEAR */}
      {screen === 'STAGE_CLEAR' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <h2 className="text-2xl text-emerald-400 mb-2" style={{ textShadow: '4px 4px 0 #000' }}>
            STAGE CLEAR!
          </h2>
          <p className="text-[10px] text-white/60 mb-4">
            {theme.name} · STAGE {stageIndex} → {Math.min(STAGES_PER_THEME, stageIndex + 1)}
          </p>
          <div className="border-4 border-black bg-neutral-900 p-4 mb-4 text-center w-60">
            <p className="text-[8px] text-white/50">SCORE</p>
            <p className="text-2xl text-cyan-300">{formatNum(score)}</p>
            <p className="text-[8px] text-white/50 mt-2">COINS EARNED</p>
            <p className="text-lg text-amber-300">+{runCoins}</p>
            <p className="text-[8px] text-fuchsia-300 mt-2 animate-pulse">+ AD BONUS LOADING…</p>
          </div>
          <p className="text-[9px] text-white/40">Auto-advancing to next stage…</p>
        </div>
      )}

      {/* AD MODAL */}
      <AdModal
        key={adRotation}
        open={adMode !== null}
        title={
          adMode === 'CONTINUE'
            ? "DON'T QUIT NOW!"
            : adMode === 'STAGE_BONUS'
            ? 'STAGE BONUS!'
            : 'COIN PACK!'
        }
        subtitle={
          adMode === 'CONTINUE'
            ? 'Watch this short ad to revive and continue your run.'
            : adMode === 'STAGE_BONUS'
            ? 'Sponsored bonus reward for clearing this stage.'
            : 'Watch this short ad to claim your free coin pack.'
        }
        ctaLabel={adMode === 'CONTINUE' ? 'CONTINUE' : 'CLAIM'}
        reward={
          adMode === 'STAGE_BONUS' || adMode === 'SHOP_PACK'
            ? { coins: adReward }
            : undefined
        }
        durationSec={adMode === 'CONTINUE' ? 5 : 4}
        onSkip={adMode === 'CONTINUE' ? skipAdOnDeath : undefined}
        onComplete={() => {
          if (adMode === 'CONTINUE') {
            continueAfterAd();
          } else if (adMode === 'STAGE_BONUS') {
            finalizeRun(true, adReward);
            setAdMode(null);
            setTimeout(goNextStage, 80);
          } else if (adMode === 'SHOP_PACK') {
            setSave((s) => {
              const updated = { ...s, coins: s.coins + adReward };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
            setAdMode(null);
          }
        }}
      />
    </div>
  );
};

export default Index;
