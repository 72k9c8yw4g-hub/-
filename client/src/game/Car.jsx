import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Car({ position, rotation, speed = 0, color = '#ff3366', isLocal = false, name = '' }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const wheelRefs = [useRef(), useRef(), useRef(), useRef()];
  const exhaustRef = useRef();

  const carColor = useMemo(() => new THREE.Color(color), [color]);
  const emissiveColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.4), [color]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Smooth position/rotation interpolation for remote cars is handled by parent
    groupRef.current.position.set(position.x, position.y, position.z);
    groupRef.current.rotation.y = rotation;

    // Wheel spin based on speed
    const wheelSpin = speed * 0.15;
    wheelRefs.forEach((ref) => {
      if (ref.current) ref.current.rotation.x -= wheelSpin * 0.016;
    });

    // Subtle body bob when moving
    if (bodyRef.current && Math.abs(speed) > 0.5) {
      const t = clock.getElapsedTime();
      bodyRef.current.position.y = Math.sin(t * 12 * Math.abs(speed) / 10) * 0.015;
    }

    // Exhaust glow when accelerating
    if (exhaustRef.current) {
      const intensity = Math.max(0, speed / 28) * 2;
      exhaustRef.current.intensity = intensity;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Car body */}
      <group ref={bodyRef}>
        {/* Main body */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.9, 0.32, 1.8]} />
          <meshStandardMaterial
            color={carColor}
            emissive={emissiveColor}
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>

        {/* Cabin/roof */}
        <mesh position={[0, 0.5, -0.1]} castShadow>
          <boxGeometry args={[0.7, 0.28, 0.9]} />
          <meshStandardMaterial
            color={carColor}
            emissive={emissiveColor}
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.5}
          />
        </mesh>

        {/* Windshield */}
        <mesh position={[0, 0.48, 0.36]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.62, 0.22, 0.05]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.5} emissive="#88ccff" emissiveIntensity={0.3} />
        </mesh>

        {/* Front spoiler */}
        <mesh position={[0, 0.08, 0.95]} castShadow>
          <boxGeometry args={[1.0, 0.06, 0.12]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>

        {/* Rear spoiler */}
        <mesh position={[0, 0.65, -0.88]} castShadow>
          <boxGeometry args={[0.85, 0.08, 0.06]} />
          <meshStandardMaterial color={carColor} emissive={emissiveColor} emissiveIntensity={0.5} roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Spoiler poles */}
        <mesh position={[-0.28, 0.52, -0.88]}><boxGeometry args={[0.05, 0.22, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[0.28, 0.52, -0.88]}><boxGeometry args={[0.05, 0.22, 0.05]} /><meshStandardMaterial color="#222" /></mesh>

        {/* Headlights */}
        <mesh position={[-0.28, 0.22, 0.91]}>
          <boxGeometry args={[0.18, 0.1, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.28, 0.22, 0.91]}>
          <boxGeometry args={[0.18, 0.1, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>

        {/* Tail lights */}
        <mesh position={[-0.3, 0.22, -0.91]}>
          <boxGeometry args={[0.14, 0.1, 0.04]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.3, 0.22, -0.91]}>
          <boxGeometry args={[0.14, 0.1, 0.04]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>

        {/* Neon underglow */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.85, 0.02, 1.7]} />
          <meshStandardMaterial color={carColor} emissive={carColor} emissiveIntensity={1.5} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Wheels */}
      {[
        { pos: [-0.52, 0, 0.62], isFront: true },
        { pos: [0.52, 0, 0.62], isFront: true },
        { pos: [-0.52, 0, -0.62], isFront: false },
        { pos: [0.52, 0, -0.62], isFront: false },
      ].map(({ pos, isFront }, i) => (
        <group key={i} ref={wheelRefs[i]} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 12]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.2, 6]} />
            <meshStandardMaterial color={carColor} emissive={emissiveColor} emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Headlights (point lights) */}
      <pointLight position={[0, 0.22, 1.1]} color="#ffffff" intensity={isLocal ? 20 : 5} distance={12} decay={2} />

      {/* Exhaust glow */}
      <pointLight ref={exhaustRef} position={[0, 0.1, -1.0]} color={color} intensity={0} distance={4} decay={2} />

      {/* Car color ambient light */}
      <pointLight position={[0, -0.1, 0]} color={color} intensity={3} distance={5} decay={2} />

      {/* Name label for remote players */}
      {!isLocal && name && (
        <group position={[0, 1.4, 0]}>
          <mesh>
            <planeGeometry args={[1.6, 0.35]} />
            <meshBasicMaterial color="black" transparent opacity={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}
