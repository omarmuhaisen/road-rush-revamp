import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { CarConfig } from './config';

interface CarProps {
  car: CarConfig;
  laneX: number; // target lane x position
  isPlaying: boolean;
}

export const Car = ({ car, laneX, isPlaying }: CarProps) => {
  const ref = useRef<Group>(null);
  const wheelRefs = useRef<Group[]>([]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // smooth lane change
    ref.current.position.x += (laneX - ref.current.position.x) * Math.min(1, delta * 12);
    // small tilt while turning
    const tilt = (laneX - ref.current.position.x) * 0.15;
    ref.current.rotation.z = -tilt;

    // spin wheels when playing
    if (isPlaying) {
      wheelRefs.current.forEach((w) => {
        if (w) w.rotation.x -= delta * 20;
      });
    }
  });

  return (
    <group ref={ref} position={[laneX, 0.4, 0]}>
      {/* body */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[1.2, 0.5, 2.2]} />
        <meshStandardMaterial color={car.body} metalness={0.7} roughness={0.25} />
      </mesh>
      {/* cabin */}
      <mesh castShadow position={[0, 0.85, -0.1]}>
        <boxGeometry args={[1.0, 0.45, 1.2]} />
        <meshStandardMaterial color={car.accent} metalness={0.4} roughness={0.15} transparent opacity={0.85} />
      </mesh>
      {/* nose */}
      <mesh castShadow position={[0, 0.3, 1.05]}>
        <boxGeometry args={[1.15, 0.35, 0.3]} />
        <meshStandardMaterial color={car.body} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* spoiler */}
      <mesh castShadow position={[0, 0.7, -1.15]}>
        <boxGeometry args={[1.2, 0.08, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      {/* headlights */}
      <mesh position={[-0.4, 0.35, 1.21]}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fff7c2" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.4, 0.35, 1.21]}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <meshStandardMaterial color="#fffbe6" emissive="#fff7c2" emissiveIntensity={1.2} />
      </mesh>
      {/* taillights */}
      <mesh position={[-0.4, 0.4, -1.11]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.4, 0.4, -1.11]}>
        <boxGeometry args={[0.2, 0.1, 0.05]} />
        <meshStandardMaterial color="#7f1d1d" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
      {/* wheels */}
      {[
        [-0.65, 0.25, 0.7],
        [0.65, 0.25, 0.7],
        [-0.65, 0.25, -0.7],
        [0.65, 0.25, -0.7],
      ].map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) wheelRefs.current[i] = el;
          }}
          position={p as [number, number, number]}
        >
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
