import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CarConfig } from './config';

interface Props {
  car: CarConfig;
  tilt: number; // -1..1 turning tilt for body roll
  bounce: boolean;
}

export const PlayerCar3D = ({ car, tilt, bounce }: Props) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    // body roll into the turn
    groupRef.current.rotation.z += (-tilt * 0.18 - groupRef.current.rotation.z) * Math.min(1, dt * 8);
    // tiny suspension bounce
    const t = performance.now() * 0.012;
    groupRef.current.position.y = 0.35 + (bounce ? Math.sin(t) * 0.02 : 0);
    // spin wheels
    for (const w of wheelRefs.current) {
      if (w) w.rotation.x -= dt * 14;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.35, 0]}>
      {/* main body */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[1.05, 0.45, 2.1]} />
        <meshStandardMaterial color={car.body} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* hood front lip */}
      <mesh castShadow position={[0, 0.0, -0.95]}>
        <boxGeometry args={[1.0, 0.25, 0.3]} />
        <meshStandardMaterial color={car.body} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* roof / cabin */}
      <mesh castShadow position={[0, 0.5, 0.05]}>
        <boxGeometry args={[0.9, 0.4, 1.1]} />
        <meshStandardMaterial color={car.accent} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* windshield front */}
      <mesh position={[0, 0.5, -0.55]} rotation={[Math.PI * 0.12, 0, 0]}>
        <boxGeometry args={[0.85, 0.35, 0.05]} />
        <meshStandardMaterial color={car.window} metalness={0.9} roughness={0.05} />
      </mesh>
      {/* windshield rear */}
      <mesh position={[0, 0.5, 0.62]} rotation={[-Math.PI * 0.15, 0, 0]}>
        <boxGeometry args={[0.85, 0.32, 0.05]} />
        <meshStandardMaterial color={car.window} metalness={0.9} roughness={0.05} />
      </mesh>
      {/* headlights */}
      <mesh position={[-0.32, 0.05, -1.06]}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.32, 0.05, -1.06]}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef9c3" emissiveIntensity={1.5} />
      </mesh>
      {/* taillights */}
      <mesh position={[-0.32, 0.05, 1.06]}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0.32, 0.05, 1.06]}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
      </mesh>
      {/* wheels */}
      {[
        [-0.55, -0.18, -0.75],
        [0.55, -0.18, -0.75],
        [-0.55, -0.18, 0.75],
        [0.55, -0.18, 0.75],
      ].map(([x, y, z], i) => (
        <mesh
          key={i}
          ref={(el) => (wheelRefs.current[i] = el)}
          position={[x, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.22, 0.22, 0.18, 14]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};
