import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CarConfig, Stage, CAR_W, CAR_H } from './config';
import { getTheme3D, Theme3D } from './themes3d';
import { PlayerCar3D } from './PlayerCar3D';
import { Obstacle3D } from './Obstacle3D';
import { OBSTACLE_DEFS, ObstacleKind, pickObstacleForTheme } from './obstacles';

// ---- world dimensions (meters) ----
const ROAD_WIDTH = 8;
const LANES = 5;
const LANE_W = ROAD_WIDTH / LANES;
const HALF_ROAD = ROAD_WIDTH / 2;
const VIEW_AHEAD = 70; // how far ahead we render the world
const SPAWN_Z = -55;
const DESPAWN_Z = 12;
const COIN_SIZE = 0.35;

// player car physical box
const PLAYER_W = 1.0;
const PLAYER_L = 2.0;

// distance per stage scales with index
const stageDistance = (stage: Stage) => 220 + stage.index * 18; // meters

type Spawned =
  | { id: number; type: 'obstacle'; kind: ObstacleKind; x: number; z: number; w: number; d: number }
  | { id: number; type: 'coin'; x: number; z: number };

interface Props {
  car: CarConfig;
  themeId: string;
  stage: Stage;
  isPlaying: boolean;
  isPaused: boolean;
  onCoin: () => void;
  onCrash: () => void;
  onScoreTick: (delta: number) => void;
  onProgress?: (pct: number) => void;
  onFinish?: () => void;
}

export const Game3D = ({
  car,
  themeId,
  stage,
  isPlaying,
  isPaused,
  onCoin,
  onCrash,
  onScoreTick,
  onProgress,
  onFinish,
}: Props) => {
  const theme = useMemo(() => getTheme3D(themeId), [themeId]);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 4.2, 6], fov: 55, near: 0.1, far: 200 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ background: theme.sky, touchAction: 'none' }}
    >
      <color attach="background" args={[theme.sky]} />
      <fog attach="fog" args={[theme.fog, theme.fogNear, theme.fogFar]} />
      <ambientLight intensity={theme.ambient} />
      <directionalLight
        position={[6, 12, 4]}
        intensity={theme.sunIntensity}
        color={theme.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      {themeId === 'neon' && (
        <>
          <pointLight position={[-4, 3, -10]} color="#ec4899" intensity={1.2} distance={20} />
          <pointLight position={[4, 3, -20]} color="#22d3ee" intensity={1.2} distance={20} />
        </>
      )}

      <Scene
        car={car}
        theme={theme}
        themeId={themeId}
        stage={stage}
        isPlaying={isPlaying}
        isPaused={isPaused}
        onCoin={onCoin}
        onCrash={onCrash}
        onScoreTick={onScoreTick}
        onProgress={onProgress}
        onFinish={onFinish}
      />
    </Canvas>
  );
};

