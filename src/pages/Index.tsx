import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas } from '@/game/GameCanvas';
import {
  CARS,
  LANES_X,
  LEVELS,
  STORAGE_KEY,
  DEFAULT_SAVE,
  SaveData,
  LevelTheme,
} from '@/game/config';

type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'GARAGE' | 'LEVELS';

const loadSave = (): SaveData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVE;
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SAVE;
  }
};

const Index = () => {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [playerLane, setPlayerLane] = useState(1);
  const [score, setScore] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [activeLevel, setActiveLevel] = useState<LevelTheme>(LEVELS[0]);

  const activeCar = CARS.find((c) => c.id === save.activeCarId) ?? CARS[0];

  // persist save
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  }, [save]);

  const movePlayer = useCallback((dir: 'left' | 'right') => {
    setPlayerLane((p) => {
      if (dir === 'left') return Math.max(0, p - 1);
      return Math.min(LANES_X.length - 1, p + 1);
    });
  }, []);

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer('left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [movePlayer]);

  // swipe
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy)) {
      movePlayer(dx > 0 ? 'right' : 'left');
    }
    touchStart.current = null;
  };

  const startRace = (level: LevelTheme) => {
    setActiveLevel(level);
    setScore(0);
    setRunCoins(0);
    setPlayerLane(1);
    setGameState('PLAYING');
  };

  const handleCoin = useCallback(() => setRunCoins((c) => c + 10), []);
  const handleScoreTick = useCallback(() => setScore((s) => s + 1), []);

  const handleCrash = useCallback(() => {
    setGameState('GAME_OVER');
    setSave((s) => {
      const newCoins = s.coins + runCoins;
      const newHigh = Math.max(s.highScore, score);
      const unlocked = LEVELS.filter((l) => newHigh >= l.unlockScore).map((l) => l.id);
      return {
        ...s,
        coins: newCoins,
        highScore: newHigh,
        unlockedLevels: Array.from(new Set([...s.unlockedLevels, ...unlocked])),
      };
    });
  }, [runCoins, score]);

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

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-neutral-950 text-white font-mono select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h1 className="sr-only">Turbo Dash Pro - 3D Racing Game</h1>

      {/* 3D Canvas always mounted while playing */}
      <div className="absolute inset-0">
        <GameCanvas
          car={activeCar}
          theme={activeLevel}
          isPlaying={gameState === 'PLAYING'}
          playerLane={playerLane}
          onCoin={handleCoin}
          onCrash={handleCrash}
          onScoreTick={handleScoreTick}
        />
      </div>

      {/* HUD while playing */}
      {gameState === 'PLAYING' && (
        <>
          <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
            <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-2xl border border-white/10">
              <p className="text-amber-300 font-extrabold text-lg leading-none">💰 {runCoins}</p>
              <p className="text-xs text-white/60">Total: {save.coins}</p>
            </div>
            <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-right">
              <p className="text-cyan-300 font-extrabold text-lg leading-none">{score}</p>
              <p className="text-xs text-white/60">{activeLevel.name}</p>
            </div>
          </div>

          {/* Touch controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8 pointer-events-none">
            <button
              onClick={() => movePlayer('left')}
              className="pointer-events-auto bg-white/10 backdrop-blur w-20 h-20 rounded-full text-3xl active:scale-90 border border-white/20 shadow-2xl"
              aria-label="Move left"
            >
              ◀
            </button>
            <button
              onClick={() => movePlayer('right')}
              className="pointer-events-auto bg-white/10 backdrop-blur w-20 h-20 rounded-full text-3xl active:scale-90 border border-white/20 shadow-2xl"
              aria-label="Move right"
            >
              ▶
            </button>
          </div>
        </>
      )}

      {/* MAIN MENU */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
          <h2 className="text-5xl font-black italic text-amber-300 drop-shadow-[0_4px_30px_rgba(251,191,36,0.5)] tracking-tight mb-2">
            TURBO DASH
          </h2>
          <p className="text-white/60 mb-8 tracking-[0.3em] text-xs">3D RACER</p>

          <div className="flex flex-col gap-3 w-64">
            <button
              onClick={() => startRace(activeLevel)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:brightness-110 px-8 py-4 rounded-2xl font-black text-xl active:scale-95 shadow-[0_10px_30px_rgba(34,197,94,0.4)] transition"
            >
              🏁 START RACE
            </button>
            <button
              onClick={() => setGameState('LEVELS')}
              className="bg-white/10 hover:bg-white/15 border border-white/20 px-8 py-3 rounded-2xl font-bold transition"
            >
              🗺️ LEVELS
            </button>
            <button
              onClick={() => setGameState('GARAGE')}
              className="bg-white/10 hover:bg-white/15 border border-white/20 px-8 py-3 rounded-2xl font-bold transition"
            >
              🚗 GARAGE
            </button>
          </div>

          <div className="mt-8 flex gap-6 text-sm">
            <span className="text-amber-300 font-bold">💰 {save.coins}</span>
            <span className="text-cyan-300 font-bold">★ {save.highScore}</span>
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">
            CRASHED!
          </h2>
          <p className="text-white/70 mb-6">{activeLevel.name}</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
            <p className="text-xs text-white/50 uppercase tracking-widest">Score</p>
            <p className="text-4xl font-black text-cyan-300 mb-2">{score}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest">Coins</p>
            <p className="text-2xl font-bold text-amber-300">+{runCoins}</p>
          </div>
          <div className="flex flex-col gap-3 w-64">
            <button
              onClick={() => startRace(activeLevel)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3 rounded-2xl font-black text-lg active:scale-95 shadow-xl"
            >
              🔄 RETRY
            </button>
            <button
              onClick={() => setGameState('MENU')}
              className="bg-white/10 border border-white/20 px-8 py-3 rounded-2xl font-bold"
            >
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      {/* LEVELS */}
      {gameState === 'LEVELS' && (
        <div className="absolute inset-0 bg-black/90 p-6 overflow-y-auto backdrop-blur-md">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-black text-amber-300 mb-1">SELECT LEVEL</h2>
            <p className="text-white/50 text-sm mb-6">High score unlocks new worlds</p>
            <div className="grid gap-3">
              {LEVELS.map((lvl) => {
                const unlocked = save.unlockedLevels.includes(lvl.id) || save.highScore >= lvl.unlockScore;
                return (
                  <button
                    key={lvl.id}
                    disabled={!unlocked}
                    onClick={() => {
                      setActiveLevel(lvl);
                      setGameState('MENU');
                    }}
                    className="text-left p-4 rounded-2xl border border-white/10 disabled:opacity-40 hover:border-white/30 transition"
                    style={{ background: `linear-gradient(135deg, ${lvl.fog}30, ${lvl.ground}30)` }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-black text-lg">{lvl.name}</p>
                        <p className="text-xs text-white/60">
                          {unlocked ? 'Unlocked' : `Need ★ ${lvl.unlockScore}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <span className="w-4 h-4 rounded-full" style={{ background: lvl.fog }} />
                        <span className="w-4 h-4 rounded-full" style={{ background: lvl.ground }} />
                        <span className="w-4 h-4 rounded-full" style={{ background: lvl.decorAccent }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setGameState('MENU')}
              className="mt-6 text-white/60 underline text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* GARAGE */}
      {gameState === 'GARAGE' && (
        <div className="absolute inset-0 bg-black/90 p-6 overflow-y-auto backdrop-blur-md">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-black text-amber-300 mb-1">GARAGE</h2>
            <p className="text-white/50 text-sm mb-6">💰 {save.coins} coins available</p>
            <div className="grid gap-3">
              {CARS.map((car) => {
                const owned = save.ownedCars.includes(car.id);
                const active = save.activeCarId === car.id;
                return (
                  <div
                    key={car.id}
                    className="p-4 rounded-2xl border border-white/10 bg-white/5 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-14 rounded-md border border-white/20"
                        style={{ background: `linear-gradient(180deg, ${car.body}, ${car.accent})` }}
                      />
                      <div>
                        <p className="font-black">{car.name}</p>
                        <p className="text-xs text-white/60">Speed {car.speed}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => buyCar(car.id)}
                      disabled={!owned && save.coins < car.price}
                      className={`px-4 py-2 rounded-xl font-black text-xs disabled:opacity-40 ${
                        active
                          ? 'bg-green-600'
                          : owned
                          ? 'bg-white/15 border border-white/20'
                          : 'bg-amber-400 text-black'
                      }`}
                    >
                      {active ? 'ACTIVE' : owned ? 'SELECT' : `${car.price} 💰`}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setGameState('MENU')}
              className="mt-6 text-white/60 underline text-sm"
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
