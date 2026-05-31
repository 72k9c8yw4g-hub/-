import { useEffect, useRef, useState } from 'react';

/* ── realistic deep-space canvas ────────────────────────────── */
function DeepSpace() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, W, H;

    // Star color temperatures (B-V index → RGB)
    const STAR_COLORS = [
      [155, 176, 255], // blue-white (hot)
      [170, 191, 255], // blue-white
      [202, 215, 255], // white-blue
      [255, 255, 255], // pure white
      [255, 255, 244], // white
      [255, 255, 228], // yellow-white
      [255, 244, 214], // slightly yellow
      [255, 236, 190], // yellow-orange
    ];

    let bgStars, midStars, brightStars, milkyWayStars, nebulaClouds;

    const randomColor = () => STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

    const init = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;

      // Milky Way band: diagonal strip
      const mwAngle = -0.35; // radians
      const mwBand = Math.min(W, H) * 0.6;
      milkyWayStars = Array.from({ length: 600 }, () => {
        // distribute along a diagonal band
        const t = (Math.random() - 0.5) * Math.max(W, H) * 1.4;
        const n = (Math.random() - 0.5) * mwBand * (0.3 + Math.random() * 0.7);
        const cx = W * 0.5 + Math.cos(mwAngle) * t + Math.cos(mwAngle + Math.PI/2) * n;
        const cy = H * 0.5 + Math.sin(mwAngle) * t + Math.sin(mwAngle + Math.PI/2) * n;
        const c = randomColor();
        return {
          x: cx, y: cy,
          r: Math.random() * 0.55 + 0.08,
          base: Math.random() * 0.22 + 0.03,
          speed: Math.random() * 0.2 + 0.05,
          phase: Math.random() * Math.PI * 2,
          c,
        };
      });

      // Scattered background stars
      bgStars = Array.from({ length: 350 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 0.7 + 0.1,
        base: Math.random() * 0.30 + 0.04,
        speed: Math.random() * 0.25 + 0.04,
        phase: Math.random() * Math.PI * 2,
        c: randomColor(),
      }));

      // Mid-range stars with soft glow
      midStars = Array.from({ length: 55 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.2 + 0.5,
        base: Math.random() * 0.55 + 0.20,
        speed: Math.random() * 0.15 + 0.05,
        phase: Math.random() * Math.PI * 2,
        c: randomColor(),
      }));

      // Bright stars with diffraction spikes
      brightStars = Array.from({ length: 14 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.8 + 1.0,
        glow: Math.random() * 22 + 14,
        spike: Math.random() * 28 + 18,
        base: Math.random() * 0.5 + 0.6,
        speed: Math.random() * 0.1 + 0.04,
        phase: Math.random() * Math.PI * 2,
        c: randomColor(),
      }));

      // Nebula cloud descriptors
      nebulaClouds = [
        { x: W*0.18, y: H*0.22, r: Math.min(W,H)*0.55, rgb:[55,15,110], a:0.10 },
        { x: W*0.82, y: H*0.68, r: Math.min(W,H)*0.45, rgb:[12,35,95],  a:0.09 },
        { x: W*0.55, y: H*0.38, r: Math.min(W,H)*0.38, rgb:[72,10,70],  a:0.07 },
        { x: W*0.28, y: H*0.78, r: Math.min(W,H)*0.32, rgb:[8, 45,80],  a:0.06 },
        { x: W*0.68, y: H*0.14, r: Math.min(W,H)*0.28, rgb:[30,10,90],  a:0.05 },
      ];
    };

    init();
    window.addEventListener('resize', init);

    // draw gradient glow
    const glow = (x, y, r, [rc,gc,bc], a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rc},${gc},${bc},${a})`);
      g.addColorStop(0.45, `rgba(${rc},${gc},${bc},${a*0.4})`);
      g.addColorStop(1,  `rgba(${rc},${gc},${bc},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x-r, y-r, r*2, r*2);
    };

    // diffraction spike
    const spike = (x, y, len, [rc,gc,bc], a) => {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx,dy] of dirs) {
        const g = ctx.createLinearGradient(x, y, x+dx*len, y+dy*len);
        g.addColorStop(0, `rgba(${rc},${gc},${bc},${a})`);
        g.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+dx*len, y+dy*len); ctx.stroke();
      }
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.007;

      // ── nebula clouds ──
      for (const n of nebulaClouds) glow(n.x, n.y, n.r, n.rgb, n.a);

      // ── milky way glow band ──
      const mwGrd = ctx.createLinearGradient(W*0.1, H*0.05, W*0.9, H*0.95);
      mwGrd.addColorStop(0,   'rgba(30,15,60,0)');
      mwGrd.addColorStop(0.35,'rgba(30,15,60,0.06)');
      mwGrd.addColorStop(0.5, 'rgba(30,15,60,0.09)');
      mwGrd.addColorStop(0.65,'rgba(30,15,60,0.06)');
      mwGrd.addColorStop(1,   'rgba(30,15,60,0)');
      ctx.fillStyle = mwGrd;
      ctx.fillRect(0, 0, W, H);

      // ── milky way micro-stars ──
      for (const s of milkyWayStars) {
        const o = s.base * (0.3 + 0.7 * Math.sin(t * s.speed + s.phase));
        if (o < 0.01) continue;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${o})`;
        ctx.fill();
      }

      // ── background stars ──
      for (const s of bgStars) {
        const o = s.base * (0.35 + 0.65 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${o})`;
        ctx.fill();
      }

      // ── mid stars with soft glow ──
      for (const s of midStars) {
        const o = s.base * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        glow(s.x, s.y, s.r * 7, s.c, o * 0.35);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${o})`;
        ctx.fill();
      }

      // ── bright stars ──
      for (const s of brightStars) {
        const o = s.base * (0.65 + 0.35 * Math.sin(t * s.speed + s.phase));
        // outer halo
        glow(s.x, s.y, s.glow * 4, s.c, o * 0.25);
        // inner glow
        glow(s.x, s.y, s.glow, s.c, o * 0.7);
        // core
        const cg = ctx.createRadialGradient(s.x,s.y,0, s.x,s.y,s.r*1.2);
        cg.addColorStop(0,'rgba(255,255,255,1)');
        cg.addColorStop(0.4,`rgba(${s.c[0]},${s.c[1]},${s.c[2]},0.9)`);
        cg.addColorStop(1,`rgba(${s.c[0]},${s.c[1]},${s.c[2]},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r*1.2,0,Math.PI*2); ctx.fill();
        // spikes
        spike(s.x, s.y, s.spike * o, s.c, o * 0.45);
        // diagonal secondary spikes (fainter)
        ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(Math.PI/4); ctx.translate(-s.x,-s.y);
        spike(s.x, s.y, s.spike * 0.5 * o, s.c, o * 0.2);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', init); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none' }} />;
}

