import { useState } from 'react';

const PLACE_LABELS = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'];
const MIN_PLAYERS = 1;

export default function LobbyScreen({ room, myId, connected, onStart, onLeave }) {
  const [copied, setCopied] = useState(false);
  if (!room) return null;

  const isHost = room.host === myId;
  const canStart = room.players.length >= MIN_PLAYERS;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="scanline w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0a0a25 0%, #000008 70%)' }}>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{
        backgroundImage: 'linear-gradient(rgba(51,255,204,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(51,255,204,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 w-full max-w-lg px-4">
        {/* Header */}
        <div className="text-center mb-8 slide-up">
          <div className="text-xs font-orbitron tracking-[0.4em] text-neon-cyan/60 mb-1">RACE LOBBY</div>
          <h1 className="font-orbitron font-black text-4xl text-white">
            STARTING GRID
          </h1>
        </div>

        {/* Room Code */}
        <div className="glass rounded-2xl p-6 mb-4 slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-xs font-orbitron tracking-[0.3em] text-gray-500 mb-3">ROOM CODE — SHARE WITH FRIENDS</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-black/50 rounded-xl border border-neon-cyan/30 py-4 px-6 text-center">
              <span className="font-orbitron font-black text-4xl tracking-[0.4em] text-neon-cyan text-glow-cyan">
                {room.code}
              </span>
            </div>
            <button
              onClick={copyCode}
              className={`px-5 py-4 rounded-xl font-orbitron text-xs tracking-widest border transition-all duration-200
                ${copied
                  ? 'border-green-400 text-green-400 bg-green-400/10'
                  : 'border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10'
                }`}
            >
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="glass rounded-2xl p-6 mb-4 slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-orbitron tracking-widest text-gray-400">
              DRIVERS — {room.players.length}/6
            </span>
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${i < room.players.length ? 'bg-neon-cyan' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {room.players.map((player, i) => (
              <div key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all
                  ${player.id === myId ? 'bg-neon-cyan/10 border border-neon-cyan/30' : 'bg-white/5'}`}>
                <div className="font-orbitron text-xs text-gray-500 w-6">{PLACE_LABELS[i]}</div>
                <div className="w-3 h-8 rounded-sm" style={{ backgroundColor: player.color }} />
                <div className="flex-1">
                  <div className="font-rajdhani font-bold text-lg text-white leading-tight">
                    {player.name}
                    {player.id === myId && <span className="ml-2 text-xs text-neon-cyan font-orbitron">(YOU)</span>}
                  </div>
                  {player.id === room.host && (
                    <div className="text-xs text-yellow-400 font-orbitron">⭐ HOST</div>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            ))}

            {room.players.length < 6 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10">
                <div className="font-orbitron text-xs text-gray-600 w-6">{PLACE_LABELS[room.players.length]}</div>
                <div className="flex-1 text-gray-600 font-rajdhani text-sm">Waiting for player...</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 slide-up" style={{ animationDelay: '0.15s' }}>
          {isHost ? (
            <button
              onClick={onStart}
              disabled={!canStart || !connected}
              className="w-full py-4 rounded-xl font-orbitron font-bold text-sm tracking-widest
                bg-gradient-to-r from-neon-pink to-orange-500 text-white
                transition-all duration-200 hover:scale-105 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                hover:shadow-[0_0_40px_rgba(255,51,102,0.5)]"
            >
              {canStart ? '🚦 START RACE' : '⏳ WAITING FOR PLAYERS...'}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl glass border border-neon-cyan/20 text-center
              font-orbitron text-sm tracking-widest text-gray-400">
              ⏳ WAITING FOR HOST TO START...
            </div>
          )}

          <button
            onClick={onLeave}
            className="w-full py-3 rounded-xl font-orbitron text-xs tracking-widest
              border border-white/10 text-gray-500 hover:border-red-500/40 hover:text-red-400
              transition-all duration-200"
          >
            LEAVE LOBBY
          </button>
        </div>
      </div>

      {/* Connection dot */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-orbitron">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-cyan animate-pulse' : 'bg-red-500'}`} />
        <span className={connected ? 'text-neon-cyan' : 'text-red-400'}>
          {connected ? 'LIVE' : 'RECONNECTING'}
        </span>
      </div>
    </div>
  );
}
