import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ObstacleKind } from './obstacles';

interface Props {
  kind: ObstacleKind;
}

// All obstacles are anchored at y=0 (their base sits on the road).
// Each variant is built from primitive boxes/cylinders to keep visuals consistent and lightweight.
export const Obstacle3D = ({ kind }: Props) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    if (kind === 'hover_drone') {
      groupRef.current.position.y = 0.8 + Math.sin(performance.now() * 0.005) * 0.15;
      groupRef.current.rotation.y += dt * 2;
    } else if (kind === 'laser_gate') {
      groupRef.current.rotation.y += dt * 0.5;
    } else if (kind === 'robot') {
      groupRef.current.rotation.y = Math.sin(performance.now() * 0.003) * 0.4;
    }
  });

  return <group ref={groupRef}>{renderObstacle(kind)}</group>;
};

const renderObstacle = (kind: ObstacleKind) => {
  switch (kind) {
    // ============== CITY ==============
    case 'car_red':
      return <CarObstacle body="#dc2626" roof="#7f1d1d" />;
    case 'car_yellow':
      return <CarObstacle body="#facc15" roof="#854d0e" />;
    case 'truck_blue':
      return <TruckObstacle />;
    case 'bus':
      return <BusObstacle />;
    case 'cone':
      return (
        <group position={[0, 0.35, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.25, 0.7, 12]} />
            <meshStandardMaterial color="#f97316" />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.05, 12]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
        </group>
      );
    // ============== DESERT ==============
    case 'rock':
      return (
        <mesh position={[0, 0.45, 0]} castShadow rotation={[0, Math.random() * Math.PI, 0]}>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color="#92400e" roughness={1} />
        </mesh>
      );
    case 'camel':
      return <CamelObstacle />;
    case 'cactus_big':
      return <CactusObstacle />;
    case 'barrel':
      return (
        <group position={[0, 0.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1, 12]} />
            <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.3, 0.04, 6, 16]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <torusGeometry args={[0.3, 0.04, 6, 16]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      );
    // ============== SNOW ==============
    case 'snowpile':
      return (
        <mesh position={[0, 0.4, 0]} castShadow>
          <sphereGeometry args={[0.65, 12, 8]} />
          <meshStandardMaterial color="#f1f5f9" roughness={1} />
        </mesh>
      );
    case 'sled':
      return <SledObstacle />;
    case 'iceblock':
      return (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#bae6fd" transparent opacity={0.85} metalness={0.3} roughness={0.1} />
        </mesh>
      );
    case 'snowman':
      return <SnowmanObstacle />;
    // ============== NEON ==============
    case 'robot':
      return <RobotObstacle />;
    case 'laser_gate':
      return <LaserGateObstacle />;
    case 'hover_drone':
      return <HoverDroneObstacle />;
    case 'neon_block':
      return (
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.6} />
        </mesh>
      );
  }
};

// ----- helpers -----
const CarObstacle = ({ body, roof }: { body: string; roof: string }) => (
  <group position={[0, 0.35, 0]}>
    <mesh castShadow position={[0, 0.1, 0]}>
      <boxGeometry args={[1, 0.5, 1.9]} />
      <meshStandardMaterial color={body} metalness={0.4} roughness={0.4} />
    </mesh>
    <mesh castShadow position={[0, 0.5, -0.1]}>
      <boxGeometry args={[0.85, 0.45, 1.1]} />
      <meshStandardMaterial color={roof} metalness={0.3} roughness={0.5} />
    </mesh>
    {[[-0.55, -0.7], [0.55, -0.7], [-0.55, 0.7], [0.55, 0.7]].map(([x, z], i) => (
      <mesh key={i} position={[x, -0.18, z]}>
        <cylinderGeometry args={[0.18, 0.18, 0.18, 10]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    ))}
  </group>
);

const TruckObstacle = () => (
  <group position={[0, 0.6, 0]}>
    <mesh castShadow position={[0, 0.2, 0.6]}>
      <boxGeometry args={[1.1, 1.1, 1.4]} />
      <meshStandardMaterial color="#e5e7eb" />
    </mesh>
    <mesh castShadow position={[0, 0, -0.7]}>
      <boxGeometry args={[1.05, 0.7, 1.2]} />
      <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.4} />
    </mesh>
    {[[-0.55, -0.7], [0.55, -0.7], [-0.55, 0.6], [0.55, 0.6]].map(([x, z], i) => (
      <mesh key={i} position={[x, -0.4, z]}>
        <cylinderGeometry args={[0.22, 0.22, 0.2, 10]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    ))}
  </group>
);

const BusObstacle = () => (
  <group position={[0, 0.85, 0]}>
    <mesh castShadow>
      <boxGeometry args={[1.2, 1.5, 3.2]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
    {[-1.1, -0.4, 0.4, 1.1].map((z, i) => (
      <mesh key={i} position={[0.61, 0.1, z]}>
        <boxGeometry args={[0.02, 0.5, 0.4]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.3} />
      </mesh>
    ))}
    {[[-0.55, -1.2], [0.55, -1.2], [-0.55, 1.2], [0.55, 1.2]].map(([x, z], i) => (
      <mesh key={i} position={[x, -0.65, z]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 10]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
    ))}
  </group>
);

const CamelObstacle = () => (
  <group position={[0, 0, 0]}>
    {/* body */}
    <mesh castShadow position={[0, 0.9, 0]}>
      <boxGeometry args={[0.5, 0.5, 1.2]} />
      <meshStandardMaterial color="#c2410c" />
    </mesh>
    {/* humps */}
    <mesh castShadow position={[0, 1.25, -0.1]}>
      <sphereGeometry args={[0.3, 10, 8]} />
      <meshStandardMaterial color="#9a3412" />
    </mesh>
    <mesh castShadow position={[0, 1.25, 0.3]}>
      <sphereGeometry args={[0.28, 10, 8]} />
      <meshStandardMaterial color="#9a3412" />
    </mesh>
    {/* head */}
    <mesh castShadow position={[0, 1.4, -0.7]}>
      <boxGeometry args={[0.3, 0.3, 0.4]} />
      <meshStandardMaterial color="#c2410c" />
    </mesh>
    {/* legs */}
    {[[-0.18, -0.4], [0.18, -0.4], [-0.18, 0.4], [0.18, 0.4]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.4, z]}>
        <boxGeometry args={[0.12, 0.8, 0.12]} />
        <meshStandardMaterial color="#9a3412" />
      </mesh>
    ))}
  </group>
);

