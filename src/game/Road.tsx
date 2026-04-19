import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { LANES_X, LevelTheme } from './config';

interface RoadProps {
  theme: LevelTheme;
  speed: number;
  isPlaying: boolean;
}

const SEGMENT_LENGTH = 20;
const SEGMENT_COUNT = 6;

export const Road = ({ theme, speed, isPlaying }: RoadProps) => {
  const groupRef = useRef<Group>(null);

  const segments = useMemo(() => {
    return Array.from({ length: SEGMENT_COUNT }, (_, i) => i);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !isPlaying) return;
    groupRef.current.children.forEach((seg) => {
      seg.position.z += speed * delta;
      if (seg.position.z > SEGMENT_LENGTH) {
        seg.position.z -= SEGMENT_COUNT * SEGMENT_LENGTH;
      }
    });
  });

  const roadWidth = (LANES_X[LANES_X.length - 1] - LANES_X[0]) + 2.2;

  return (
    <group ref={groupRef}>
      {segments.map((i) => {
        const z = -i * SEGMENT_LENGTH;
        return (
          <group key={i} position={[0, 0, z]}>
            {/* road */}
            <mesh receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[roadWidth, SEGMENT_LENGTH]} />
              <meshStandardMaterial color={theme.road} roughness={0.85} />
            </mesh>
            {/* lane dividers */}
            {[-2, 0, 2].map((x) => (
              <mesh key={x} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.12, SEGMENT_LENGTH * 0.7]} />
                <meshStandardMaterial
                  color={theme.neon ? theme.decorAccent : '#fef3c7'}
                  emissive={theme.neon ? theme.decorAccent : '#000'}
                  emissiveIntensity={theme.neon ? 1.2 : 0}
                />
              </mesh>
            ))}
            {/* side ground */}
            <mesh receiveShadow position={[-roadWidth / 2 - 15, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[30, SEGMENT_LENGTH]} />
              <meshStandardMaterial color={theme.ground} roughness={1} />
            </mesh>
            <mesh receiveShadow position={[roadWidth / 2 + 15, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[30, SEGMENT_LENGTH]} />
              <meshStandardMaterial color={theme.ground} roughness={1} />
            </mesh>

            {/* decor: vary by theme */}
            <Decor theme={theme} segmentIndex={i} />
          </group>
        );
      })}
    </group>
  );
};

const Decor = ({ theme, segmentIndex }: { theme: LevelTheme; segmentIndex: number }) => {
  // deterministic per segment to avoid flicker
  const seed = segmentIndex * 7 + 1;
  const rand = (n: number) => {
    const x = Math.sin(seed * 9999 + n * 13) * 10000;
    return x - Math.floor(x);
  };

  const items = Array.from({ length: 6 }, (_, k) => {
    const side = k % 2 === 0 ? -1 : 1;
    const x = side * (8 + rand(k) * 6);
    const z = (rand(k + 100) - 0.5) * (SEGMENT_LENGTH - 2);
    const scale = 0.7 + rand(k + 200) * 1.6;
    return { x, z, scale, k };
  });

  return (
    <>
      {items.map(({ x, z, scale, k }) => {
        if (theme.id === 'city') {
          // skyscrapers
          return (
            <mesh key={k} position={[x, scale * 2.5, z]} castShadow>
              <boxGeometry args={[2, scale * 5, 2]} />
              <meshStandardMaterial
                color={theme.decorColor}
                emissive={theme.decorAccent}
                emissiveIntensity={0.15}
              />
            </mesh>
          );
        }
        if (theme.id === 'desert') {
          // cacti / rocks
          return (
            <group key={k} position={[x, 0, z]}>
              <mesh castShadow position={[0, scale * 0.8, 0]}>
                <cylinderGeometry args={[0.3, 0.4, scale * 1.6, 8]} />
                <meshStandardMaterial color={theme.decorColor} roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0.4, scale * 1.1, 0]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial color={theme.decorColor} roughness={0.9} />
              </mesh>
            </group>
          );
        }
        if (theme.id === 'snow') {
          // pine trees
          return (
            <group key={k} position={[x, 0, z]}>
              <mesh castShadow position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.15, 0.2, 0.8, 6]} />
                <meshStandardMaterial color="#5a3825" />
              </mesh>
              <mesh castShadow position={[0, 1.2 * scale, 0]}>
                <coneGeometry args={[0.7 * scale, 1.6 * scale, 8]} />
                <meshStandardMaterial color={theme.decorColor} />
              </mesh>
              <mesh castShadow position={[0, 1.7 * scale, 0]}>
                <coneGeometry args={[0.5 * scale, 1.2 * scale, 8]} />
                <meshStandardMaterial color={theme.decorAccent} />
              </mesh>
            </group>
          );
        }
        // neon: glowing pillars
        return (
          <mesh key={k} castShadow position={[x, scale * 1.5, z]}>
            <boxGeometry args={[0.6, scale * 3, 0.6]} />
            <meshStandardMaterial
              color={theme.decorColor}
              emissive={theme.decorAccent}
              emissiveIntensity={1.4}
            />
          </mesh>
        );
      })}
    </>
  );
};
