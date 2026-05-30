import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Billboard as DreiB, Text } from '@react-three/drei';
import * as THREE from 'three';
import Track from './Track.jsx';
import { updateCar, interpolateState, createCarState } from './physics.js';

const SEND_RATE = 1000 / 30; // 30 updates/sec

// Input tracking hook
function useInput() {
  const keys = useRef({});
  useEffect(() => {
    const down = (e) => {
      keys.current[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    };
    const up = (e) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);
  return keys;
}

// Main game logic component inside Canvas
function GameLogic({ myId, room, socket, isRacing, onStateUpdate, onFinish }) {
  const keys = useInput();
  const localState = useRef(null);
  const remoteStates = useRef({});
  const lastSendTime = useRef(0);
  const finished = useRef(false);

  // Initialize local car state from room data
  useEffect(() => {
    if (!room) return;
    const myPlayer = room.players.find((p) => p.id === myId);
    if (myPlayer) {
      localState.current = createCarState(myPlayer.position, myPlayer.rotation);
      finished.current = false;
    }
    // Initialize remote states
    room.players.filter((p) => p.id !== myId).forEach((p) => {
      remoteStates.current[p.id] = createCarState(p.position, p.rotation);
    });
  }, [room?.code, myId]);

  // Handle incoming player state updates
  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;

    const onPlayerState = (data) => {
      remoteStates.current[data.id] = data;
    };
    const onPlayerLeft = () => {
      // Room update handles removal
    };
    sock.on('player-state', onPlayerState);
    return () => sock.off('player-state', onPlayerState);
  }, [socket]);

  useFrame((_, delta) => {
    if (!isRacing || !localState.current || finished.current) return;

    const input = {
      forward: keys.current['KeyW'] || keys.current['ArrowUp'],
      brake: keys.current['KeyS'] || keys.current['ArrowDown'],
      left: keys.current['KeyA'] || keys.current['ArrowLeft'],
      right: keys.current['KeyD'] || keys.current['ArrowRight'],
    };

    const prev = localState.current;
    const next = updateCar(prev, input, delta);
    localState.current = next;

    // Send update to server
    const now = Date.now();
    if (now - lastSendTime.current > SEND_RATE && socket?.current) {
      lastSendTime.current = now;
      socket.current.emit('player-update', {
        position: next.position,
        rotation: next.rotation,
        speed: next.speed,
        lap: next.lap,
        checkpoint: next.checkpoint,
      });
    }

    // Check finish
    if (next.finished && !finished.current) {
      finished.current = true;
      const time = next.finishTime - (Date.now() - (next.finishTime - Date.now() + Date.now())); // ms since start
      if (socket?.current) socket.current.emit('player-finished', { time: Date.now() });
      onFinish?.();
    }

    onStateUpdate?.(next);
  });

  return null;
}

// Camera that follows local car
function FollowCamera({ targetRef }) {
  const { camera } = useThree();
  const smoothPos = useRef(new THREE.Vector3());
  const smoothLook = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!targetRef.current) return;
    const pos = targetRef.current;
    const rot = targetRef.current.rotation || 0;

    const offset = new THREE.Vector3(
      Math.sin(rot) * -6,
      3.5,
      Math.cos(rot) * -6
    );
    const desired = new THREE.Vector3(pos.x, pos.y, pos.z).add(offset);
    smoothPos.current.lerp(desired, 0.08);

    const lookAt = new THREE.Vector3(pos.x, pos.y + 0.5, pos.z);
    smoothLook.current.lerp(lookAt, 0.1);

    camera.position.copy(smoothPos.current);
    camera.lookAt(smoothLook.current);
  });

  return null;
}