/* ── ring ────────────────────────────────────────────────────── */
function Ring({ d, color, shadowColor, strokeW, dash, duration, reverse, delay, dots=[] }) {
  return (
    <div style={{
      position:'absolute', width:d, height:d,
      top:'50%', left:'50%', marginTop:-d/2, marginLeft:-d/2,
      borderRadius:'50%',
      border:`${strokeW}px ${dash?'dashed':'solid'} ${color}`,
      boxShadow:`0 0 14px ${shadowColor}, 0 0 30px ${shadowColor}55, inset 0 0 14px ${shadowColor}33`,
      animation:`sp-ring-in 1s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
    }}>
      <div style={{
        position:'absolute', inset:-strokeW,
        borderRadius:'50%',
        border:`${strokeW}px ${dash?'dashed':'solid'} ${color}`,
        animation:`${reverse?'sp-ccw':'sp-cw'} ${duration}s linear ${delay}s infinite`,
      }}>
        {dots.map((dot,i) => (
          <div key={i} style={{
            position:'absolute',
            width:dot.size, height:dot.size, borderRadius:'50%',
            background:dot.color,
            boxShadow:`0 0 ${dot.size*2}px ${dot.color}, 0 0 ${dot.size*5}px ${dot.color}99`,
            ...(dot.pos==='top'    && {top:-dot.size/2,    left:'50%', transform:'translateX(-50%)'}),
            ...(dot.pos==='right'  && {right:-dot.size/2,  top:'50%',  transform:'translateY(-50%)'}),
            ...(dot.pos==='bottom' && {bottom:-dot.size/2, left:'50%', transform:'translateX(-50%)'}),
            ...(dot.pos==='left'   && {left:-dot.size/2,   top:'50%',  transform:'translateY(-50%)'}),
          }}/>
        ))}
      </div>
    </div>
  );
}

/* ── ripple ──────────────────────────────────────────────────── */
function Ripple({ delay, color }) {
  return (
    <div style={{
      position:'absolute', width:170, height:170,
      top:'50%', left:'50%', marginTop:-85, marginLeft:-85,
      borderRadius:'50%', border:`1px solid ${color}`,
      animation:`sp-ripple 2.6s ease-out ${delay}s infinite`, pointerEvents:'none',
    }}/>
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
    const t = setTimeout(dismiss, 4200);
    return () => clearTimeout(t);
  }, []);

  const S = Math.min(window.innerWidth * 0.88, 380);

  return (
    <div onClick={dismiss} style={{
      position:'fixed', inset:0, zIndex:200, overflow:'hidden',
      background:'#000005',
      cursor:'pointer', userSelect:'none',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      animation: out ? 'sp-out 0.58s cubic-bezier(0.4,0,1,1) forwards' : 'sp-in 0.4s ease both',
    }}>
      <DeepSpace />

      {/* very subtle center ambient glow behind logo */}
      <div style={{
        position:'absolute', width:600, height:600,
        top:'50%', left:'50%', marginTop:-300, marginLeft:-300,
        borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(100,60,200,0.12) 0%, rgba(40,60,180,0.06) 40%, transparent 70%)',
        pointerEvents:'none',
        animation:'sp-aurora 10s ease infinite alternate',
      }}/>

      {/* ring stage */}
      <div style={{ position:'absolute', width:S, height:S, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
        <Ripple delay={0.7}  color="rgba(167,139,250,0.55)" />
        <Ripple delay={2.1}  color="rgba(96,165,250,0.40)" />

        <Ring d={S}        color="rgba(167,139,250,0.28)" shadowColor="rgba(167,139,250,0.4)"
          strokeW={1}  dash duration={30} reverse={false} delay={0.30}
          dots={[{pos:'top',size:5,color:'#a78bfa'},{pos:'bottom',size:4,color:'#c084fc'}]}/>

        <Ring d={S*0.70}   color="rgba(96,165,250,0.55)"  shadowColor="rgba(96,165,250,0.5)"
          strokeW={1.5} duration={16} reverse delay={0.44}
          dots={[{pos:'top',size:9,color:'#60a5fa'},{pos:'right',size:6,color:'#818cf8'},{pos:'left',size:5,color:'#38bdf8'}]}/>

        <Ring d={S*0.43}   color="rgba(240,171,252,0.40)" shadowColor="rgba(240,171,252,0.4)"
          strokeW={1}  dash duration={10} reverse={false} delay={0.56}
          dots={[{pos:'right',size:5,color:'#f0abfc'}]}/>
      </div>

      {/* center content */}
      <div style={{ position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center' }}>
        {/* IxyPixy */}
        <div style={{
          fontFamily:'var(--font-display)',
          fontSize:`clamp(58px,16vw,96px)`,
          fontWeight:800,
          letterSpacing:'-0.035em',
          lineHeight:1,
          background:'linear-gradient(125deg,#ddd6fe 0%,#a78bfa 22%,#60a5fa 46%,#f0abfc 70%,#fcd34d 90%,#ddd6fe 100%)',
          backgroundSize:'280% 280%',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          animation:'sp-logo 1.1s cubic-bezier(0.16,1,0.3,1) 0.38s both, sp-shimmer 5s linear 0.38s infinite',
          filter:'drop-shadow(0 0 28px rgba(167,139,250,0.9)) drop-shadow(0 0 70px rgba(96,165,250,0.5))',
        }}>IxyPixy</div>

        {/* sweep */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', borderRadius:8 }}>
          <div style={{
            position:'absolute', top:'-20%', bottom:'-20%', width:'22%',
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.14) 40%,rgba(255,255,255,0.30) 50%,rgba(255,255,255,0.14) 60%,transparent)',
            animation:'sp-sweep 0.65s cubic-bezier(0.4,0,0.2,1) 1.35s both',
          }}/>
        </div>

        {/* divider */}
        <div style={{
          marginTop:18, height:1,
          background:'linear-gradient(90deg,transparent,rgba(167,139,250,0.7) 30%,rgba(96,165,250,0.7) 70%,transparent)',
          width:0, transition:'width 0.65s cubic-bezier(0.16,1,0.3,1) 1.5s',
        }} ref={el => { if (el) requestAnimationFrame(() => { el.style.width='200px'; }); }}/>

        <div style={{
          marginTop:16, fontFamily:'var(--font-display)',
          fontSize:'clamp(17px,4vw,24px)', fontWeight:700,
          letterSpacing:'0.5em', color:'rgba(255,255,255,0.85)',
          animation:'sp-sub 0.5s ease 1.65s both',
          filter:'drop-shadow(0 0 10px rgba(167,139,250,0.55))',
        }}>FUDA</div>

        <div style={{
          marginTop:8, fontFamily:'var(--font-ja)', fontSize:11,
          letterSpacing:'0.22em', color:'rgba(167,139,250,0.55)',
          animation:'sp-sub 0.5s ease 1.9s both',
        }}>ポケカ仕入れ判定アプリ</div>
      </div>

      {/* tap hint */}
      <div style={{
        position:'absolute', bottom:44,
        fontFamily:'var(--font-ja)', fontSize:11,
        letterSpacing:'0.14em', color:'rgba(255,255,255,0.25)',
        animation:'sp-pulse 2s ease 2.5s infinite, sp-sub 0.4s ease 2.5s both',
      }}>タップしてはじめる</div>

      {/* bottom accent bar */}
      <div style={{
        position:'absolute', bottom:0, left:0, height:2,
        background:'linear-gradient(90deg,#a78bfa,#60a5fa,#f0abfc)',
        animation:'sp-bar 1.4s cubic-bezier(0.16,1,0.3,1) 0.4s both',
      }}/>

      {/* film grain */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none', opacity:0.05, mixBlendMode:'overlay',
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}/>
    </div>
  );
}
