import { useEffect, useRef, useState, useCallback } from 'react';

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

    const N = 60;
    const ps = Array.from({ length: N }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight + window.innerHeight * 0.3,
      r: 3 + Math.random() * 22,
      speed: 0.15 + Math.random() * 0.35,
      opacity: 0.03 + Math.random() * 0.16,
      drift: (Math.random() - 0.5) * 0.25,
    }));

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0,   `rgba(180,215,255,${p.opacity})`);
        g.addColorStop(0.5, `rgba(130,185,255,${p.opacity * 0.35})`);
        g.addColorStop(1,   `rgba(80,140,255,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y + p.r < 0)  { p.y = H + p.r; p.x = Math.random() * W; }
        if (p.x < -p.r)       p.x = W + p.r;
        if (p.x > W + p.r)    p.x = -p.r;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />
  );
}

/* ── Expansion ring ───────────────────────────────────────────── */
function Ring({ delay }) {
  return (
    <div style={{
      position: 'absolute',
      width: 100, height: 100,
      borderRadius: '50%',
      border: '1px solid rgba(150,200,255,0.30)',
      boxShadow: '0 0 10px rgba(120,180,255,0.12)',
      animation: `sp-ring-expand 5s cubic-bezier(0.1,0.3,0.6,1) ${delay}s infinite`,
      pointerEvents: 'none',
    }} />
  );
}

/* ── 3D extruded glass FUDA logo ──────────────────────────────── */
const DEPTH_LAYERS = 9;

function Logo3D({ tiltX, tiltY, emerged }) {
  const FONT_STYLE = {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(72px, 20vw, 124px)',
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '0.10em',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    display: 'block',
  };

  const frontGradient = `linear-gradient(
    168deg,
    rgba(255,255,255,0.98)  0%,
    rgba(200,225,255,0.85) 10%,
    rgba(255,255,255,0.62) 20%,
    rgba(22,32,55,0.90)    30%,
    rgba(170,210,252,0.68) 40%,
    rgba(255,255,255,0.95) 52%,
    rgba(35,50,80,0.78)    62%,
    rgba(195,220,255,0.70) 72%,
    rgba(255,255,255,0.92) 84%,
    rgba(175,205,250,0.78) 92%,
    rgba(255,255,255,0.90) 100%
  )`;

  return (
    <div style={{
      position: 'relative',
      transformStyle: 'preserve-3d',
      transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      transition: emerged ? 'transform 0.12s linear' : 'none',
    }}>
      {/* Extrusion layers — back to front, simulate glass depth */}
      {Array.from({ length: DEPTH_LAYERS }, (_, i) => {
        const z = -(i + 1) * 3;
        const t = 1 - i / DEPTH_LAYERS;
        const r = Math.round(30 + t * 60);
        const g = Math.round(55 + t * 80);
        const b = Math.round(110 + t * 90);
        const a = (0.50 + t * 0.25).toFixed(2);
        return (
          <div key={i} style={{
            ...FONT_STYLE,
            position: 'absolute',
            top: 0, left: 0,
            transform: `translateZ(${z}px)`,
            background: `rgba(${r},${g},${b},${a})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: `blur(${i * 0.2}px)`,
          }}>FUDA</div>
        );
      })}

      {/* Front face — glass gradient */}
      <div style={{
        ...FONT_STYLE,
        position: 'relative',
        transform: 'translateZ(0px)',
        background: frontGradient,
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 28px rgba(150,200,255,0.48))',
        animation: emerged ? 'sp-reflect 5s linear 0s infinite' : 'none',
      }}>FUDA</div>

      {/* Specular highlight — bright rim along top edge */}
      <div style={{
        ...FONT_STYLE,
        position: 'absolute',
        top: 0, left: 0,
        transform: 'translateZ(1px)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0) 30%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        pointerEvents: 'none',
      }}>FUDA</div>
    </div>
  );
}

/* ── Main splash screen ───────────────────────────────────────── */
export default function SplashScreen({ onDone }) {
  const [phase, setPhase]     = useState('enter');
  const [emerged, setEmerged] = useState(false);
  const [tiltX, setTiltX]     = useState(0);
  const [tiltY, setTiltY]     = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setEmerged(true), 2100);
    const t2 = setTimeout(() => setPhase('exit'), 4500);
    const t3 = setTimeout(() => onDone?.(), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const handlePointer = useCallback((ex, ey) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (ex - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const ny = (ey - (rect.top  + rect.height / 2)) / (rect.height / 2);
    setTiltY( nx * 15);
    setTiltX(-ny * 10);
  }, []);

  useEffect(() => {
    const onMove  = e => handlePointer(e.clientX, e.clientY);
    const onTouch = e => { if (e.touches[0]) handlePointer(e.touches[0].clientX, e.touches[0].clientY); };
    const onLeave = () => { setTiltX(0); setTiltY(0); };
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('touchmove',  onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('touchmove',  onTouch);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [handlePointer]);

  return (
    <div
      ref={wrapRef}
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
        animation: phase === 'exit'
          ? 'sp-out 0.7s cubic-bezier(0.4,0,1,1) both'
          : 'sp-in 0.5s ease both',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 60% at 50% 50%, rgba(28,48,88,0.60) 0%, rgba(8,14,28,0.85) 60%, transparent 100%)',
      }} />

      <Particles />

      {/* Expansion rings */}
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
        <Ring delay={0.6} />
        <Ring delay={1.8} />
        <Ring delay={3.0} />
      </div>

      {/* Scan line */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent 0%, rgba(155,210,255,0.07) 15%, rgba(200,235,255,0.50) 50%, rgba(155,210,255,0.07) 85%, transparent 100%)',
        boxShadow: '0 0 18px rgba(140,200,255,0.32)',
        animation: 'sp-scan 5s ease-in-out 1.5s infinite',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.4rem',
        width: '100vw',
        overflow: 'hidden',
        padding: '0 8px',
      }}>

        {/* Perspective wrapper + emerge animation */}
        <div style={{
          perspective: '900px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          justifyContent: 'center',
          animation: 'sp-emerge 1.7s cubic-bezier(0.16,1,0.3,1) 0.4s both',
        }}>
          <Logo3D tiltX={tiltX} tiltY={tiltY} emerged={emerged} />
        </div>

        {/* Divider */}
        <div style={{
          width: 'clamp(55px,10vw,80px)', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(155,200,255,0.50), transparent)',
          animation: 'sp-sub 0.6s ease 2.3s both',
        }} />

        {/* IxyPixy */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(10px,2.2vw,14px)',
          fontWeight: 500,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'rgba(155,200,255,0.72)',
          animation: 'sp-sub 0.8s ease 2.6s both',
          userSelect: 'none',
        }}>IxyPixy</div>

        {/* Japanese subtitle */}
        <div style={{
          fontFamily: 'var(--font-ja)',
          fontSize: 'clamp(9px,1.7vw,11px)',
          color: 'rgba(130,170,228,0.40)',
          letterSpacing: '0.18em',
          animation: 'sp-sub 0.8s ease 2.9s both',
          userSelect: 'none',
        }}>ポケカ 取引管理</div>
      </div>

      {/* Film grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.55,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.028'/%3E%3C/svg%3E")`,
      }} />
    </div>
  );
}