const CactusObstacle = () => (
  <group position={[0, 0, 0]}>
    <mesh castShadow position={[0, 0.9, 0]}>
      <boxGeometry args={[0.3, 1.8, 0.3]} />
      <meshStandardMaterial color="#15803d" />
    </mesh>
    <mesh castShadow position={[-0.3, 1.0, 0]}>
      <boxGeometry args={[0.3, 0.5, 0.3]} />
      <meshStandardMaterial color="#15803d" />
    </mesh>
    <mesh castShadow position={[0.3, 1.3, 0]}>
      <boxGeometry args={[0.3, 0.6, 0.3]} />
      <meshStandardMaterial color="#15803d" />
    </mesh>
  </group>
);

const SledObstacle = () => (
  <group position={[0, 0.3, 0]}>
    <mesh castShadow position={[0, 0.1, 0]}>
      <boxGeometry args={[0.85, 0.15, 1.5]} />
      <meshStandardMaterial color="#7c2d12" />
    </mesh>
    <mesh position={[-0.4, -0.05, 0]}>
      <boxGeometry args={[0.06, 0.12, 1.6]} />
      <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[0.4, -0.05, 0]}>
      <boxGeometry args={[0.06, 0.12, 1.6]} />
      <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.2} />
    </mesh>
  </group>
);

const SnowmanObstacle = () => (
  <group position={[0, 0, 0]}>
    <mesh castShadow position={[0, 0.4, 0]}>
      <sphereGeometry args={[0.4, 12, 8]} />
      <meshStandardMaterial color="#f8fafc" />
    </mesh>
    <mesh castShadow position={[0, 0.95, 0]}>
      <sphereGeometry args={[0.3, 12, 8]} />
      <meshStandardMaterial color="#f8fafc" />
    </mesh>
    <mesh castShadow position={[0, 1.4, 0]}>
      <sphereGeometry args={[0.22, 12, 8]} />
      <meshStandardMaterial color="#f8fafc" />
    </mesh>
    <mesh position={[0, 1.55, 0]}>
      <cylinderGeometry args={[0.18, 0.18, 0.3, 10]} />
      <meshStandardMaterial color="#0f172a" />
    </mesh>
    <mesh position={[0, 0.95, -0.28]}>
      <coneGeometry args={[0.05, 0.2, 6]} rotation={[Math.PI / 2, 0, 0]} />
      <meshStandardMaterial color="#f97316" />
    </mesh>
  </group>
);

const RobotObstacle = () => (
  <group position={[0, 0, 0]}>
    <mesh castShadow position={[0, 0.5, 0]}>
      <boxGeometry args={[0.6, 0.7, 0.4]} />
      <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh castShadow position={[0, 1.05, 0]}>
      <boxGeometry args={[0.45, 0.4, 0.4]} />
      <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[-0.1, 1.1, 0.21]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
    </mesh>
    <mesh position={[0.1, 1.1, 0.21]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
    </mesh>
    <mesh castShadow position={[-0.4, 0.5, 0]}>
      <boxGeometry args={[0.15, 0.7, 0.15]} />
      <meshStandardMaterial color="#1e293b" metalness={0.8} />
    </mesh>
    <mesh castShadow position={[0.4, 0.5, 0]}>
      <boxGeometry args={[0.15, 0.7, 0.15]} />
      <meshStandardMaterial color="#1e293b" metalness={0.8} />
    </mesh>
    <mesh castShadow position={[0, 0.05, 0]}>
      <boxGeometry args={[0.5, 0.2, 0.5]} />
      <meshStandardMaterial color="#0f172a" />
    </mesh>
  </group>
);

const LaserGateObstacle = () => (
  <group position={[0, 0, 0]}>
    <mesh position={[-0.7, 0.75, 0]}>
      <boxGeometry args={[0.12, 1.5, 0.12]} />
      <meshStandardMaterial color="#0f172a" metalness={0.8} />
    </mesh>
    <mesh position={[0.7, 0.75, 0]}>
      <boxGeometry args={[0.12, 1.5, 0.12]} />
      <meshStandardMaterial color="#0f172a" metalness={0.8} />
    </mesh>
    <mesh position={[0, 0.75, 0]}>
      <boxGeometry args={[1.4, 0.08, 0.04]} />
      <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2.5} />
    </mesh>
    <mesh position={[0, 1.05, 0]}>
      <boxGeometry args={[1.4, 0.04, 0.02]} />
      <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2} />
    </mesh>
  </group>
);

const HoverDroneObstacle = () => (
  <group position={[0, 0.8, 0]}>
    <mesh castShadow>
      <sphereGeometry args={[0.35, 12, 8]} />
      <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0, 0.36]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
    </mesh>
    {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => (
      <mesh key={i} position={[Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45]}>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 8]} />
        <meshStandardMaterial color="#475569" transparent opacity={0.6} />
      </mesh>
    ))}
  </group>
);
