import { Canvas } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { CarConfig, LANES_X, LevelTheme } from './config';
import { Car } from './Car';
import { Road } from './Road';
import { Coin, Obstacle, EntityData } from './Entities';

interface SceneProps {
  car: CarConfig;
  theme: LevelTheme;
  isPlaying: boolean;
  playerLane: number;
  onCoin: () => void;
  onCrash: () => void;
  onScoreTick: () => void;
}

const SPAWN_Z = -80;
const DESPAWN_Z = 8;

const Scene = ({ car, theme, isPlaying, playerLane, onCoin, onCrash, onScoreTick }: SceneProps) => {
  const entitiesRef = useRef<EntityData[]>([]);
  const meshGroupsRef = useRef<Map<number, Group>>(new Map());
  const [, force] = useState(0);
  const spawnTimer = useRef(0);
  const scoreTimer = useRef(0);
  const idCounter = useRef(0);

  // reset entities when level/play state changes
  useEffect(() => {
    entitiesRef.current = [];
    meshGroupsRef.current.clear();
    force((n) => n + 1);
  }, [theme.id, isPlaying]);

  useFrame((_, delta) => {
    if (!isPlaying) return;

    // move entities
    entitiesRef.current.forEach((e) => {
      e.z += car.speed * delta;
      const mesh = meshGroupsRef.current.get(e.id);
      if (mesh) mesh.position.z = e.z;
    });

    // collision check
    const remaining: EntityData[] = [];
    let crashed = false;
    for (const e of entitiesRef.current) {
      if (e.z > DESPAWN_Z) continue;
      const sameLane = e.lane === playerLane;
      const inHitZone = e.z > -2 && e.z < 1.5;
      if (sameLane && inHitZone) {
        if (e.type === 'coin') {
          onCoin();
          continue;
        }
        if (e.type === 'obstacle') {
          crashed = true;
        }
      }
      remaining.push(e);
    }
    entitiesRef.current = remaining;
    if (crashed) {
      onCrash();
      return;
    }

    // spawn new entities
    spawnTimer.current += delta;
    if (spawnTimer.current > 0.5) {
      spawnTimer.current = 0;
      const lane = Math.floor(Math.random() * LANES_X.length);
      const type: 'obstacle' | 'coin' = Math.random() < 0.5 ? 'coin' : 'obstacle';
      idCounter.current += 1;
      entitiesRef.current.push({ id: idCounter.current, lane, z: SPAWN_Z, type });
      // also sometimes spawn a coin trail
      if (Math.random() < 0.4) {
        idCounter.current += 1;
        entitiesRef.current.push({
          id: idCounter.current,
          lane: Math.floor(Math.random() * LANES_X.length),
          z: SPAWN_Z - 4,
          type: 'coin',
        });
      }
      force((n) => (n + 1) % 1000000);
    }

    // score
    scoreTimer.current += delta;
    if (scoreTimer.current > 0.1) {
      scoreTimer.current = 0;
      onScoreTick();
    }
  });

  const laneX = LANES_X[playerLane];

  return (
    <>
      <fog attach="fog" args={[theme.fog, theme.fogNear, theme.fogFar]} />
      <color attach="background" args={[theme.fog]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={theme.sun}
        color={theme.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      {theme.neon && (
        <>
          <pointLight position={[-5, 3, -10]} color="#ec4899" intensity={2} distance={20} />
          <pointLight position={[5, 3, -20]} color="#06b6d4" intensity={2} distance={20} />
        </>
      )}

      <Road theme={theme} speed={car.speed} isPlaying={isPlaying} />
      <Car car={car} laneX={laneX} isPlaying={isPlaying} />

      {/* render entities */}
      {entitiesRef.current.map((e) => (
        <group
          key={e.id}
          ref={(el) => {
            if (el) meshGroupsRef.current.set(e.id, el);
            else meshGroupsRef.current.delete(e.id);
          }}
          position={[LANES_X[e.lane], 0, e.z]}
        >
          {e.type === 'obstacle' ? <Obstacle theme={theme} /> : <Coin />}
        </group>
      ))}
    </>
  );
};

interface GameCanvasProps {
  car: CarConfig;
  theme: LevelTheme;
  isPlaying: boolean;
  playerLane: number;
  onCoin: () => void;
  onCrash: () => void;
  onScoreTick: () => void;
}

export const GameCanvas = (props: GameCanvasProps) => {
  return (
    <Canvas shadows camera={{ position: [0, 4.5, 7], fov: 60 }} dpr={[1, 2]}>
      <Scene {...props} />
    </Canvas>
  );
};
