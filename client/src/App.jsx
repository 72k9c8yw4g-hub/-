import { useState, useCallback, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import HomeScreen from './screens/HomeScreen.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import GameScreen from './game/GameScreen.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export default function App() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [screen, setScreen] = useState('home'); // home | lobby | game
  const [room, setRoom] = useState(null);
  const [myId, setMyId] = useState(null);
  const [gameState, setGameState] = useState(null); // countdown | racing | finished

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); setMyId(socket.id); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => console.error('Socket error:', err));

    return () => socket.disconnect();
  }, []);

  // Listen for room updates
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onRoomCreated = ({ room }) => { setRoom(room); setScreen('lobby'); };
    const onRoomJoined = ({ room }) => { setRoom(room); setScreen('lobby'); };
    const onRoomUpdated = (room) => setRoom(room);
    const onRaceCountdown = ({ room }) => { setRoom(room); setScreen('game'); setGameState('countdown'); };
    const onRaceStarted = ({ room, startTime }) => { setRoom(room); setGameState({ phase: 'racing', startTime }); };
    const onRaceComplete = ({ results }) => setGameState({ phase: 'finished', results });
    const onRaceReset = ({ room }) => { setRoom(room); setScreen('lobby'); setGameState(null); };
    const onPlayerLeft = ({ name }) => console.log(`${name} left the race`);

    socket.on('room-created', onRoomCreated);
    socket.on('room-joined', onRoomJoined);
    socket.on('room-updated', onRoomUpdated);
    socket.on('race-countdown', onRaceCountdown);
    socket.on('race-started', onRaceStarted);
    socket.on('race-complete', onRaceComplete);
    socket.on('race-reset', onRaceReset);
    socket.on('player-left', onPlayerLeft);

    return () => {
      socket.off('room-created', onRoomCreated);
      socket.off('room-joined', onRoomJoined);
      socket.off('room-updated', onRoomUpdated);
      socket.off('race-countdown', onRaceCountdown);
      socket.off('race-started', onRaceStarted);
      socket.off('race-complete', onRaceComplete);
      socket.off('race-reset', onRaceReset);
      socket.off('player-left', onPlayerLeft);
    };
  }, []);

  const handleCreate = useCallback((playerName) => {
    if (!socketRef.current) return;
    socketRef.current.emit('create-room', { playerName });
  }, []);

  const handleJoin = useCallback((playerName, code) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join-room', { playerName, code });
  }, []);

  const handleStart = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('start-race');
  }, []);

  const handleRestart = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('restart-race');
  }, []);

  const handleLeave = useCallback(() => {
    setScreen('home');
    setRoom(null);
    setGameState(null);
    if (socketRef.current) {
      socketRef.current.disconnect();
      const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => { setConnected(true); setMyId(socket.id); });
      socket.on('disconnect', () => setConnected(false));
    }
  }, []);

  if (screen === 'home') {
    return (
      <HomeScreen
        connected={connected}
        onCreate={handleCreate}
        onJoin={handleJoin}
        socket={socketRef}
      />
    );
  }

  if (screen === 'lobby') {
    return (
      <LobbyScreen
        room={room}
        myId={myId}
        connected={connected}
        onStart={handleStart}
        onLeave={handleLeave}
      />
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        room={room}
        myId={myId}
        socket={socketRef}
        gameState={gameState}
        onRestart={handleRestart}
        onLeave={handleLeave}
        setRoom={setRoom}
        setGameState={setGameState}
      />
    );
  }

  return null;
}
