import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './GameCanvas.jsx';
import HUD from './HUD.jsx';
import { TOTAL_LAPS } from './physics.js';

export default function GameScreen({ room, myId, socket, gameState, onRestart, onLeave, setRoom, setGameState }) {
  const [localState, setLocalState] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [finishNotices, setFinishNotices] = useState([]);
  const [results, setResults] = useState(null);
  const allPlayersRef = useRef([]);
  const [allPlayersTick, setAllPlayersTick] = useState(0);

  // Sync allPlayersRef with room.players
  useEffect(() => {
    if (room?.players) {
      allPlayersRef.current = room.players.map((p) => ({ ...p }));
    }
  }, [room]);

  const isCountdown = gameState === 'countdown' || (gameState?.phase === undefined && typeof gameState === 'string' && gameState === 'countdown');
  const phase = typeof gameState === 'object' && gameState !== null ? gameState.phase : gameState;
  const startTime = typeof gameState === 'object' ? gameState.startTime : null;
  const isRacing = phase === 'racing';

  // Listen to countdown ticks
  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;

    const onTick = ({ count }) => setCountdown(count);
    const onStarted = ({ startTime: st, room: r }) => {
      setCountdown(null);
      setGameState({ phase: 'racing', startTime: st });
      if (r) setRoom(r);
    };
    const onRoomUpdated = (r) => {
      setRoom(r);
      allPlayersRef.current = r.players.map((p) => ({ ...p }));
      setAllPlayersTick((t) => t + 1);
    };
    const onFinishNotice = ({ id, name, place, time }) => {
      const notice = { id: `${id}-${Date.now()}`, name, place, time };
      setFinishNotices((prev) => [...prev, notice]);
      setTimeout(() => setFinishNotices((prev) => prev.filter((n) => n.id !== notice.id)), 4000);
      // Mark player as finished in allPlayersRef
      const idx = allPlayersRef.current.findIndex((p) => p.id === id);
      if (idx !== -1) allPlayersRef.current[idx] = { ...allPlayersRef.current[idx], finished: true };
    };
    const onRaceComplete = ({ results: r }) => {
      setResults(r);
      setGameState({ phase: 'finished', results: r });
    };
    const onPlayerState = (data) => {
      const idx = allPlayersRef.current.findIndex((p) => p.id === data.id);
      if (idx !== -1) {
        allPlayersRef.current[idx] = { ...allPlayersRef.current[idx], position: data.position, lap: data.lap };
      }
    };

    sock.on('countdown-tick', onTick);
    sock.on('race-started', onStarted);
    sock.on('room-updated', onRoomUpdated);
    sock.on('player-finished-notice', onFinishNotice);
    sock.on('race-complete', onRaceComplete);
    sock.on('player-state', onPlayerState);

    return () => {
      sock.off('countdown-tick', onTick);
      sock.off('race-started', onStarted);
      sock.off('room-updated', onRoomUpdated);
      sock.off('player-finished-notice', onFinishNotice);
      sock.off('race-complete', onRaceComplete);
      sock.off('player-state', onPlayerState);
    };
  }, [socket, setRoom, setGameState]);

  const handleStateUpdate = useCallback((state) => {
    setLocalState(state);
    // Update local player position in allPlayersRef
    const idx = allPlayersRef.current.findIndex((p) => p.id === myId);
    if (idx !== -1) {
      allPlayersRef.current[idx] = {
        ...allPlayersRef.current[idx],
        position: state.position,
        lap: state.lap,
        finished: state.finished,
      };
    }
  }, [myId]);

  const handleFinish = useCallback(() => {
    setLocalState((prev) => prev ? { ...prev, finished: true } : prev);
  }, []);

  const isHost = room?.host === myId;

  // For HUD, merge allPlayersRef with latest localState
  const displayPlayers = allPlayersRef.current.map((p) => {
    if (p.id === myId && localState) {
      return { ...p, position: localState.position, lap: localState.lap, finished: localState.finished };
    }
    return p;
  });

  return (
    <div className="relative w-full h-full" style={{ background: '#000011' }}>
      {/* 3D Canvas */}
      <GameCanvas
        room={room}
        myId={myId}
        socket={socket}
        isRacing={isRacing || phase === 'countdown'}
        onPlayerStateUpdate={handleStateUpdate}
        onFinish={handleFinish}
        allPlayersRef={allPlayersRef}
      />

      {/* HUD overlay */}
      <HUD
        myState={localState}
        allPlayers={displayPlayers}
        myId={myId}
        gamePhase={phase}
        countdownValue={countdown}
        startTime={startTime}
        finishNotices={finishNotices}
      />

      {/* Race Results overlay */}
      {phase === 'finished' && results && (
        <ResultsOverlay
          results={results}
          myId={myId}
          isHost={isHost}
          onRestart={onRestart}
          onLeave={onLeave}
        />
      )}

      {/* Local player finished but not all done */}
      {localState?.finished && phase === 'racing' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center slide-up pointer-events-none">
          <div className="font-orbitron font-black text-5xl text-neon-cyan text-glow-cyan mb-2">
            🏁 FINISHED!
          </div>
          <div className="font-rajdhani text-gray-400 text-xl">Waiting for other racers...</div>
        </div>
      )}

      {/* ESC hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        {/* space intentionally empty for minimal UI */}
      </div>
    </div>
  );
}