// ============================================================
// Scene (inside Canvas — has access to useFrame / useThree)
// ============================================================
const Scene = ({
  car,
  theme,
  themeId,
  stage,
  isPlaying,
  isPaused,
  onCoin,
  onCrash,
  onScoreTick,
  onProgress,
  onFinish,
}: {
  car: CarConfig;
  theme: Theme3D;
  themeId: string;
  stage: Stage;
  isPlaying: boolean;
  isPaused: boolean;
  onCoin: () => void;
  onCrash: () => void;
  onScoreTick: (delta: number) => void;
  onProgress?: (pct: number) => void;
  onFinish?: () => void;
}) => {
  const { gl, camera, size } = useThree();

  // ---- mutable game state (refs, no rerender) ----
  const playerLane = useRef(2);
  const playerX = useRef(0);
  const targetX = useRef(0);
  const playerTilt = useRef(0);
  const dragging = useRef(false);
  const speed = useRef(0); // current m/s — base is car.speed/14, scaled by stage.speedMul
  const targetSpeed = useRef(0);
  const distance = useRef(0);
  const totalDist = useMemo(() => stageDistance(stage), [stage]);
  const finished = useRef(false);
  const finishZ = useRef<number | null>(null);
  const spawnTimer = useRef(0);
  const coinTimer = useRef(0);
  const scoreAccum = useRef(0);
  const crashLock = useRef(0);
  const idCounter = useRef(0);

  // entities live in a ref array; we re-render parent only when we add/remove
  const [entities, setEntities] = useState<Spawned[]>([]);
  const entitiesRef = useRef<Spawned[]>([]);
  entitiesRef.current = entities;

  // road scroll for moving stripes
  const roadOffset = useRef(0);
  const stripesRef = useRef<THREE.InstancedMesh>(null);
  const groundOffset = useRef(0);

  // ---- reset on stage change / replay ----
  useEffect(() => {
    playerLane.current = 2;
    playerX.current = 0;
    targetX.current = 0;
    distance.current = 0;
    finished.current = false;
    finishZ.current = null;
    spawnTimer.current = 0;
    coinTimer.current = 0;
    scoreAccum.current = 0;
    crashLock.current = 0;
    setEntities([]);
    speed.current = 0;
  }, [stage.themeId, stage.index, isPlaying]);

  // ---- compute target speed from car + stage ----
  const baseSpeed = (car.speed / 14) * stage.speedMul; // ~7..30 m/s
  targetSpeed.current = baseSpeed;

  // ============ INPUT: pointer drag on the canvas ============
  useEffect(() => {
    const canvas = gl.domElement;
    const rect = () => canvas.getBoundingClientRect();

    const setFromX = (clientX: number) => {
      const r = rect();
      const norm = (clientX - r.left) / r.width; // 0..1
      const worldX = (norm - 0.5) * ROAD_WIDTH; // -HALF..HALF
      const clamped = Math.max(-HALF_ROAD + LANE_W / 2, Math.min(HALF_ROAD - LANE_W / 2, worldX));
      targetX.current = clamped;
      const lane = Math.round((clamped + HALF_ROAD - LANE_W / 2) / LANE_W);
      playerLane.current = Math.max(0, Math.min(LANES - 1, lane));
    };

    const down = (e: PointerEvent) => {
      if (!isPlaying || isPaused) return;
      dragging.current = true;
      canvas.setPointerCapture?.(e.pointerId);
      setFromX(e.clientX);
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current || !isPlaying || isPaused) return;
      setFromX(e.clientX);
    };
    const up = (e: PointerEvent) => {
      dragging.current = false;
      try { canvas.releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
    };
    const key = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
        playerLane.current = Math.max(0, playerLane.current - 1);
        targetX.current = -HALF_ROAD + LANE_W / 2 + LANE_W * playerLane.current;
      }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) {
        playerLane.current = Math.min(LANES - 1, playerLane.current + 1);
        targetX.current = -HALF_ROAD + LANE_W / 2 + LANE_W * playerLane.current;
      }
    };

    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    return () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key);
    };
  }, [gl, isPlaying, isPaused, size.width]);

  // ============ MAIN LOOP ============
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    if (!isPlaying || isPaused) return;
    if (finished.current) return;

    // smooth speed ramp
    speed.current += (targetSpeed.current - speed.current) * Math.min(1, dt * 2);

    // distance + finish
    distance.current += speed.current * dt;
    onProgress?.(Math.min(1, distance.current / totalDist));

    if (distance.current >= totalDist && finishZ.current === null) {
      finishZ.current = SPAWN_Z; // finish line spawns far ahead
    }

    // smooth steering
    playerX.current += (targetX.current - playerX.current) * Math.min(1, car.handling * 14 * dt);
    const dx = targetX.current - playerX.current;
    playerTilt.current = Math.max(-1, Math.min(1, dx * 1.2));

    // road / ground scroll offsets (visual only)
    roadOffset.current = (roadOffset.current + speed.current * dt) % 4;
    groundOffset.current = (groundOffset.current + speed.current * dt) % 6;

    // move entities toward camera (positive Z)
    const next: Spawned[] = [];
    let crashed = false;
    let coinsCollected = 0;

    const px = playerX.current;
    const pz = 0; // player car sits at z=0
    const pHalfW = PLAYER_W / 2;
    const pHalfL = PLAYER_L / 2;

    for (const e of entitiesRef.current) {
      const newZ = e.z + speed.current * dt;
      if (newZ > DESPAWN_Z) continue;

      if (e.type === 'coin') {
        const overlap =
          Math.abs(e.x - px) < pHalfW + COIN_SIZE &&
          Math.abs(newZ - pz) < pHalfL + COIN_SIZE;
        if (overlap) { coinsCollected++; continue; }
        next.push({ ...e, z: newZ });
      } else {
        const halfW = e.w / 2;
        const halfD = e.d / 2;
        const overlap =
          Math.abs(e.x - px) < pHalfW + halfW &&
          Math.abs(newZ - pz) < pHalfL + halfD;
        if (overlap && crashLock.current <= 0) {
          crashed = true;
          crashLock.current = 0.6; // brief invuln
        }
        next.push({ ...e, z: newZ });
      }
    }
    if (crashLock.current > 0) crashLock.current -= dt;

    // advance finish line
    if (finishZ.current !== null) {
      finishZ.current += speed.current * dt;
      if (finishZ.current >= 0 && !finished.current) {
        finished.current = true;
        onFinish?.();
      }
    }

    // spawn new ones (stop while finish-line is on its way)
    if (finishZ.current === null) {
      spawnTimer.current += dt;
      const spawnEvery = 1 / Math.max(0.4, stage.obstacleRate * 0.6); // 3D world spawns slower
      while (spawnTimer.current > spawnEvery) {
        spawnTimer.current -= spawnEvery;
        const lane = Math.floor(Math.random() * LANES);
        const x = -HALF_ROAD + LANE_W / 2 + LANE_W * lane;
        const kind = pickObstacleForTheme(themeId);
        const def = OBSTACLE_DEFS[kind];
        idCounter.current += 1;
        next.push({
          id: idCounter.current,
          type: 'obstacle',
          kind,
          x,
          z: SPAWN_Z,
          w: def.width,
          d: def.depth,
        });
      }

      coinTimer.current += dt;
      const coinEvery = 1 / Math.max(0.6, stage.coinRate * 0.7);
      while (coinTimer.current > coinEvery) {
        coinTimer.current -= coinEvery;
        const lane = Math.floor(Math.random() * LANES);
        const x = -HALF_ROAD + LANE_W / 2 + LANE_W * lane;
        idCounter.current += 1;
        next.push({ id: idCounter.current, type: 'coin', x, z: SPAWN_Z + Math.random() * 8 });
      }
    }

    setEntities(next);

    // score
    scoreAccum.current += speed.current * dt * 0.6;
    if (scoreAccum.current >= 1) {
      const inc = Math.floor(scoreAccum.current);
      scoreAccum.current -= inc;
      onScoreTick(inc);
    }

    // dispatch outside-state events
    if (coinsCollected) for (let i = 0; i < coinsCollected; i++) onCoin();
    if (crashed) onCrash();

    // road stripe instances scroll
    if (stripesRef.current) {
      const tmp = new THREE.Object3D();
      let i = 0;
      const stripeCount = 30;
      for (let k = 0; k < stripeCount; k++) {
        for (let lane = 1; lane < LANES; lane++) {
          const xLane = -HALF_ROAD + LANE_W * lane;
          const zPos = -k * 4 + (roadOffset.current % 4) + 4;
          tmp.position.set(xLane, 0.011, zPos);
          tmp.scale.set(1, 1, 1);
          tmp.updateMatrix();
          stripesRef.current.setMatrixAt(i++, tmp.matrix);
        }
      }
      stripesRef.current.instanceMatrix.needsUpdate = true;
    }

    // camera follows player
    const targetCamX = playerX.current * 0.45;
    camera.position.x += (targetCamX - camera.position.x) * Math.min(1, dt * 5);
    camera.position.y = 4.2;
    camera.position.z = 6;
    camera.lookAt(playerX.current * 0.6, 0.6, -6);
  });

  // ---- decor positions (stable per render) ----
  const decorPositions = useMemo(() => {
    const arr: { x: number; z: number; r: number; s: number }[] = [];
    for (let i = 0; i < 22; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      arr.push({
        x: side * (HALF_ROAD + 2 + Math.random() * 3),
        z: -i * 5,
        r: Math.random() * Math.PI,
        s: 0.7 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {/* GROUND (large plane) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={theme.ground} roughness={1} />
      </mesh>

      {/* ROAD */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -20]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH, 200]} />
        <meshStandardMaterial color={theme.road} roughness={0.8} />
      </mesh>

      {/* road edges */}
      <mesh position={[-HALF_ROAD - 0.05, 0.01, -20]}>
        <boxGeometry args={[0.1, 0.04, 200]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>
      <mesh position={[HALF_ROAD + 0.05, 0.01, -20]}>
        <boxGeometry args={[0.1, 0.04, 200]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      {/* lane stripes via instancing */}
      <instancedMesh ref={stripesRef} args={[undefined, undefined, 30 * (LANES - 1)]}>
        <boxGeometry args={[0.12, 0.005, 1.6]} />
        <meshStandardMaterial color={themeId === 'snow' ? '#facc15' : '#fde047'} />
      </instancedMesh>

      {/* finish line */}
      {finishZ.current !== null && <FinishLine zRef={finishZ} />}

      {/* decor / scenery */}
      {decorPositions.map((d, i) => (
        <Decor key={i} themeId={themeId} pos={d} />
      ))}

      {/* entities */}
      {entities.map((e) =>
        e.type === 'coin' ? (
          <Coin3D key={e.id} x={e.x} z={e.z} />
        ) : (
          <group key={e.id} position={[e.x, 0, e.z]}>
            <Obstacle3D kind={e.kind} />
          </group>
        )
      )}

      {/* PLAYER */}
      <group position={[playerX.current, 0, 0]}>
        <PlayerCar3D car={car} tilt={playerTilt.current} bounce={isPlaying && !isPaused} />
      </group>
    </>
  );
};

// ============ small sub-components ============

const Coin3D = ({ x, z }: { x: number; z: number }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 4;
  });
  return (
    <mesh ref={ref} position={[x, 0.55, z]} castShadow>
      <cylinderGeometry args={[0.28, 0.28, 0.06, 16]} />
      <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.4} metalness={0.9} roughness={0.2} />
    </mesh>
  );
};

