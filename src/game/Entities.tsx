import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';
import { LevelTheme } from './config';

export type EntityData = {
  id: number;
  lane: number; // 0..3
  z: number; // current world z position (negative = ahead)
  type: 'obstacle' | 'coin';
};

interface ObstacleProps {
  theme: LevelTheme;
}

export const Obstacle = ({ theme }: ObstacleProps) => {
  return (
    <group>
      {/* truck/car obstacle */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.3, 1, 2]} />
        <meshStandardMaterial color={theme.obstacleColor} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 1.1, -0.2]}>
        <boxGeometry args={[1.1, 0.7, 1.2]} />
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </mesh>
      {/* warning lights */}
      <mesh position={[-0.5, 1.55, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.5, 1.55, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

export const Coin = () => {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 4;
  });
  return (
    <group ref={ref} position={[0, 1, 0]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 24]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
};
