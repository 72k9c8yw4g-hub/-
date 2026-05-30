import { useState, useEffect } from 'react';
import { getSpeedKPH, TOTAL_LAPS, TRACK_INNER, TRACK_OUTER } from './physics.js';

const PLACE_SUFFIX = ['ST', 'ND', 'RD', 'TH', 'TH', 'TH'];

export default function HUD({
  myState,
  allPlayers,
  myId,
  gamePhase,
  countdownValue,
  startTime,
  onFinish,
  finishNotices,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (gamePhase !== 'racing' || !startTime) return;
    const interval = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(interval);
  }, [gamePhase, startTime]);

  if (!myState) return null;

  const speedKPH = getSpeedKPH(myState.speed);
  const lap = myState.lap;

  const sortedPlayers = [...allPlayers].sort((a, b) => {
    if (b.lap !== a.lap) return b.lap - a.lap;
    return 0;
  });
  const myPosition = sortedPlayers.findIndex((p) => p.id === myId) + 1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Countdown overlay */}
      {gamePhase === 'countdown' && countdownValue !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center countdown-pop" key={countdownValue}>
            <div className="font-orbitron font-black text-9xl text-neon-cyan text-glow-cyan"
              style={{ textShadow: '0 0 40px #33ffcc, 0 0 80px #33ffcc' }}>
              {countdownValue === 0 ? 'GO!' : countdownValue}
            </div>
          </div>
        </div>
      )}

      {/* Speed gauge — bottom left */}
      <div className="absolute bottom-6 left-6">
        <div className="glass-dark rounded-2xl p-4 min-w-[130px]">
          <div className="text-xs font-orbitron tracking-widest text-gray-500 mb-1">SPEED</div>
          <div className="font-orbitron font-black text-4xl text-neon-cyan text-glow-cyan leading-none">
            {speedKPH}
          </div>
          <div className="text-xs font-orbitron text-gray-500 mt-0.5">KM/H</div>
          <SpeedBar speed={myState.speed} maxSpeed={28} />
        </div>
      </div>

      {/* Lap counter — top center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <div className="glass-dark rounded-2xl px-8 py-3 text-center">
          <div className="text-xs font-orbitron tracking-widest text-gray-500 mb-1">LAP</div>
          <div className="font-orbitron font-black text-3xl text-white leading-none">
            <span className="text-neon-yellow text-glow-yellow">{Math.min(lap, TOTAL_LAPS)}</span>
            <span className="text-gray-600 text-xl"> / {TOTAL_LAPS}</span>
          </div>
        </div>
      </div>

      {/* Position — top left */}
      <div className="absolute top-6 left-6">
        <div className="glass-dark rounded-2xl px-5 py-3 text-center">
          <div className="text-xs font-orbitron tracking-widest text-gray-500 mb-1">POS</div>
          <div className="font-orbitron font-black leading-none">
            <span className="text-4xl text-neon-pink" style={{ textShadow: '0 0 15px #ff3366' }}>
              {myPosition}
            </span>
            <span className="text-lg text-neon-pink">{PLACE_SUFFIX[myPosition - 1]}</span>
          </div>
        </div>
      </div>

      {/* Timer — top right */}
      {gamePhase === 'racing' && startTime && (
        <div className="absolute top-6 right-6">
          <div className="glass-dark rounded-2xl px-5 py-3 text-center">
            <div className="text-xs font-orbitron tracking-widest text-gray-500 mb-1">TIME</div>
            <div className="font-orbitron text-xl text-white">{formatTime(elapsed)}</div>
          </div>
        </div>
      )}

      {/* Player standings — right side */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <div className="glass-dark rounded-xl p-3 min-w-[160px]">
          <div className="text-xs font-orbitron tracking-widest text-gray-500 mb-2">STANDINGS</div>
          <div className="space-y-1.5">
            {sortedPlayers.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all
                ${p.id === myId ? 'bg-white/10' : ''}`}>
                <span className="font-orbitron text-xs text-gray-500 w-4">{i + 1}</span>
                <div className="w-2 h-4 rounded-sm" style={{ backgroundColor: p.color }} />
                <span className={`font-rajdhani text-sm font-bold flex-1 truncate ${p.id === myId ? 'text-neon-cyan' : 'text-gray-300'}`}>
                  {p.name}
                </span>
                <span className="font-orbitron text-xs text-gray-500">L{p.lap}</span>
                {p.finished && <span className="text-yellow-400 text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Minimap — bottom right */}
      <Minimap allPlayers={allPlayers} myId={myId} myState={myState} />

      {/* Finish notices */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 space-y-2">
        {finishNotices.map((n) => (
          <div key={n.id} className="glass-dark rounded-xl px-6 py-3 text-center slide-up">
            <span className="font-orbitron text-sm text-neon-yellow">
              🏁 {n.name} finished {n.place === 1 ? '1st' : n.place === 2 ? '2nd' : n.place === 3 ? '3rd' : `${n.place}th`}!
            </span>
          </div>
        ))}
      </div>

      {/* Controls hint (bottom center) */}
      {gamePhase === 'countdown' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="glass-dark rounded-full px-6 py-2 text-xs font-orbitron text-gray-500 tracking-wider">
            W/↑ Accelerate  •  S/↓ Brake  •  A/D or ←/→ Steer
          </div>
        </div>
      )}
    </div>
  );
}

function SpeedBar({ speed, maxSpeed }) {
  const pct = Math.min(100, (Math.abs(speed) / maxSpeed) * 100);
  const hue = 160 - pct * 1.2; // cyan to yellow to red
  return (
    <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-100"
        style={{ width: `${pct}%`, backgroundColor: `hsl(${hue}, 100%, 60%)`, boxShadow: `0 0 6px hsl(${hue}, 100%, 60%)` }}
      />
    </div>
  );
}

function Minimap({ allPlayers, myId, myState }) {
  const SIZE = 110;
  const SCALE = SIZE / 2 / 28; // 28 = outer radius + margin

  return (
    <div className="absolute bottom-6 right-6">
      <div className="glass-dark rounded-2xl p-2" style={{ width: SIZE + 16, height: SIZE + 16 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Track rings */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={25 * SCALE} fill="none" stroke="#33ffcc" strokeWidth="1.5" opacity="0.3" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={15 * SCALE} fill="none" stroke="#33ffcc" strokeWidth="1.5" opacity="0.3" />
          {/* Track fill */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={25 * SCALE} fill="rgba(26,26,46,0.8)" />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={15 * SCALE} fill="rgba(0,0,10,0.8)" />

          {/* Start/finish line */}
          <line
            x1={SIZE / 2 - 3} y1={SIZE / 2 + 15 * SCALE}
            x2={SIZE / 2 - 3} y2={SIZE / 2 + 25 * SCALE}
            stroke="#ffffff" strokeWidth="1.5"
          />

          {/* Players */}
          {allPlayers.map((p) => {
            const px = SIZE / 2 + p.position.x * SCALE;
            const py = SIZE / 2 + p.position.z * SCALE;
            const isMe = p.id === myId;
            return (
              <g key={p.id}>
                <circle cx={px} cy={py} r={isMe ? 4 : 3} fill={p.color} opacity={isMe ? 1 : 0.8} />
                {isMe && <circle cx={px} cy={py} r={6} fill="none" stroke={p.color} strokeWidth="1" opacity="0.5" />}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const tenth = Math.floor((ms % 1000) / 100);
  return `${m}:${String(sec).padStart(2, '0')}.${tenth}`;
}
