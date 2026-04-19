import React, { useState, useEffect, useCallback } from 'react';

const CARS = [
  { id: 'classic', name: 'Classic Blue', price: 0, color: '#3b82f6', speed: 5 },
  { id: 'sport', name: 'Sport Red', price: 500, color: '#ef4444', speed: 7 },
  { id: 'vip', name: 'Tesla VIP', price: 2000, color: '#f59e0b', speed: 9 },
];

type Car = typeof CARS[number];
type Entity = { id: number; x: number; y: number };

const Index = () => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAME_OVER' | 'SHOP'>('START');
  const [playerPos, setPlayerPos] = useState(1);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [obstacles, setObstacles] = useState<Entity[]>([]);
  const [collectibles, setCollectibles] = useState<Entity[]>([]);
  const [activeCar, setActiveCar] = useState<Car>(CARS[0]);
  const [ownedCars, setOwnedCars] = useState<string[]>(['classic']);
  const [gameSpeed] = useState(5);

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
      setObstacles((prev) =>
        prev.map((o) => ({ ...o, y: o.y + gameSpeed })).filter((o) => o.y < 600)
      );
      setCollectibles((prev) =>
        prev.map((c) => ({ ...c, y: c.y + gameSpeed })).filter((c) => c.y < 600)
      );
      if (Math.random() < 0.05) {
        setObstacles((prev) => [...prev, { id: Date.now(), x: Math.floor(Math.random() * 3), y: -50 }]);
      }
      if (Math.random() < 0.08) {
        setCollectibles((prev) => [...prev, { id: Date.now() + 1, x: Math.floor(Math.random() * 3), y: -50 }]);
      }
      setScore((prev) => prev + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [gameState, gameSpeed]);

  useEffect(() => {
    obstacles.forEach((o) => {
      if (o.x === playerPos && o.y > 450 && o.y < 530) {
        setGameState('GAME_OVER');
      }
    });
    setCollectibles((prev) => {
      const hit = prev.find((c) => c.x === playerPos && c.y > 450 && c.y < 530);
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
      alert('محتاج تشحن كوينز أو تجمع أكثر!');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white font-sans p-4">
      <h1 className="sr-only">Turbo Dash - Racing Game</h1>
      <div className="flex justify-between w-80 mb-4 bg-slate-800 p-3 rounded-xl border border-slate-700">
        <span className="text-yellow-400 font-bold">💰 {coins}</span>
        <span className="text-blue-400 font-bold">Score: {score}</span>
      </div>

      <div className="relative w-80 h-[500px] bg-slate-700 overflow-hidden rounded-2xl border-4 border-slate-600 shadow-2xl">
        <div className="absolute inset-0 flex justify-evenly">
          <div className="w-px h-full border-r border-dashed border-slate-500"></div>
          <div className="w-px h-full border-r border-dashed border-slate-500"></div>
        </div>

        {gameState === 'PLAYING' && (
          <>
            <div
              className="absolute bottom-10 w-16 h-24 rounded-lg transition-all duration-100 flex items-center justify-center shadow-lg"
              style={{ left: `${playerPos * 33.33 + 5}%`, backgroundColor: activeCar.color }}
            >
              <div className="w-10 h-4 bg-sky-200/50 rounded-sm mb-8"></div>
            </div>
            {obstacles.map((o) => (
              <div
                key={o.id}
                className="absolute w-16 h-16 bg-red-600 rounded-md shadow-md"
                style={{ left: `${o.x * 33.33 + 5}%`, top: `${o.y}px` }}
              />
            ))}
            {collectibles.map((c) => (
              <div
                key={c.id}
                className="absolute w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold animate-bounce shadow-lg text-black"
                style={{ left: `${c.x * 33.33 + 15}%`, top: `${c.y}px` }}
              >
                $
              </div>
            ))}
          </>
        )}

        {(gameState === 'START' || gameState === 'GAME_OVER') && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
            {gameState === 'START' && (
              <h2 className="text-4xl font-black mb-6 italic tracking-tighter">TURBO DASH</h2>
            )}
            {gameState === 'GAME_OVER' && (
              <h2 className="text-3xl font-bold text-red-500 mb-2">CRASHED!</h2>
            )}
            <button
              onClick={() => {
                setGameState('PLAYING');
                setObstacles([]);
                setCollectibles([]);
                setScore(0);
                setPlayerPos(1);
              }}
              className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-full font-black text-xl mb-4 transition-transform active:scale-95 shadow-xl"
            >
              START RACE
            </button>
            <button
              onClick={() => setGameState('SHOP')}
              className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-full font-black text-xl transition-transform active:scale-95 shadow-xl"
            >
              GARAGE / SHOP
            </button>
          </div>
        )}

        {gameState === 'SHOP' && (
          <div className="absolute inset-0 bg-slate-900 p-4 overflow-y-auto">
            <h2 className="text-2xl font-black mb-4">CAR GARAGE</h2>
            <div className="grid gap-4">
              {CARS.map((car) => (
                <div
                  key={car.id}
                  className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold">{car.name}</p>
                    <p className="text-xs text-slate-400">Speed: {car.speed}</p>
                  </div>
                  <button
                    onClick={() => buyCar(car)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm ${
                      ownedCars.includes(car.id) ? 'bg-slate-600' : 'bg-yellow-500 text-black'
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
              <div className="mt-4 p-4 bg-indigo-900/50 rounded-xl border border-indigo-500">
                <p className="text-sm font-bold">VIP PACK: 5.00$</p>
                <button className="w-full mt-2 bg-indigo-500 py-2 rounded-lg font-black text-xs">
                  BUY WITH REAL MONEY
                </button>
              </div>
            </div>
            <button
              onClick={() => setGameState('START')}
              className="mt-6 text-slate-400 underline"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onTouchStart={() => movePlayer('left')}
          onClick={() => movePlayer('left')}
          className="bg-slate-800 p-4 rounded-full active:bg-slate-700"
          aria-label="Move left"
        >
          ◀️
        </button>
        <button
          onTouchStart={() => movePlayer('right')}
          onClick={() => movePlayer('right')}
          className="bg-slate-800 p-4 rounded-full active:bg-slate-700"
          aria-label="Move right"
        >
          ▶️
        </button>
      </div>
      <p className="mt-2 text-slate-500 text-xs text-center">
        استخدم الأسهم في الكيبورد أو الأزرار تحت
      </p>
    </div>
  );
};

export default Index;
