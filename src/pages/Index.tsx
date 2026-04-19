import { useState, useEffect, useCallback } from 'react';
import carPlayerBlue from '@/assets/car-player.png';
import carRed from '@/assets/car-red.png';
import carGold from '@/assets/car-gold.png';
import carObstacle from '@/assets/car-obstacle.png';
import coinImg from '@/assets/coin.png';

const CARS_CONFIG = [
  { id: 'classic', name: 'Classic Blue', price: 0, img: carPlayerBlue, speed: 5 },
  { id: 'sport', name: 'Sport Red', price: 500, img: carRed, speed: 7 },
  { id: 'vip', name: 'Tesla VIP', price: 2000, img: carGold, speed: 9 },
];

type Car = typeof CARS_CONFIG[number];
type Entity = { id: number; x: number; y: number };

const Index = () => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'SHOP'>('START');
  const [playerPos, setPlayerPos] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [obstacles, setObstacles] = useState<Entity[]>([]);
  const [collectibles, setCollectibles] = useState<Entity[]>([]);
  const [activeCar, setActiveCar] = useState<Car>(CARS_CONFIG[0]);
  const [ownedCars, setOwnedCars] = useState<string[]>(['classic']);

  const gameSpeed = activeCar.speed;

  const movePlayer = useCallback((dir: 'left' | 'right') => {
    if (dir === 'left') setPlayerPos((prev) => Math.max(0, prev - 1));
    if (dir === 'right') setPlayerPos((prev) => Math.min(2, prev + 1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') movePlayer('left');
      if (e.key === 'ArrowRight') movePlayer('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setObstacles((prev) => prev.map((o) => ({ ...o, y: o.y + gameSpeed })).filter((o) => o.y < 600));
      setCollectibles((prev) => prev.map((c) => ({ ...c, y: c.y + gameSpeed })).filter((c) => c.y < 600));
      if (Math.random() < 0.05) setObstacles((prev) => [...prev, { id: Date.now(), x: Math.floor(Math.random() * 3), y: -100 }]);
      if (Math.random() < 0.08) setCollectibles((prev) => [...prev, { id: Date.now() + 1, x: Math.floor(Math.random() * 3), y: -50 }]);
      setScore((prev) => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [gameState, gameSpeed]);

  useEffect(() => {
    obstacles.forEach((o) => {
      if (o.x === playerPos && o.y > 380 && o.y < 470) setGameState('GAME_OVER');
    });
    setCollectibles((prev) => {
      const hit = prev.find((c) => c.x === playerPos && c.y > 380 && c.y < 470);
      if (hit) {
        setCoins((c) => c + 10);
        return prev.filter((c) => c.id !== hit.id);
      }
      return prev;
    });
  }, [obstacles, playerPos]);

  const buyCar = (car: Car) => {
    if (ownedCars.includes(car.id)) {
      setActiveCar(car);
    } else if (coins >= car.price) {
      setCoins(coins - car.price);
      setOwnedCars([...ownedCars, car.id]);
      setActiveCar(car);
    } else {
      alert('محتاج تجمع كوينز أكثر!');
    }
  };

  const startRace = () => {
    setGameState('PLAYING');
    setObstacles([]);
    setCollectibles([]);
    setScore(0);
    setPlayerPos(1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white font-mono p-4">
      <h1 className="sr-only">Turbo Dash Pro - Racing Game</h1>

      <div className="flex justify-between w-80 mb-4 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 shadow-xl">
        <span className="text-amber-300 font-extrabold text-xl">💰 {coins}</span>
        <span className="text-cyan-300 font-extrabold text-xl">Score: {score}</span>
      </div>

      <div className="relative w-80 h-[500px] bg-[#3e4a59] overflow-hidden rounded-3xl border-8 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 flex justify-evenly pointer-events-none">
          <div className="w-1 h-full bg-slate-300 opacity-30"></div>
          <div className="w-1 h-full bg-slate-300 opacity-30"></div>
        </div>

        {gameState === 'PLAYING' && (
          <>
            <img
              src={activeCar.img}
              alt="player car"
              width={80}
              height={120}
              className="absolute bottom-10 w-20 h-auto transition-all duration-100 drop-shadow-[0_15px_15px_rgba(0,0,0,0.7)] z-10"
              style={{ left: `${playerPos * 33.33 + 5}%` }}
            />
            {obstacles.map((o) => (
              <img
                key={o.id}
                src={carObstacle}
                alt="obstacle"
                width={80}
                height={120}
                loading="lazy"
                className="absolute w-20 h-auto rotate-180"
                style={{ left: `${o.x * 33.33 + 5}%`, top: `${o.y}px` }}
              />
            ))}
            {collectibles.map((c) => (
              <img
                key={c.id}
                src={coinImg}
                alt="coin"
                width={48}
                height={48}
                loading="lazy"
                className="absolute w-12 h-auto animate-pulse"
                style={{ left: `${c.x * 33.33 + 12}%`, top: `${c.y}px` }}
              />
            ))}
          </>
        )}

        {(gameState === 'START' || gameState === 'GAME_OVER') && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            {gameState === 'START' && (
              <h2 className="text-4xl font-extrabold mb-8 italic tracking-tighter text-amber-300 drop-shadow-xl">
                TURBO DASH PRO
              </h2>
            )}
            {gameState === 'GAME_OVER' && (
              <h2 className="text-4xl font-extrabold text-red-500 mb-4 drop-shadow-xl">CRASHED!</h2>
            )}
            <button
              onClick={startRace}
              className="bg-green-500 hover:bg-green-600 px-10 py-4 rounded-full font-black text-2xl mb-4 transition-transform active:scale-95 shadow-[0_10px_20px_rgba(34,197,94,0.3)]"
            >
              START RACE 🏁
            </button>
            <button
              onClick={() => setGameState('SHOP')}
              className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-full font-black text-lg transition-transform active:scale-95 shadow-xl"
            >
              GARAGE 🚗
            </button>
          </div>
        )}

        {gameState === 'SHOP' && (
          <div className="absolute inset-0 bg-neutral-950 p-4 overflow-y-auto">
            <h2 className="text-2xl font-black mb-4 text-amber-300">CAR GARAGE</h2>
            <div className="grid gap-3">
              {CARS_CONFIG.map((car) => (
                <div
                  key={car.id}
                  className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <img src={car.img} alt={car.name} width={48} height={72} loading="lazy" className="w-12 h-auto" />
                    <div>
                      <p className="font-bold text-sm">{car.name}</p>
                      <p className="text-xs text-neutral-400">Speed: {car.speed}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => buyCar(car)}
                    className={`px-3 py-2 rounded-lg font-bold text-xs ${
                      ownedCars.includes(car.id)
                        ? activeCar.id === car.id
                          ? 'bg-green-600'
                          : 'bg-neutral-700'
                        : 'bg-amber-400 text-black'
                    }`}
                  >
                    {ownedCars.includes(car.id)
                      ? activeCar.id === car.id
                        ? 'ACTIVE'
                        : 'SELECT'
                      : `${car.price} 💰`}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setGameState('START')} className="mt-6 text-neutral-400 underline text-sm">
              Back to Home
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-6">
        <button
          onTouchStart={() => movePlayer('left')}
          onClick={() => movePlayer('left')}
          aria-label="Move left"
          className="bg-neutral-800 p-5 rounded-full text-2xl active:scale-90 shadow-xl border border-neutral-700"
        >
          ◀️
        </button>
        <button
          onTouchStart={() => movePlayer('right')}
          onClick={() => movePlayer('right')}
          aria-label="Move right"
          className="bg-neutral-800 p-5 rounded-full text-2xl active:scale-90 shadow-xl border border-neutral-700"
        >
          ▶️
        </button>
      </div>
      <p className="mt-3 text-neutral-600 text-xs text-center font-bold">
        استخدم الأسهم في الكيبورد أو الأزرار تحت
      </p>
    </div>
  );
};

export default Index;
