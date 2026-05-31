import { useEffect, useRef, useState } from 'react';

/* ─── canvas star field ─────────────────────────────────────── */
function StarField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.6 + 0.2,
      o: Math.random() * 0.6 + 0.15,
      s: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.012;
      stars.forEach(st => {
        const opacity = st.o * (0.5 + 0.5 * Math.sin(t * st.s + st.phase));
        ctx.beginPath();
        ctx.arc(st.x * canvas.width, st.y * canvas.height, st.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />;
}

/* ─── main splash ───────────────────────────────────────────── */
export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in'); // in | out

  const dismiss = () => {
    if (phase === 'out') return;
    setPhase('out');
    setTimeout(onDone, 600);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, 3800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* grain noise filter */}
      <svg style={{ position:'absolute', width:0, height:0 }}>
        <defs>
          <filter id="sp-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="noise"/>
            <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
            <feBlend in="SourceGraphic" in2="gray" mode="overlay" result="blend"/>
            <feComposite in="blend" in2="SourceGraphic" operator="in"/>
          </filter>
        </defs>
      </svg>

      <div
        onClick={dismiss}
        style={{
          position:'fixed', inset:0, zIndex:200,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          background:'#02000a',
          cursor:'pointer', userSelect:'none', overflow:'hidden',
          animation: phase === 'out'
            ? 'sp-out 0.6s cubic-bezier(0.4,0,1,1) forwards'
            : 'sp-in 0.4s ease both',
        }}>

        <StarField />

        {/* aurora blobs */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:
            'radial-gradient(ellipse 70% 55% at 25% 35%, rgba(88,28,220,0.35) 0%, transparent 65%),' +
            'radial-gradient(ellipse 55% 45% at 75% 65%, rgba(14,80,200,0.30) 0%, transparent 65%),' +
            'radial-gradient(ellipse 50% 40% at 55% 20%, rgba(200,30,150,0.22) 0%, transparent 65%),' +
            'radial-gradient(ellipse 40% 30% at 50% 85%, rgba(20,140,120,0.18) 0%, transparent 65%)',
          animation:'sp-aurora 8s ease infinite alternate',
          filter:'blur(40px)',
        }} />

        {/* center card */}
        <div style={{
          position:'relative', zIndex:10,
          display:'flex', flexDirection:'column',
          alignItems:'center', gap:0,
        }}>

          {/* IxyPixy — main wordmark */}
          <div style={{
            fontFamily:'var(--font-display)',
            fontSize:'clamp(64px, 17vw, 110px)',
            fontWeight:800,
            letterSpacing:'-0.035em',
            lineHeight:1,
            background:'linear-gradient(130deg, #e8d5ff 0%, #a78bfa 20%, #60a5fa 45%, #f0abfc 70%, #fbbf24 90%, #e8d5ff 100%)',
            backgroundSize:'300% 300%',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundClip:'text',
            animation:'sp-logo 1s cubic-bezier(0.16,1,0.3,1) 0.2s both, sp-shimmer 5s linear 0.2s infinite',
            filter:'drop-shadow(0 0 30px rgba(167,139,250,0.8)) drop-shadow(0 0 80px rgba(96,165,250,0.5))',
          }}>
            IxyPixy
          </div>

          {/* light sweep */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, bottom:0,
            pointerEvents:'none', overflow:'hidden', borderRadius:8,
          }}>
            <div style={{
              position:'absolute', top:'-10%', bottom:'-10%',
              width:'25%',
              background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.18) 60%, transparent 100%)',
              animation:'sp-sweep 0.7s cubic-bezier(0.4,0,0.2,1) 1.0s both',
            }} />
          </div>

          {/* divider */}
          <div style={{
            marginTop:18,
            height:1,
            background:'linear-gradient(90deg, transparent, rgba(167,139,250,0.7) 30%, rgba(96,165,250,0.7) 70%, transparent)',
            animation:'sp-line 0.6s cubic-bezier(0.16,1,0.3,1) 1.15s both',
            width:0,
            alignSelf:'center',
          }}
            ref={el => {
              if (!el) return;
              el.style.transition = 'width 0.6s cubic-bezier(0.16,1,0.3,1) 1.15s';
              requestAnimationFrame(() => { el.style.width = '220px'; });
            }}
          />

          {/* FUDA */}
          <div style={{
            marginTop:16,
            fontFamily:'var(--font-display)',
            fontSize:'clamp(18px, 4.5vw, 26px)',
            fontWeight:700,
            letterSpacing:'0.45em',
            color:'rgba(255,255,255,0.88)',
            textTransform:'uppercase',
            animation:'sp-sub 0.5s ease 1.3s both',
            filter:'drop-shadow(0 0 12px rgba(167,139,250,0.5))',
          }}>
            FUDA
          </div>

          {/* tagline */}
          <div style={{
            marginTop:8,
            fontFamily:'var(--font-ja)',
            fontSize:11,
            fontWeight:500,
            letterSpacing:'0.22em',
            color:'rgba(167,139,250,0.65)',
            animation:'sp-sub 0.5s ease 1.55s both',
          }}>
            ポケカ仕入れ判定アプリ
          </div>
        </div>

        {/* bottom bar */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0,
          height:2,
          background:'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.0) 0%)',
          animation:'sp-bar 1.2s ease 0.2s both',
        }} />

        {/* tap hint */}
        <div style={{
          position:'absolute', bottom:44,
          fontFamily:'var(--font-ja)',
          fontSize:11,
          letterSpacing:'0.14em',
          color:'rgba(255,255,255,0.3)',
          animation:'sp-pulse 2s ease 2.2s infinite, sp-sub 0.4s ease 2.2s both',
        }}>
          タップしてはじめる
        </div>

        {/* grain overlay */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          opacity:0.04,
          mixBlendMode:'overlay',
        }} />
      </div>
    </>
  );
}
