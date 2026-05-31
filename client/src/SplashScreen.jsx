import { useEffect, useState } from 'react';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 5.3) % 84}%`,
  top:  `${20 + (i * 7.1) % 60}%`,
  delay: `${(i * 0.17) % 2.4}s`,
  size:  i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
  color: ['#a78bfa','#60a5fa','#f0abfc','#34d399','#fbbf24'][i % 5],
}));

export default function SplashScreen({ onDone }) {
  const [out, setOut] = useState(false);

  const dismiss = () => {
    if (out) return;
    setOut(true);
    setTimeout(onDone, 520);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={dismiss}
      className={out ? 'splash-out' : ''}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', userSelect: 'none',
        background: 'radial-gradient(ellipse 120% 80% at 50% 40%, #1a0533 0%, #050510 60%, #000008 100%)',
        animation: 'splash-bg-in 0.3s ease both',
        overflow: 'hidden',
      }}>

      {/* Ambient glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse 60% 40% at 30% 40%, rgba(99,60,180,0.25) 0%, transparent 70%),' +
          'radial-gradient(ellipse 50% 35% at 70% 60%, rgba(14,100,200,0.2) 0%, transparent 70%),' +
          'radial-gradient(ellipse 40% 30% at 50% 20%, rgba(200,60,180,0.15) 0%, transparent 70%)',
      }} />

      {/* Particles */}
      {PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left, top: p.top,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          animation: `splash-particle ${1.8 + (p.id % 4) * 0.4}s ${p.delay} ease-in-out infinite`,
        }} />
      ))}

      {/* IxyPixy logo */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(52px, 15vw, 88px)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
        background: 'linear-gradient(120deg, #c084fc 0%, #818cf8 30%, #38bdf8 55%, #f0abfc 80%, #c084fc 100%)',
        backgroundSize: '300% 300%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation:
          'splash-logo 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s both,' +
          'splash-glow  2.5s ease 1s infinite,' +
          'splash-shimmer 4s ease 0.15s infinite',
      }}>
        IxyPixy
      </div>

      {/* Divider line */}
      <div style={{
        width: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.6), transparent)',
        marginTop: 16,
        animation: 'splash-sub 0.5s ease 0.9s both',
        animationFillMode: 'both',
      }}
        ref={el => {
          if (el) {
            setTimeout(() => { if (el) el.style.width = '180px'; }, 900);
            el.style.transition = 'width 0.6s cubic-bezier(0.16,1,0.3,1)';
          }
        }}
      />

      {/* FUDA subtitle */}
      <div style={{
        marginTop: 14,
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(22px, 6vw, 32px)',
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'rgba(255,255,255,0.9)',
        animation: 'splash-sub 0.5s ease 1.1s both',
      }}>
        FUDA
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8,
        fontFamily: 'var(--font-ja)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.18em',
        color: 'rgba(192,132,252,0.7)',
        animation: 'splash-sub 0.5s ease 1.4s both',
      }}>
        ポケカ仕入れ判定アプリ
      </div>

      {/* Tap hint */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        fontFamily: 'var(--font-ja)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: '0.1em',
        animation: 'splash-tap 1.8s ease 1.8s infinite, splash-sub 0.4s ease 1.8s both',
      }}>
        タップしてはじめる
      </div>
    </div>
  );
}