function ResultsOverlay({ results, myId, isHost, onRestart, onLeave }) {
  const myResult = results.find((r) => r.id === myId);
  const myPlace = myResult?.place || results.length;

  const placeEmoji = ['🥇', '🥈', '🥉', '🏅', '🏅', '🏅'];
  const placeText = ['1ST PLACE!', '2ND PLACE!', '3RD PLACE!', '4TH', '5TH', '6TH'];

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,10,0.88)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md px-4">
        {/* Title */}
        <div className="text-center mb-6 slide-up">
          <div className="font-orbitron font-black text-6xl mb-2">
            {placeEmoji[myPlace - 1]}
          </div>
          <h2 className="font-orbitron font-black text-4xl text-neon-cyan text-glow-cyan">
            RACE OVER
          </h2>
          <div className="font-orbitron text-xl text-neon-yellow text-glow-yellow mt-1">
            {placeText[myPlace - 1]}
          </div>
        </div>

        {/* Podium results */}
        <div className="glass rounded-2xl p-4 mb-4 slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-xs font-orbitron tracking-widest text-gray-500 mb-3">FINAL STANDINGS</div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={r.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all
                  ${r.id === myId ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'bg-white/5'}`}>
                <span className="text-2xl w-8 text-center">{placeEmoji[i]}</span>
                <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: r.color }} />
                <div className="flex-1">
                  <div className="font-rajdhani font-bold text-lg text-white">
                    {r.name}
                    {r.id === myId && <span className="ml-2 text-xs text-neon-cyan font-orbitron">(YOU)</span>}
                  </div>
                </div>
                {r.finishTime ? (
                  <div className="font-orbitron text-sm text-gray-400">
                    {formatRelTime(r.finishTime, results[0].finishTime, i)}
                  </div>
                ) : (
                  <div className="font-orbitron text-xs text-gray-600">DNF</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 slide-up" style={{ animationDelay: '0.2s' }}>
          {isHost && (
            <button
              onClick={onRestart}
              className="w-full py-4 rounded-xl font-orbitron font-bold text-sm tracking-widest
                bg-gradient-to-r from-neon-pink to-orange-500 text-white
                transition-all duration-200 hover:scale-105 active:scale-95
                hover:shadow-[0_0_30px_rgba(255,51,102,0.4)]"
            >
              🔄 RACE AGAIN
            </button>
          )}
          {!isHost && (
            <div className="w-full py-3 rounded-xl glass border border-white/10 text-center
              font-orbitron text-sm tracking-widest text-gray-500">
              ⏳ Waiting for host to restart...
            </div>
          )}
          <button
            onClick={onLeave}
            className="w-full py-3 rounded-xl font-orbitron text-xs tracking-widest
              border border-white/10 text-gray-500 hover:border-red-500/40 hover:text-red-400
              transition-all duration-200"
          >
            LEAVE RACE
          </button>
        </div>
      </div>
    </div>
  );
}

function formatRelTime(time, winnerTime, place) {
  if (place === 0) return '🏆 Winner';
  const diff = ((time - winnerTime) / 1000).toFixed(1);
  return `+${diff}s`;
}
