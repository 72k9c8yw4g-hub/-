import { useState, useEffect, useRef } from 'react';

export default function HomeScreen({ connected, onCreate, onJoin, socket }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;
    const onError = ({ message }) => { setError(message); setLoading(false); };
    sock.on('room-error', onError);
    return () => sock.off('room-error', onError);
  }, [socket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    setError('');
    setLoading(true);
    if (mode === 'create') {
      onCreate(playerName.trim());
    } else {
      if (!joinCode.trim() || joinCode.trim().length !== 6) {
        setError('Enter a valid 6-character room code');
        setLoading(false);
        return;
      }
      onJoin(playerName.trim(), joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="scanline w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center bottom, #0d0d2b 0%, #000008 60%)' }}>

      {/* Animated grid floor */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(51,255,204,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(51,255,204,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        perspective: '500px',
        transform: 'rotateX(60deg) scale(3) translateY(30%)',
        transformOrigin: 'center bottom',
      }} />

      {/* Stars */}
      <Stars />

      {/* Logo */}
      <div className="relative z-10 text-center mb-12 slide-up float">
        <div className="text-xs font-orbitron tracking-[0.4em] text-neon-cyan mb-2 opacity-70">
          MULTIPLAYER 3D RACING
        </div>
        <h1 className="font-orbitron font-black text-7xl md:text-8xl leading-none"
          style={{ WebkitTextStroke: '2px transparent',
            background: 'linear-gradient(135deg, #ff3366 0%, #ff6600 30%, #ffcc00 60%, #33ffcc 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(255,51,102,0.5))',
          }}>
          NEON<br />RACER
        </h1>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-neon-cyan" />
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-neon-cyan" />
        </div>
      </div>

      {/* Connection status */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-orbitron">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-cyan animate-pulse' : 'bg-red-500'}`} />
        <span className={connected ? 'text-neon-cyan' : 'text-red-400'}>
          {connected ? 'CONNECTED' : 'CONNECTING...'}
        </span>
      </div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md px-4">
        {!mode ? (
          <div className="glass rounded-2xl p-8 slide-up" style={{ animationDelay: '0.1s' }}>
            <p className="text-center text-gray-400 font-rajdhani text-lg mb-8">
              Race against friends in real-time. Create a room or join with a code.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full py-4 rounded-xl font-orbitron font-bold text-sm tracking-widest
                  bg-gradient-to-r from-neon-pink to-orange-500 text-white
                  transition-all duration-200 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,51,102,0.5)]
                  active:scale-95 pulse-glow"
                style={{ '--tw-shadow-color': '#ff3366' }}
              >
                ⚡ CREATE RACE
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full py-4 rounded-xl font-orbitron font-bold text-sm tracking-widest
                  border border-neon-cyan text-neon-cyan
                  transition-all duration-200 hover:scale-105 hover:bg-neon-cyan hover:text-black
                  hover:shadow-[0_0_30px_rgba(51,255,204,0.4)] active:scale-95"
              >
                🏁 JOIN RACE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 slide-up">
            <button
              type="button"
              onClick={() => { setMode(null); setError(''); setLoading(false); }}
              className="flex items-center gap-2 text-gray-400 hover:text-neon-cyan text-sm font-rajdhani mb-6 transition-colors"
            >
              ← Back
            </button>

            <h2 className="font-orbitron font-bold text-xl text-neon-cyan mb-6 text-glow-cyan">
              {mode === 'create' ? '⚡ CREATE RACE' : '🏁 JOIN RACE'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-orbitron tracking-widest text-gray-400 mb-2">
                  DRIVER NAME
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={16}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3
                    text-white font-rajdhani text-lg focus:outline-none focus:border-neon-cyan
                    transition-colors placeholder-gray-600"
                  autoFocus
                />
              </div>

              {mode === 'join' && (
                <div>
                  <label className="block text-xs font-orbitron tracking-widest text-gray-400 mb-2">
                    ROOM CODE
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3
                      text-neon-cyan font-orbitron text-2xl tracking-[0.3em] text-center
                      focus:outline-none focus:border-neon-cyan transition-colors placeholder-gray-700"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-rajdhani bg-red-500/10 rounded-lg px-4 py-2 border border-red-500/20">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !connected}
                className="w-full py-4 rounded-xl font-orbitron font-bold text-sm tracking-widest
                  bg-gradient-to-r from-neon-cyan to-neon-blue text-black
                  transition-all duration-200 hover:scale-105 active:scale-95
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                  hover:shadow-[0_0_30px_rgba(51,255,204,0.4)]"
              >
                {loading ? '⏳ CONNECTING...' : mode === 'create' ? '⚡ CREATE ROOM' : '🏁 JOIN NOW'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="glass-dark rounded-full px-6 py-2 text-xs font-rajdhani text-gray-500 flex items-center gap-4">
          <span>🕹️ WASD / Arrow Keys to drive</span>
          <span>•</span>
          <span>3 Laps to win</span>
          <span>•</span>
          <span>Up to 6 players</span>
        </div>
      </div>
    </div>
  );
}

function Stars() {
  const starCount = 80;
  const stars = Array.from({ length: starCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.6 + 0.1,
    delay: Math.random() * 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${2 + s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
