import { useEffect, useRef, useState } from 'react';

/* ── Bokeh particle field ─────────────────────────────────────── */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const N = 55;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight,
      r: 2 + Math.random() * 18,
      speed: 0.18 + Math.random() * 0.42,
      opacity: 0.04 + Math.random() * 0.18,
      drift: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(180,215,255,${p.opacity})`);
        g.addColorStop(0.5, `rgba(140,190,255,${p.opacity * 0.4})`);
        g.addColorStop(1, `rgba(100,160,255,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.y -= p.speed;
        p.x += p.drift;
        if (p.y + p.r < 0) {
          p.y = H + p.r;
          p.x = Math.random() * W;
        }
        if (p.x < -p.r) p.x = W + p.r;
        if (p.x > W + p.r) p.x = -p.r;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}

/* ── Expanding ring ───────────────────────────────────────────── */
function Ring({ delay }) {
  return (
    <div style={{
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: '50%',
      border: '1px solid rgba(160,200,255,0.35)',
      boxShadow: '0 0 12px rgba(130,180,255,0.15)',
      animation: `sp-ring-expand 4.5s cubic-bezier(0.1,0.4,0.6,1) ${delay}s infinite`,
      pointerEvents: 'none',
    }} />
  );
}

/* ── Scan line ────────────────────────────────────────────────── */
function ScanLine() {
  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      background: 'linear-gradient(90deg, transparent 0%, rgba(160,210,255,0.08) 15%, rgba(200,230,255,0.45) 50%, rgba(160,210,255,0.08) 85%, transparent 100%)',
      boxShadow: '0 0 16px rgba(150,200,255,0.3)',
      animation: 'sp-scan 4.8s ease-in-out 1.2s infinite',
      pointerEvents: 'none',
    }} />
  );
}

/* ── Main splash screen ───────────────────────────────────────── */
export default function SplashScreen({ onDone }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 4200);
    const t2 = setTimeout(() => onDone?.(), 4900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 9999,
        animation: exiting ? 'sp-out 0.7s cubic-bezier(0.4,0,1,1) both' : 'sp-in 0.4s ease both',
      }}
    >
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(30,50,90,0.55) 0%, rgba(10,18,35,0.80) 55%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Very subtle horizontal light band */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        height: '28vh',
        background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(80,130,220,0.06) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      <Particles />

      {/* Expansion rings */}
      <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, pointerEvents: 'none' }}>
        <Ring delay={0.5} />
        <Ring delay={1.5} />
        <Ring delay={2.5} />
      </div>

      <ScanLine />

      {/* Content wrapper — overflow:hidden clips wide letter-spacing */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.2rem',
        width: '100vw',
        overflow: 'hidden',
        padding: '0 8px',
      }}>

        {/* ── FUDA — glass/crystal logo ── */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(80px, 22vw, 132px)',
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '0.10em',
          background: `linear-gradient(
            168deg,
            rgba(255,255,255,0.97)  0%,
            rgba(195,220,255,0.82) 10%,
            rgba(255,255,255,0.60) 20%,
            rgba(28,38,58,0.88)    30%,
            rgba(175,210,252,0.65) 40%,
            rgba(255,255,255,0.93) 52%,
            rgba(38,52,80,0.75)    62%,
            rgba(200,222,255,0.68) 72%,
            rgba(255,255,255,0.90) 84%,
            rgba(178,206,248,0.76) 92%,
            rgba(255,255,255,0.88) 100%
          )`,
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 24px rgba(160,205,255,0.42)) drop-shadow(0 8px 40px rgba(0,0,0,0.88))',
          animation: 'sp-emerge 1.5s cubic-bezier(0.16,1,0.3,1) 0.5s both, sp-float 9s ease-in-out 2.3s infinite, sp-reflect 5s linear 3s infinite',
          willChange: 'transform, opacity, letter-spacing, background-position',
          userSelect: 'none',
        }}>
          FUDA
        </div>

        {/* Thin divider line */}
        <div style={{
          width: 'clamp(60px,12vw,90px)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(160,200,255,0.5), transparent)',
          animation: 'sp-sub 0.6s ease 2.1s both',
        }} />

        {/* IxyPixy wordmark */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(11px,2.4vw,15px)',
          fontWeight: 500,
          letterSpacing: '0.30em',
          textTransform: 'uppercase',
          color: 'rgba(160,200,255,0.70)',
          animation: 'sp-sub 0.8s ease 2.4s both',
          userSelect: 'none',
        }}>
          IxyPixy
        </div>

        {/* Japanese subtitle */}
        <div style={{
          fontFamily: 'var(--font-ja)',
          fontSize: 'clamp(9px,1.8vw,11px)',
          color: 'rgba(140,175,230,0.40)',
          letterSpacing: '0.18em',
          animation: 'sp-sub 0.8s ease 2.7s both',
          userSelect: 'none',
        }}>
          ポケカ 取引管理
        </div>
      </div>

      {/* Film grain overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E")`,
        pointerEvents: 'none',
        opacity: 0.6,
      }} />
    </div>
  );
}
