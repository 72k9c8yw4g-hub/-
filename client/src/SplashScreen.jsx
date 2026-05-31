import { useEffect, useRef, useState } from 'react';

/* ── static star background ─────────────────────────────────── */
function StarField() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const blob = (x, y, r, rgb, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${rgb},${a})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x-r, y-r, r*2, r*2);
    };
    blob(W*0.15, H*0.18, Math.min(W,H)*0.50, '80,28,175', 0.10);
    blob(W*0.85, H*0.75, Math.min(W,H)*0.44, '20,50,180', 0.09);
    blob(W*0.52, H*0.48, Math.min(W,H)*0.34, '58,14,120', 0.06);

    for (let i = 0; i < 160; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 0.7 + 0.1;
      const a = (Math.random() * 0.28 + 0.04).toFixed(2);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(200,210,255,${a})`; ctx.fill();
    }
    for (let i = 0; i < 22; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const r = Math.random() * 1.1 + 0.4;
      const a = (Math.random() * 0.48 + 0.16).toFixed(2);
      const gw = ctx.createRadialGradient(x, y, 0, x, y, r*6);
      gw.addColorStop(0, `rgba(210,220,255,${a})`);
      gw.addColorStop(1, 'rgba(210,220,255,0)');
      ctx.fillStyle = gw; ctx.fillRect(x-r*6, y-r*6, r*12, r*12);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(230,235,255,${a})`; ctx.fill();
    }
  }, []);

  return <canvas ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none' }}/>;
}

