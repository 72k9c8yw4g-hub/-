import { useEffect, useRef, useState } from 'react';

/* ── star canvas ─────────────────────────────────────────────── */
function Stars() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let raf;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const stars = Array.from({ length: 260 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.2,
      base: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
      phase: Math.random() * Math.PI * 2,
    }));
    let t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      t += 0.01;
      for (const s of stars) {
        const o = s.base * (0.4 + 0.6 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * c.width, s.y * c.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${o})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />;
}

/* ── orbit dot ───────────────────────────────────────────────── */
function OrbitDot({ angle, r, color, size = 7 }) {
  const rad = (angle * Math.PI) / 180;
  const x = 50 + (r / 2) * Math.cos(rad) * 100 / r + '%';
  const y = 50 + (r / 2) * Math.sin(rad) * 100 / r + '%';
  return (
    <div style={{
      position:'absolute',
      left:`calc(50% + ${Math.cos(rad) * r}px - ${size/2}px)`,
      top:`calc(50% + ${Math.sin(rad) * r}px - ${size/2}px)`,
      width: size, height: size,
      borderRadius:'50%',
      background: color,
      boxShadow: `0 0 ${size*1.5}px ${color}, 0 0 ${size*3}px ${color}88`,
    }} />
  );
}

/* ── ring ────────────────────────────────────────────────────── */
function Ring({ d, border, color, dash, duration, reverse, delay, dots = [] }) {
  return (
    <div style={{
      position:'absolute',
      width: d, height: d,
      top:'50%', left:'50%',
      marginTop: -d/2, marginLeft: -d/2,
      borderRadius:'50%',
      border,
      boxShadow: `0 0 12px ${color}44, inset 0 0 12px ${color}22`,
      animation: `sp-ring-in 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
    }}>
      <div style={{
        position:'absolute', inset:-1,
        borderRadius:'50%',
        border,
        animation: `${reverse ? 'sp-ccw' : 'sp-cw'} ${duration}s linear ${delay}s infinite`,
        borderStyle: dash ? 'dashed' : 'solid',
      }}>
        {dots.map((dot, i) => (
          <div key={i} style={{
            position:'absolute',
            width: dot.size, height: dot.size,
            borderRadius:'50%',
            background: dot.color,
            boxShadow:`0 0 ${dot.size*2}px ${dot.color}, 0 0 ${dot.size*4}px ${dot.color}66`,
            top:'50%', left: dot.side === 'right' ? 'auto' : dot.side === 'left' ? -dot.size/2 : '50%',
            right: dot.side === 'right' ? -dot.size/2 : 'auto',
            bottom: dot.side === 'bottom' ? -dot.size/2 : 'auto',
            marginTop: dot.side === 'top' ? -dot.size : dot.side === 'bottom' ? 0 : -dot.size/2,
            marginLeft: (dot.side === 'left' || dot.side === 'right') ? 0 : -dot.size/2,
            ...(dot.side === 'top' && { top: -dot.size/2, left:'50%', bottom:'auto' }),
          }} />
        ))}
      </div>
    </div>
  );
}

/* ── ripple ──────────────────────────────────────────────────── */
function Ripple({ delay, color }) {
  return (
    <div style={{
      position:'absolute',
      width:160, height:160,
      top:'50%', left:'50%',
      marginTop:-80, marginLeft:-80,
      borderRadius:'50%',
      border:`1px solid ${color}`,
      animation:`sp-ripple 2.4s ease-out ${delay}s infinite`,
      pointerEvents:'none',
    }} />
  );
}

/* ── main ────────────────────────────────────────────────────── */
export default function SplashScreen({ onDone }) {
  const [out, setOut] = useState(false);

  const dismiss = () => {
    if (out) return;
    setOut(true);
    setTimeout(onDone, 580);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  const S = 'min(380px, 88vw)'; // ring stage size (CSS string)

  return (
    <div onClick={dismiss} style={{
      position:'fixed', inset:0, zIndex:200, overflow:'hidden',
      background:'#01000c', cursor:'pointer', userSelect:'none',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      animation: out ? 'sp-out 0.58s cubic-bezier(0.4,0,1,1) forwards'
                     : 'sp-in 0.35s ease both',
    }}>
      <Stars />

      {/* aurora */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', filter:'blur(50px)',
        background:
          'radial-gradient(ellipse 65% 50% at 20% 30%, rgba(76,29,149,0.4) 0%,transparent 70%),' +
          'radial-gradient(ellipse 55% 45% at 80% 70%, rgba(30,58,138,0.35) 0%,transparent 70%),' +
          'radial-gradient(ellipse 45% 35% at 60% 15%, rgba(157,23,77,0.25) 0%,transparent 70%)',
        animation:'sp-aurora 9s ease infinite alternate',
      }}/>

      {/* ── ring stage ── */}
      <div style={{
        position:'absolute',
        width:S, height:S,
        top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
      }}>
        {/* ripples */}
        <Ripple delay={0.6} color="rgba(167,139,250,0.5)" />
        <Ripple delay={1.8} color="rgba(96,165,250,0.4)" />

        {/* outer ring — thin dashed purple */}
        <Ring d="100%" border="1px dashed rgba(167,139,250,0.35)"
          color="rgba(167,139,250,0.35)" dash duration={28} delay={0.3}
          dots={[
            { side:'top',    size:5, color:'#a78bfa' },
            { side:'bottom', size:4, color:'#c084fc' },
          ]}
        />

        {/* mid ring — solid cyan glow, counter-rotate */}
        <Ring d="72%" border="1.5px solid rgba(96,165,250,0.55)"
          color="rgba(96,165,250,0.55)" duration={16} reverse delay={0.45}
          dots={[
            { side:'top',  size:8, color:'#60a5fa' },
            { side:'right',size:6, color:'#818cf8' },
            { side:'left', size:5, color:'#38bdf8' },
          ]}
        />

        {/* inner ring — dashed pink fast */}
        <Ring d="46%" border="1px dashed rgba(240,171,252,0.45)"
          color="rgba(240,171,252,0.45)" dash duration={9} delay={0.55}
          dots={[{ side:'right', size:5, color:'#f0abfc' }]}
        />
      </div>

      {/* ── center content ── */}
      <div style={{
        position:'relative', zIndex:10,
        display:'flex', flexDirection:'column', alignItems:'center', gap:0,
        pointerEvents:'none',
      }}>
        {/* IxyPixy */}
        <div style={{
          fontFamily:'var(--font-display)',
          fontSize:'clamp(58px, 16vw, 96px)',
          fontWeight:800,
          letterSpacing:'-0.035em',
          lineHeight:1,
          background:'linear-gradient(125deg,#ddd6fe 0%,#a78bfa 22%,#60a5fa 46%,#f0abfc 70%,#fcd34d 90%,#ddd6fe 100%)',
          backgroundSize:'280% 280%',
          WebkitBackgroundClip:'text',
          WebkitTextFillColor:'transparent',
          backgroundClip:'text',
          animation:
            'sp-logo 1.1s cubic-bezier(0.16,1,0.3,1) 0.35s both,' +
            'sp-shimmer 5s linear 0.35s infinite',
          filter:'drop-shadow(0 0 28px rgba(167,139,250,0.9)) drop-shadow(0 0 70px rgba(96,165,250,0.55))',
        }}>
          IxyPixy
        </div>

        {/* light sweep */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', borderRadius:8 }}>
          <div style={{
            position:'absolute', top:'-20%', bottom:'-20%', width:'22%',
            background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.15) 40%,rgba(255,255,255,0.32) 50%,rgba(255,255,255,0.15) 60%,transparent 100%)',
            animation:'sp-sweep 0.65s cubic-bezier(0.4,0,0.2,1) 1.3s both',
          }}/>
        </div>

        {/* divider */}
        <div style={{
          marginTop:18,
          height:1,
          background:'linear-gradient(90deg,transparent,rgba(167,139,250,0.7) 30%,rgba(96,165,250,0.7) 70%,transparent)',
          width:0,
          transition:'width 0.65s cubic-bezier(0.16,1,0.3,1) 1.45s',
        }} ref={el => {
          if (!el) return;
          requestAnimationFrame(() => { if (el) el.style.width = '200px'; });
        }}/>

        {/* FUDA */}
        <div style={{
          marginTop:16,
          fontFamily:'var(--font-display)',
          fontSize:'clamp(17px, 4vw, 24px)',
          fontWeight:700,
          letterSpacing:'0.5em',
          color:'rgba(255,255,255,0.85)',
          animation:'sp-sub 0.5s ease 1.6s both',
          filter:'drop-shadow(0 0 10px rgba(167,139,250,0.6))',
        }}>
          FUDA
        </div>

        {/* tagline */}
        <div style={{
          marginTop:8,
          fontFamily:'var(--font-ja)',
          fontSize:11,
          letterSpacing:'0.22em',
          color:'rgba(167,139,250,0.6)',
          animation:'sp-sub 0.5s ease 1.85s both',
        }}>
          ポケカ仕入れ判定アプリ
        </div>
      </div>

      {/* tap hint */}
      <div style={{
        position:'absolute', bottom:44,
        fontFamily:'var(--font-ja)', fontSize:11,
        letterSpacing:'0.14em', color:'rgba(255,255,255,0.28)',
        animation:'sp-pulse 2s ease 2.4s infinite, sp-sub 0.4s ease 2.4s both',
      }}>
        タップしてはじめる
      </div>

      {/* bottom line */}
      <div style={{
        position:'absolute', bottom:0, left:0, height:2,
        background:'linear-gradient(90deg,#a78bfa,#60a5fa,#f0abfc)',
        animation:'sp-bar 1.4s cubic-bezier(0.16,1,0.3,1) 0.4s both',
      }}/>

      {/* grain */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', opacity:0.045, mixBlendMode:'overlay',
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}/>
    </div>
  );
}