// Component that renders game scene
function Scene({ myId, room, socket, isRacing, onStateUpdate, onFinish, localStateRef, allPlayersRef }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight color="#112244" intensity={0.4} />
      <directionalLight position={[50, 80, 30]} color="#8899ff" intensity={0.6} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={200} shadow-camera-left={-80}
        shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80} />

      {/* Starfield */}
      <Stars radius={200} depth={60} count={4000} factor={4} saturation={0.3} fade speed={0.5} />

      {/* Track */}
      <Track />

      {/* Game logic (invisible) */}
      <GameLogic
        myId={myId}
        room={room}
        socket={socket}
        isRacing={isRacing}
        onStateUpdate={onStateUpdate}
        onFinish={onFinish}
      />

      {/* Remote cars */}
      <RemoteCars myId={myId} room={room} socket={socket} allPlayersRef={allPlayersRef} />

      {/* Local car */}
      <LocalCar myId={myId} room={room} localStateRef={localStateRef} />
    </>
  );
}

// Local player car
function LocalCar({ myId, room, localStateRef }) {
  const posRef = useRef({ x: 0, y: 0.5, z: 22 });
  const rotRef = useRef(Math.PI / 2);
  const speedRef = useRef(0);

  // Attach target for camera
  const targetRef = useRef({ x: 0, y: 0.5, z: 22, rotation: Math.PI / 2 });

  const myPlayer = room?.players.find((p) => p.id === myId);
  const color = myPlayer?.color || '#33ffcc';

  useFrame(() => {
    if (!localStateRef.current) return;
    const s = localStateRef.current;
    posRef.current = s.position;
    rotRef.current = s.rotation;
    speedRef.current = s.speed;
    targetRef.current = { ...s.position, rotation: s.rotation };
  });

  return (
    <>
      <CarRenderer posRef={posRef} rotRef={rotRef} speedRef={speedRef} color={color} isLocal />
      <FollowCamera targetRef={targetRef} />
    </>
  );
}

function CarRenderer({ posRef, rotRef, speedRef, color, isLocal, name }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const wheelGroupRefs = [useRef(), useRef(), useRef(), useRef()];

  useFrame(() => {
    if (!groupRef.current) return;
    const pos = posRef.current;
    const rot = rotRef.current ?? Math.PI / 2;
    const spd = speedRef.current ?? 0;
    groupRef.current.position.set(pos.x, pos.y, pos.z);
    groupRef.current.rotation.y = rot;
    // wheel spin
    wheelGroupRefs.forEach((r) => {
      if (r.current) r.current.rotation.x -= spd * 0.015 * 0.016 * 60;
    });
  });

  const carColor = useMemo(() => new THREE.Color(color), [color]);
  const emissiveColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.4), [color]);

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.9, 0.32, 1.8]} />
          <meshStandardMaterial color={carColor} emissive={emissiveColor} emissiveIntensity={0.6} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.5, -0.1]} castShadow>
          <boxGeometry args={[0.7, 0.28, 0.9]} />
          <meshStandardMaterial color={carColor} emissive={emissiveColor} emissiveIntensity={0.4} roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.48, 0.36]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.62, 0.22, 0.05]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.5} emissive="#88ccff" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.08, 0.95]} castShadow>
          <boxGeometry args={[1.0, 0.06, 0.12]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, -0.88]} castShadow>
          <boxGeometry args={[0.85, 0.08, 0.06]} />
          <meshStandardMaterial color={carColor} emissive={emissiveColor} emissiveIntensity={0.5} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[-0.28, 0.52, -0.88]}><boxGeometry args={[0.05, 0.22, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[0.28, 0.52, -0.88]}><boxGeometry args={[0.05, 0.22, 0.05]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[-0.28, 0.22, 0.91]}>
          <boxGeometry args={[0.18, 0.1, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.28, 0.22, 0.91]}>
          <boxGeometry args={[0.18, 0.1, 0.04]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.3, 0.22, -0.91]}>
          <boxGeometry args={[0.14, 0.1, 0.04]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0.3, 0.22, -0.91]}>
          <boxGeometry args={[0.14, 0.1, 0.04]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.85, 0.02, 1.7]} />
          <meshStandardMaterial color={carColor} emissive={carColor} emissiveIntensity={1.5} transparent opacity={0.8} />
        </mesh>
      </group>
      {[[-0.52, 0, 0.62], [0.52, 0, 0.62], [-0.52, 0, -0.62], [0.52, 0, -0.62]].map((pos, i) => (
        <group key={i} ref={wheelGroupRefs[i]} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 12]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.2, 6]} />
            <meshStandardMaterial color={carColor} emissive={emissiveColor} emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 0.22, 1.1]} color="#ffffff" intensity={isLocal ? 20 : 5} distance={12} decay={2} />
      <pointLight position={[0, -0.1, 0]} color={color} intensity={3} distance={5} decay={2} />
      {!isLocal && name && (
        <DreiB position={[0, 1.8, 0]}>
          <Text fontSize={0.35} color={color} anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000">
            {name}
          </Text>
        </DreiB>
      )}
    </group>
  );
}