/* ── holographic card ───────────────────────────────────────── */
function HoloCard({ w, h }) {
  const ref = useRef(null);
  const CR = 14;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const cx = w/2, cy = h/2;
    let raf, t = 0;

    const cardPath = () => {
      const r = CR;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(w-r, 0); ctx.quadraticCurveTo(w, 0, w, r);
      ctx.lineTo(w, h-r); ctx.quadraticCurveTo(w, h, w-r, h);
      ctx.lineTo(r, h);   ctx.quadraticCurveTo(0, h, 0, h-r);
      ctx.lineTo(0, r);   ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.007;

      // card base
      cardPath();
      const base = ctx.createLinearGradient(0, 0, w, h);
      base.addColorStop(0, '#0f0f2a');
      base.addColorStop(1, '#080818');
      ctx.fillStyle = base; ctx.fill();

      ctx.save();
      cardPath(); ctx.clip();

      // inner ambient glow
      const ig = ctx.createRadialGradient(cx*0.85, cy*0.65, 0, cx, cy, Math.max(w,h)*0.85);
      ig.addColorStop(0,   'rgba(110,80,220,0.14)');
      ig.addColorStop(0.4, 'rgba(60,100,210,0.07)');
      ig.addColorStop(1,   'rgba(20,20,60,0)');
      ctx.fillStyle = ig; ctx.fillRect(0, 0, w, h);

      // holographic rainbow sweep
      const ha    = t * 0.22;
      const holoA = (0.15 + 0.07*Math.sin(t*0.35)).toFixed(3);
      const hl    = ctx.createLinearGradient(
        cx + Math.cos(ha)*w*1.6, cy + Math.sin(ha)*h*1.6,
        cx - Math.cos(ha)*w*1.6, cy - Math.sin(ha)*h*1.6
      );
      hl.addColorStop(0,    `rgba(255,70,110,${holoA})`);
      hl.addColorStop(0.14, `rgba(255,152,50,${holoA})`);
      hl.addColorStop(0.28, `rgba(232,222,45,${holoA})`);
      hl.addColorStop(0.43, `rgba(50,222,92,${holoA})`);
      hl.addColorStop(0.57, `rgba(50,188,255,${holoA})`);
      hl.addColorStop(0.71, `rgba(100,92,255,${holoA})`);
      hl.addColorStop(0.86, `rgba(212,62,255,${holoA})`);
      hl.addColorStop(1,    `rgba(255,70,110,${holoA})`);
      ctx.fillStyle = hl; ctx.fillRect(0, 0, w, h);

      // glare stripe sweeping across
      const gp  = (t * 0.11) % 1;
      const gc  = -w*0.3 + w*1.6*gp;
      const glr = ctx.createLinearGradient(gc - w*0.22, 0, gc + w*0.22, h);
      glr.addColorStop(0,    'rgba(255,255,255,0)');
      glr.addColorStop(0.35, 'rgba(255,255,255,0.04)');
      glr.addColorStop(0.5,  'rgba(255,255,255,0.10)');
      glr.addColorStop(0.65, 'rgba(255,255,255,0.04)');
      glr.addColorStop(1,    'rgba(255,255,255,0)');
      ctx.fillStyle = glr; ctx.fillRect(0, 0, w, h);

      // holographic dot pattern
      ctx.globalAlpha = 0.038;
      for (let px = 10; px < w; px += 20) {
        for (let py = 10; py < h; py += 20) {
          const hue = ((px + py + t*28)|0) % 360;
          ctx.strokeStyle = `hsl(${hue},100%,72%)`;
          ctx.lineWidth = 0.32;
          ctx.beginPath(); ctx.arc(px, py, 3.8, 0, Math.PI*2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // FUDA text
      const fSize = Math.round(w * 0.30);
      ctx.font = `800 ${fSize}px 'Bricolage Grotesque', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(167,139,250,0.65)';
      ctx.shadowBlur  = 24;
      const tg = ctx.createLinearGradient(cx-w*0.38, cy-6, cx+w*0.38, cy+6);
      tg.addColorStop(0,    'rgba(221,214,254,0.97)');
      tg.addColorStop(0.35, 'rgba(167,139,250,0.97)');
      tg.addColorStop(0.65, 'rgba(96,165,250,0.97)');
      tg.addColorStop(1,    'rgba(240,171,252,0.97)');
      ctx.fillStyle = tg;
      ctx.fillText('FUDA', cx, cy * 0.94);
      ctx.shadowBlur = 0;

      // subtitle on card
      ctx.font = `500 ${Math.round(w*0.075)}px 'Zen Kaku Gothic New', sans-serif`;
      ctx.shadowColor = 'rgba(167,139,250,0.3)';
      ctx.shadowBlur  = 8;
      ctx.fillStyle   = 'rgba(167,139,250,0.42)';
      ctx.fillText('ポケカ仕入れ判定', cx, cy*0.94 + fSize*0.72);
      ctx.shadowBlur  = 0;

      // caustic specks
      const CP = [[255,125,125],[255,195,85],[95,255,165],[78,192,255],[188,138,255]];
      for (let i = 0; i < 5; i++) {
        const a  = t*(0.16+i*0.07) + i*1.26;
        const d  = Math.min(w,h)*(0.16+0.09*Math.sin(t*0.28+i));
        const bx = cx + Math.cos(a)*d, by = cy*0.68 + Math.sin(a)*d*0.55;
        const bs = w*0.09;
        const [rc,gc,bc] = CP[i];
        const al = (0.11+0.06*Math.sin(t*0.5+i)).toFixed(3);
        const cg = ctx.createRadialGradient(bx, by, 0, bx, by, bs);
        cg.addColorStop(0, `rgba(${rc},${gc},${bc},${al})`);
        cg.addColorStop(1, `rgba(${rc},${gc},${bc},0)`);
        ctx.fillStyle = cg; ctx.fillRect(bx-bs, by-bs, bs*2, bs*2);
      }

      // corner glints
      for (const [sx, sy] of [[w*0.13, h*0.09],[w*0.87, h*0.08]]) {
        const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, w*0.12);
        sg.addColorStop(0, `rgba(255,255,255,${(0.22+0.10*Math.sin(t*0.7+sx)).toFixed(3)})`);
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg; ctx.fillRect(sx-w*0.12, sy-w*0.12, w*0.24, w*0.24);
      }

      ctx.restore();

      // animated rainbow border
      const br  = t * 0.30;
      const bra = (0.55+0.20*Math.sin(t*0.4)).toFixed(3);
      const bdg = ctx.createLinearGradient(
        cx+Math.cos(br)*w, cy+Math.sin(br)*h,
        cx-Math.cos(br)*w, cy-Math.sin(br)*h
      );
      bdg.addColorStop(0,    `rgba(167,139,250,${bra})`);
      bdg.addColorStop(0.25, `rgba(96,165,250,${bra})`);
      bdg.addColorStop(0.5,  `rgba(240,171,252,${bra})`);
      bdg.addColorStop(0.75, `rgba(167,139,250,${bra})`);
      bdg.addColorStop(1,    `rgba(96,165,250,${bra})`);
      cardPath();
      ctx.shadowColor = 'rgba(167,139,250,0.45)';
      ctx.shadowBlur  = 14;
      ctx.strokeStyle = bdg; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur  = 0;

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [w, h]);

  return (
    <canvas
      ref={ref}
      style={{
        display: 'block',
        borderRadius: CR + 'px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.65), 0 0 90px rgba(140,100,255,0.14)',
      }}
    />
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
    const t = setTimeout(dismiss, 4500);
    return () => clearTimeout(t);
  }, []);

  const cardW = Math.round(Math.min(window.innerWidth * 0.55, 230));
  const cardH = Math.round(cardW / 0.715);

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden',
        background: '#030510',
        cursor: 'pointer', userSelect: 'none',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: out
          ? 'sp-out 0.58s cubic-bezier(0.4,0,1,1) forwards'
          : 'sp-in 0.4s ease both',
      }}
    >
      <StarField />

      {/* center glow behind card */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)', pointerEvents:'none' }}>
        <div style={{
          width: cardW * 2.8, height: cardH * 2.0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(110,65,215,0.13) 0%, rgba(45,75,200,0.06) 40%, transparent 70%)',
          animation: 'sp-aurora 10s ease infinite alternate',
        }}/>
      </div>

      {/* content */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 26,
      }}>
        {/* holographic card — perspective wrapper → tilt → fade-in */}
        <div style={{ perspective: '1000px' }}>
          <div style={{ animation: 'sp-holo-tilt 8s ease-in-out 0.6s infinite' }}>
            <div style={{ animation: 'sp-card-fade 1.0s cubic-bezier(0.16,1,0.3,1) 0.38s both' }}>
              <HoloCard w={cardW} h={cardH} />
            </div>
          </div>
        </div>

        {/* company name */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px,6.5vw,36px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          background: 'linear-gradient(125deg,#ddd6fe 0%,#a78bfa 30%,#60a5fa 60%,#f0abfc 100%)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: 'sp-sub 0.5s ease 1.4s both, sp-shimmer 5s linear 1.4s infinite',
          filter: 'drop-shadow(0 0 14px rgba(167,139,250,0.55))',
        }}>IxyPixy</div>

        <div style={{
          marginTop: -18,
          fontFamily: 'var(--font-ja)',
          fontSize: 11,
          letterSpacing: '0.20em',
          color: 'rgba(167,139,250,0.48)',
          animation: 'sp-sub 0.5s ease 1.75s both',
        }}>ポケモンカード 仕入れ判定アプリ</div>
      </div>

      {/* tap hint */}
      <div style={{
        position: 'absolute', bottom: 44,
        fontFamily: 'var(--font-ja)', fontSize: 11,
        letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)',
        animation: 'sp-pulse 2s ease 2.5s infinite, sp-sub 0.4s ease 2.5s both',
      }}>タップしてはじめる</div>

      {/* bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        background: 'linear-gradient(90deg,#a78bfa,#60a5fa,#f0abfc)',
        animation: 'sp-bar 1.4s cubic-bezier(0.16,1,0.3,1) 0.5s both',
      }}/>

      {/* film grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        opacity: 0.04, mixBlendMode: 'overlay',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}/>
    </div>
  );
}
