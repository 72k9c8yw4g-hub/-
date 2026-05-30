import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRACK_INNER, TRACK_OUTER } from './physics.js';

const SEGMENTS = 128;
const TRACK_Y = 0;

export default function Track() {
  const lineRef1 = useRef();
  const lineRef2 = useRef();

  // Animate neon pulse
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const intensity = 0.6 + Math.sin(t * 1.5) * 0.2;
    if (lineRef1.current) lineRef1.current.material.opacity = intensity;
    if (lineRef2.current) lineRef2.current.material.opacity = intensity;
  });

  // Track ring geometry
  const trackGeo = useMemo(() => {
    const geo = new THREE.RingGeometry(TRACK_INNER, TRACK_OUTER, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Ground plane
  const groundGeo = useMemo(() => new THREE.PlaneGeometry(300, 300), []);

  // Inner/outer edge tube curves
  const innerCurve = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(a) * TRACK_INNER, 0.02, Math.cos(a) * TRACK_INNER));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);

  const outerCurve = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.sin(a) * TRACK_OUTER, 0.02, Math.cos(a) * TRACK_OUTER));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);

  const innerTubeGeo = useMemo(() => new THREE.TubeGeometry(innerCurve, SEGMENTS, 0.12, 8, true), [innerCurve]);
  const outerTubeGeo = useMemo(() => new THREE.TubeGeometry(outerCurve, SEGMENTS, 0.12, 8, true), [outerCurve]);

  // Center dashed line (track mid)
  const midRadius = (TRACK_INNER + TRACK_OUTER) / 2;
  const dashLines = useMemo(() => {
    const lines = [];
    const dashCount = 32;
    for (let i = 0; i < dashCount; i++) {
      const a1 = (i / dashCount) * Math.PI * 2;
      const a2 = ((i + 0.4) / dashCount) * Math.PI * 2;
      const pts = [];
      const steps = 8;
      for (let s = 0; s <= steps; s++) {
        const a = a1 + (a2 - a1) * (s / steps);
        pts.push(new THREE.Vector3(Math.sin(a) * midRadius, 0.01, Math.cos(a) * midRadius));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      lines.push(new THREE.TubeGeometry(curve, 8, 0.05, 4, false));
    }
    return lines;
  }, []);

  // Start/finish line
  const startLineGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TRACK_OUTER - TRACK_INNER, 1.2);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Barrier posts along track edges
  const barrierPosts = useMemo(() => {
    const posts = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      posts.push({
        inner: { x: Math.sin(angle) * (TRACK_INNER - 1), z: Math.cos(angle) * (TRACK_INNER - 1) },
        outer: { x: Math.sin(angle) * (TRACK_OUTER + 1), z: Math.cos(angle) * (TRACK_OUTER + 1) },
      });
    }
    return posts;
  }, []);

  const trackMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a2e',
    roughness: 0.9,
    metalness: 0.1,
  }), []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <primitive object={groundGeo} />
        <meshStandardMaterial color="#0a0f0a" roughness={1} />
      </mesh>

      {/* Track surface */}
      <mesh position={[0, TRACK_Y, 0]} receiveShadow>
        <primitive object={trackGeo} />
        <primitive object={trackMaterial} />
      </mesh>

      {/* Start/finish line */}
      <mesh position={[0, 0.005, (TRACK_INNER + TRACK_OUTER) / 2]} receiveShadow>
        <primitive object={startLineGeo} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>

      {/* Checkered start line tiles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const tileWidth = (TRACK_OUTER - TRACK_INNER) / 8;
        const x = TRACK_INNER + tileWidth * i + tileWidth / 2 - (TRACK_INNER + TRACK_OUTER) / 2 + (TRACK_INNER + TRACK_OUTER) / 2 - (TRACK_OUTER - TRACK_INNER) / 2 + i * tileWidth + tileWidth / 2;
        const correctedX = TRACK_INNER + tileWidth * (i + 0.5) - (TRACK_INNER + TRACK_OUTER) / 2;
        return (
          <mesh key={i} position={[correctedX, 0.006, midRadius]} receiveShadow>
            <boxGeometry args={[tileWidth - 0.05, 0.01, 0.6]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#ffffff' : '#000000'} emissive={i % 2 === 0 ? '#ffffff' : '#000000'} emissiveIntensity={0.2} />
          </mesh>
        );
      })}

      {/* Neon inner edge */}
      <mesh ref={lineRef1}>
        <primitive object={innerTubeGeo} />
        <meshBasicMaterial color="#33ffcc" transparent opacity={0.8} />
      </mesh>

      {/* Neon outer edge */}
      <mesh ref={lineRef2}>
        <primitive object={outerTubeGeo} />
        <meshBasicMaterial color="#33ffcc" transparent opacity={0.8} />
      </mesh>

      {/* Center dashed dividers */}
      {dashLines.map((geo, i) => (
        <mesh key={i}>
          <primitive object={geo} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Inner barrier posts */}
      {barrierPosts.map((post, i) => (
        <group key={i}>
          <mesh position={[post.inner.x, 0.4, post.inner.z]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.8, 6]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#ff3333' : '#ffffff'} emissive={i % 2 === 0 ? '#ff1111' : '#444444'} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[post.outer.x, 0.4, post.outer.z]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.8, 6]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#ff3333' : '#ffffff'} emissive={i % 2 === 0 ? '#ff1111' : '#444444'} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Track point lights */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = (TRACK_INNER + TRACK_OUTER) / 2;
        return (
          <pointLight
            key={i}
            position={[Math.sin(a) * r, 3, Math.cos(a) * r]}
            color="#33ffcc"
            intensity={8}
            distance={18}
            decay={2}
          />
        );
      })}

      {/* Start line light */}
      <pointLight position={[0, 4, midRadius]} color="#ffffff" intensity={15} distance={20} decay={2} />

      {/* Start/finish arch */}
      <StartArch midRadius={midRadius} />
    </group>
  );
}

function StartArch({ midRadius }) {
  const archRef = useRef();
  useFrame(({ clock }) => {
    if (archRef.current) {
      const t = clock.getElapsedTime();
      archRef.current.children.forEach((child, i) => {
        if (child.material) {
          child.material.emissiveIntensity = 0.8 + Math.sin(t * 3 + i) * 0.3;
        }
      });
    }
  });

  return (
    <group ref={archRef} position={[0, 0, midRadius]}>
      {/* Left post */}
      <mesh position={[-(TRACK_OUTER - TRACK_INNER) / 2 - 0.5, 2, 0]} castShadow>
        <boxGeometry args={[0.4, 4, 0.4]} />
        <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={1} />
      </mesh>
      {/* Right post */}
      <mesh position={[(TRACK_OUTER - TRACK_INNER) / 2 + 0.5, 2, 0]} castShadow>
        <boxGeometry args={[0.4, 4, 0.4]} />
        <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={1} />
      </mesh>
      {/* Top bar */}
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[TRACK_OUTER - TRACK_INNER + 1.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#ff3366" emissive="#ff3366" emissiveIntensity={1} />
      </mesh>
      {/* Glow lights */}
      <pointLight position={[0, 4.5, 0]} color="#ff3366" intensity={20} distance={15} decay={2} />
    </group>
  );
}