// Remote player cars (handles interpolation)
function RemoteCars({ myId, room, socket, allPlayersRef }) {
  const statesRef = useRef({});

  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;
    const handler = (data) => { statesRef.current[data.id] = data; };
    sock.on('player-state', handler);
    return () => sock.off('player-state', handler);
  }, [socket]);

  // Initialize from room
  useEffect(() => {
    if (!room) return;
    room.players.filter((p) => p.id !== myId).forEach((p) => {
      if (!statesRef.current[p.id]) {
        statesRef.current[p.id] = { position: p.position, rotation: p.rotation, speed: 0, lap: 1 };
      }
    });
  }, [room, myId]);

  const remotePlayers = room?.players.filter((p) => p.id !== myId) || [];

  return (
    <>
      {remotePlayers.map((player) => (
        <RemoteCarWrapper
          key={player.id}
          playerId={player.id}
          color={player.color}
          name={player.name}
          statesRef={statesRef}
          allPlayersRef={allPlayersRef}
        />
      ))}
    </>
  );
}

function RemoteCarWrapper({ playerId, color, name, statesRef, allPlayersRef }) {
  const smoothRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0.5, z: 22 });
  const rotRef = useRef(Math.PI / 2);
  const speedRef = useRef(0);

  useFrame(() => {
    const target = statesRef.current[playerId];
    if (!target) return;
    smoothRef.current = interpolateState(smoothRef.current, target, 0.18);
    if (smoothRef.current) {
      posRef.current = smoothRef.current.position;
      rotRef.current = smoothRef.current.rotation;
      speedRef.current = smoothRef.current.speed ?? 0;
      if (allPlayersRef?.current) {
        const idx = allPlayersRef.current.findIndex((p) => p.id === playerId);
        if (idx !== -1) {
          allPlayersRef.current[idx] = { ...allPlayersRef.current[idx], position: smoothRef.current.position, lap: target.lap };
        }
      }
    }
  });

  return <CarRenderer posRef={posRef} rotRef={rotRef} speedRef={speedRef} color={color} isLocal={false} name={name} />;
}

// The exported component
export default function GameCanvas({ room, myId, socket, isRacing, onPlayerStateUpdate, onFinish, allPlayersRef }) {
  const localStateRef = useRef(null);

  const handleStateUpdate = useCallback((state) => {
    localStateRef.current = state;
    onPlayerStateUpdate?.(state);
    // Update allPlayersRef for the local player HUD data
    if (allPlayersRef?.current) {
      const idx = allPlayersRef.current.findIndex((p) => p.id === myId);
      if (idx !== -1) {
        allPlayersRef.current[idx] = { ...allPlayersRef.current[idx], position: state.position, lap: state.lap };
      }
    }
  }, [onPlayerStateUpdate, allPlayersRef, myId]);

  return (
    <Canvas
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      camera={{ fov: 65, near: 0.1, far: 500, position: [0, 8, 30] }}
      style={{ background: '#000011' }}
    >
      <Scene
        myId={myId}
        room={room}
        socket={socket}
        isRacing={isRacing}
        onStateUpdate={handleStateUpdate}
        onFinish={onFinish}
        localStateRef={localStateRef}
        allPlayersRef={allPlayersRef}
      />
    </Canvas>
  );
}