const FinishLine = ({ zRef }: { zRef: React.MutableRefObject<number | null> }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current && zRef.current !== null) {
      ref.current.position.z = zRef.current;
    }
  });
  return (
    <group ref={ref}>
      {/* checkered band */}
      {Array.from({ length: 16 }).map((_, i) => (
        <mesh key={i} position={[-HALF_ROAD + 0.25 + i * 0.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 1]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : '#000000'} />
        </mesh>
      ))}
      {/* arch */}
      <mesh position={[-HALF_ROAD, 1.2, 0]}>
        <boxGeometry args={[0.2, 2.4, 0.2]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[HALF_ROAD, 1.2, 0]}>
        <boxGeometry args={[0.2, 2.4, 0.2]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[ROAD_WIDTH + 0.4, 0.4, 0.2]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

const Decor = ({ themeId, pos }: { themeId: string; pos: { x: number; z: number; r: number; s: number } }) => {
  if (themeId === 'city') {
    return (
      <group position={[pos.x, 0, pos.z]} rotation={[0, pos.r, 0]} scale={pos.s}>
        <mesh castShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[1.5, 3, 1.5]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0, 1.5, 0.76]}>
          <boxGeometry args={[1.2, 2.6, 0.02]} />
          <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  }
  if (themeId === 'desert') {
    return (
      <group position={[pos.x, 0, pos.z]} scale={pos.s}>
        <mesh castShadow position={[0, 0.9, 0]}>
          <boxGeometry args={[0.3, 1.8, 0.3]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
        <mesh castShadow position={[-0.3, 1.0, 0]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      </group>
    );
  }
  if (themeId === 'snow') {
    return (
      <group position={[pos.x, 0, pos.z]} scale={pos.s}>
        <mesh castShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 6]} />
          <meshStandardMaterial color="#5a3825" />
        </mesh>
        <mesh castShadow position={[0, 1.3, 0]}>
          <coneGeometry args={[0.7, 1.6, 8]} />
          <meshStandardMaterial color="#0f766e" />
        </mesh>
        <mesh castShadow position={[0, 1.9, 0]}>
          <coneGeometry args={[0.5, 1.2, 8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
    );
  }
  // neon
  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, pos.r, 0]} scale={pos.s}>
      <mesh castShadow position={[0, 1.8, 0]}>
        <boxGeometry args={[1.2, 3.6, 1.2]} />
        <meshStandardMaterial color="#1e1b4b" />
      </mesh>
      <mesh position={[0, 2.5, 0.61]}>
        <boxGeometry args={[1.0, 0.15, 0.02]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 1.8, 0.61]}>
        <boxGeometry args={[1.0, 0.15, 0.02]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};
