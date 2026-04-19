import { useCallback, useEffect, useMemo, useState } from 'react';
import { PixelGame } from '@/game/PixelGame';
import { AdModal } from '@/components/AdModal';
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

type Screen = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'STAGE_CLEAR' | 'GARAGE' | 'STAGES' | 'WORLDS';
type AdMode = null | 'CONTINUE' | 'STAGE_BONUS' | 'COIN_DOUBLE';

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
  const [screen, setScreen] = useState<Screen>('MENU');
  const [theme, setTheme] = useState<LevelTheme>(THEMES[0]);
  const [stageIndex, setStageIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [adMode, setAdMode] = useState<AdMode>(null);
  const [usedContinue, setUsedContinue] = useState(false);
  const [adRotation, setAdRotation] = useState(0);

  const activeCar = CARS.find((c) => c.id === save.activeCarId) ?? CARS[0];
  const stage = useMemo(() => buildStage(theme.id, stageIndex), [theme.id, stageIndex]);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  const startStage = useCallback((t: LevelTheme, idx: number) => {
    setTheme(t);
    setStageIndex(idx);
    setScore(0);
    setRunCoins(0);
    setUsedContinue(false);
    setScreen('PLAYING');
  }, []);

  const handleCoin = useCallback(() => setRunCoins((c) => c + 10), []);
  const handleScoreTick = useCallback((d: number) => setScore((s) => s + d), []);

  // Resolve current stage stats and decide outcome at end of run
  const stageGoal = stage.scoreGoal;

  const handleCrash = useCallback(() => {
    // freeze the run, decide cleared vs game over
    if (score >= stageGoal) {
      setScreen('STAGE_CLEAR');
    } else {
      setScreen('GAME_OVER');
    }
  }, [score, stageGoal]);

  const finalizeRun = useCallback(
    (cleared: boolean, bonusCoins = 0) => {
      setSave((s) => {
        const totalCoins = s.coins + runCoins + bonusCoins;
        const newHigh = Math.max(s.highScore, score);
        const progress = { ...s.progress };
        if (cleared) {
          progress[theme.id] = Math.max(progress[theme.id] ?? 0, stageIndex);
        }
        return { ...s, coins: totalCoins, highScore: newHigh, progress };
      });
    },
    [runCoins, score, theme.id, stageIndex]
  );

  // CONTINUE after watching ad (only once per run)
  const continueAfterAd = useCallback(() => {
    setAdMode(null);
    setScreen('PLAYING');
    setUsedContinue(true);
  }, []);

  // close ad without reward (skip): just finalize game over
  const skipAdOnDeath = useCallback(() => {
    setAdMode(null);
    finalizeRun(false);
    setScreen('GAME_OVER');
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

  // Show stage clear -> auto open ad for bonus
  useEffect(() => {
    if (screen === 'STAGE_CLEAR' && adMode === null) {
      // small delay so user reads result then ad pops
      const id = setTimeout(() => setAdMode('STAGE_BONUS'), 700);
      return () => clearTimeout(id);
    }
  }, [screen, adMode]);

  // Show game over -> ad continue offer
  useEffect(() => {
    if (screen === 'GAME_OVER' && adMode === null && !usedContinue) {
      // when crash happens we open continue ad
      // (we don't auto-open; we render a button that opens ad)
    }
  }, [screen, adMode, usedContinue]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black text-white select-none"
      style={{ fontFamily: '"Press Start 2P", ui-monospace, monospace' }}
    >
      <h1 className="sr-only">Turbo Dash Pixel - Pixel Art Top-Down Racer</h1>

      {/* Game viewport (always centered, pixel-perfect) */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: theme.sky }}
      >
        <div
          className="relative h-full"
          style={{ aspectRatio: '240 / 360', maxWidth: '100%' }}
        >
          <PixelGame
            car={activeCar}
            theme={theme}
            stage={stage}
            isPlaying={screen === 'PLAYING'}
            onCoin={handleCoin}
            onCrash={handleCrash}
            onScoreTick={handleScoreTick}
          />

          {/* HUD on top of canvas */}
          {screen === 'PLAYING' && (
            <div className="absolute top-2 left-2 right-2 flex justify-between text-[10px] pointer-events-none">
              <div className="bg-black/70 border-2 border-amber-300 px-2 py-1">
                <div className="text-amber-300">💰 {runCoins}</div>
                <div className="text-white/60 text-[8px]">{formatNum(save.coins)}</div>
              </div>
              <div className="bg-black/70 border-2 border-cyan-300 px-2 py-1 text-right">
                <div className="text-cyan-300">{formatNum(score)}</div>
                <div className="text-white/60 text-[8px]">/ {formatNum(stageGoal)}</div>
              </div>
              <div className="bg-black/70 border-2 border-fuchsia-400 px-2 py-1">
                <div className="text-fuchsia-300">{theme.name}</div>
                <div className="text-white/60 text-[8px]">STG {stageIndex}</div>
              </div>
            </div>
          )}

          {/* progress bar */}
          {screen === 'PLAYING' && (
            <div className="absolute top-14 left-2 right-2 h-2 bg-black/60 border border-white/30 pointer-events-none">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-amber-300"
                style={{ width: `${Math.min(100, (score / stageGoal) * 100)}%` }}
              />
            </div>
          )}

          {/* Touch controls */}
          {screen === 'PLAYING' && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3 pointer-events-none">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
                }}
                className="pointer-events-auto bg-amber-400 text-black w-12 h-12 border-4 border-black active:translate-y-[2px] text-lg font-black"
                aria-label="Move left"
              >
                ◀
              </button>
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
                }}
                className="pointer-events-auto bg-amber-400 text-black w-12 h-12 border-4 border-black active:translate-y-[2px] text-lg font-black"
                aria-label="Move right"
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN MENU */}
      {screen === 'MENU' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl text-amber-300 mb-2 leading-tight" style={{ textShadow: '4px 4px 0 #000' }}>
              TURBO
              <br />
              DASH
            </h2>
            <p className="text-[10px] text-fuchsia-300 tracking-widest">PIXEL EDITION</p>
          </div>

          <div className="flex flex-col gap-2 w-60">
            <button
              onClick={() => startStage(theme, Math.min(STAGES_PER_THEME, Math.max(1, save.progress[theme.id] || 1)))}
              className="bg-emerald-500 text-black border-4 border-black px-4 py-3 text-xs font-black active:translate-y-[2px] hover:brightness-110"
            >
              ▶ START
            </button>
            <button
              onClick={() => setScreen('WORLDS')}
              className="bg-cyan-400 text-black border-4 border-black px-4 py-2 text-[10px] font-black active:translate-y-[2px]"
            >
              🌍 WORLDS
            </button>
            <button
              onClick={() => setScreen('GARAGE')}
              className="bg-fuchsia-500 text-white border-4 border-black px-4 py-2 text-[10px] font-black active:translate-y-[2px]"
            >
              🚗 GARAGE
            </button>
          </div>

          <div className="mt-6 flex gap-4 text-[10px]">
            <span className="text-amber-300">💰 {formatNum(save.coins)}</span>
            <span className="text-cyan-300">★ {formatNum(save.highScore)}</span>
          </div>

          <p className="mt-6 text-[8px] text-white/40 text-center max-w-xs">
            Arrow Keys or A/D · Tap left/right · Swipe to change lane
          </p>
        </div>
      )}

      {/* WORLDS */}
      {screen === 'WORLDS' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
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
                          {unlocked ? `${cleared} / ${STAGES_PER_THEME} stages` : 'LOCKED — finish previous world'}
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

      {/* STAGES list (10x10 grid) */}
      {screen === 'STAGES' && (
        <div className="absolute inset-0 bg-black/95 p-4 overflow-y-auto">
          <div className="max-w-md mx-auto">
            <h2 className="text-amber-300 text-base mb-1">{theme.name}</h2>
            <p className="text-[9px] text-white/60 mb-3">
              Stages {save.progress[theme.id] ?? 0} / {STAGES_PER_THEME} cleared
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
            <h2 className="text-amber-300 text-base mb-1">🚗 GARAGE</h2>
            <p className="text-[10px] text-amber-200 mb-3">💰 {formatNum(save.coins)}</p>
            <div className="grid gap-2">
              {CARS.map((car) => {
                const owned = save.ownedCars.includes(car.id);
                const active = save.activeCarId === car.id;
                const canBuy = owned || save.coins >= car.price;
                return (
                  <div
                    key={car.id}
                    className="p-3 border-4 border-black bg-neutral-900 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-12 border-2 border-black"
                        style={{ background: `linear-gradient(180deg, ${car.body} 0 60%, ${car.accent} 60% 100%)` }}
                      />
                      <div>
                        <p className="text-[10px] font-black" style={{ color: car.body }}>
                          {car.name}
                        </p>
                        <p className="text-[8px] text-white/50">{car.inspiredBy}</p>
                        <p className="text-[8px] text-cyan-300">SPD {car.speed} · HND {Math.round(car.handling * 10)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => buyCar(car.id)}
                      disabled={!canBuy}
                      className={`px-2 py-2 border-2 border-black text-[9px] font-black disabled:opacity-30 ${
                        active ? 'bg-emerald-400 text-black' : owned ? 'bg-cyan-300 text-black' : 'bg-amber-400 text-black'
                      }`}
                    >
                      {active ? 'ACTIVE' : owned ? 'SELECT' : `${formatNum(car.price)} 💰`}
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
            <p className="text-[8px] text-white/50 mt-1">GOAL {formatNum(stageGoal)}</p>
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
            {theme.name} · STAGE {stageIndex}
          </p>
          <div className="border-4 border-black bg-neutral-900 p-4 mb-4 text-center w-60">
            <p className="text-[8px] text-white/50">SCORE</p>
            <p className="text-2xl text-cyan-300">{formatNum(score)}</p>
            <p className="text-[8px] text-white/50 mt-2">COINS EARNED</p>
            <p className="text-lg text-amber-300">+{runCoins}</p>
            <p className="text-[8px] text-fuchsia-300 mt-2 animate-pulse">+ AD BONUS LOADING…</p>
          </div>
          <p className="text-[9px] text-white/40">Watch ad for bonus 💰</p>
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
            : 'DOUBLE COINS!'
        }
        subtitle={
          adMode === 'CONTINUE'
            ? 'Watch this short ad to revive your run from where you crashed.'
            : 'Sponsored bonus reward for clearing this stage.'
        }
        ctaLabel={adMode === 'CONTINUE' ? 'CONTINUE' : 'CLAIM'}
        reward={
          adMode === 'STAGE_BONUS'
            ? { coins: 100 + stageIndex * 5, label: '(stage bonus)' }
            : adMode === 'CONTINUE'
            ? undefined
            : undefined
        }
        durationSec={adMode === 'CONTINUE' ? 5 : 4}
        onSkip={adMode === 'CONTINUE' ? skipAdOnDeath : undefined}
        onComplete={() => {
          if (adMode === 'CONTINUE') {
            continueAfterAd();
          } else if (adMode === 'STAGE_BONUS') {
            const bonus = 100 + stageIndex * 5;
            finalizeRun(true, bonus);
            setAdMode(null);
            // advance to next stage if available
            const next = Math.min(STAGES_PER_THEME, stageIndex + 1);
            // small delay to show updated coins
            setTimeout(() => {
              if (next === stageIndex) {
                setScreen('MENU');
              } else {
                setStageIndex(next);
                setScreen('MENU');
              }
            }, 50);
          } else {
            setAdMode(null);
          }
        }}
      />
    </div>
  );
};

export default Index;
