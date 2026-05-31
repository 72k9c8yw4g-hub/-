import { useEffect, useRef, useState } from 'react';

/* ─── visit tracking ─────────────────────────────────────────── */
const SEEN_KEY = 'ixp_v1';
const isFresh = () => { try { return !localStorage.getItem(SEEN_KEY); } catch { return true; } };
const markSeen = () => { try { localStorage.setItem(SEEN_KEY, '1'); } catch {} };
const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/* ─── world rule: white architectural wireframes on near-black ── */

/* ─── camera keyframes ───────────────────────────────────────── */
/* [t, camX, camY, camZ, targetX, targetY, targetZ, fov] */
/* Letters: I=0, x=460, y=920, P=1480, i=1940, x=2400, y=2860 */
/* Center ≈ 1430 */
const CAM = [
  /* inside I — looking up the vertical shaft */
  [0.00,   30, -210,  70,    0,  200,   0,  86],
  [0.08,  -20,  180,  45,    0,  -60, -180, 78],
  /* approaching x crossing */
  [0.17,  260,   70, 130,  460,    0,   0,  74],
  /* flying through x intersection */
  [0.25,  460,  100,  20,  460,  -30, -380, 68],
  /* below y junction */
  [0.33,  680, -250, 105,  920,   80,   0,  72],
  /* through y fork */
  [0.41,  920,  200,  40,  920,  -20, -280, 66],
  /* approaching P arch from the side */
  [0.49, 1180,   90, 190, 1480,    0,   0,  70],
  /* orbit around the P curve */
  [0.57, 1680,  -50, 110, 1480,   60, -180, 63],
  /* i — camera above the dot, looking down the stem */
  [0.63, 1940,  370,  85, 1940,    0,   0,  67],
  /* second x */
  [0.69, 2200,  130,  95, 2400,    0,   0,  63],
  /* second y */
  [0.75, 2620,  160,  75, 2860,  -30,   0,  60],
  /* ── PULL BACK ── */
  [0.82, 1430,   80, 360, 1430,    0,   0,  58],
  [0.89, 1430,   50,1500, 1430,    0,   0,  50],
  [0.96, 1430,   20,3000, 1430,    0,   0,  43],
  [1.00, 1430,   10,3400, 1430,    0,   0,  40],
];

/* ─── scene builder ──────────────────────────────────────────── */
function buildWorld(THREE, canvas, onReveal, onComplete) {
  const getW = () => canvas.clientWidth  || window.innerWidth;
  const getH = () => canvas.clientHeight || window.innerHeight;

  /* renderer */
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(getW(), getH());

  /* scene */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06060A);
  const fogObj = new THREE.FogExp2(0x06060A, 0.00026);
  scene.fog = fogObj;

  /* camera */
  const cam = new THREE.PerspectiveCamera(86, getW() / getH(), 1, 10000);

  /* ── material helpers ─────────────────────────────────────── */
  const lineMat = (op = 0.88) => new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: op,
  });

  /* oriented beam A→B with box cross-section */
  function beam(parent, ax, ay, az, bx, by, bz, thick = 26, op = 0.88) {
    const A = new THREE.Vector3(ax, ay, az);
    const B = new THREE.Vector3(bx, by, bz);
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length();
    if (len < 0.5) return null;
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(thick, len, thick));
    const seg = new THREE.LineSegments(geo, lineMat(op));
    seg.position.copy(A).lerp(B, 0.5);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    parent.add(seg);
    return seg;
  }

  /* box frame */
  function boxFrame(parent, x, y, z, w, h, d, op = 0.88) {
    const seg = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
      lineMat(op),
    );
    seg.position.set(x, y, z);
    parent.add(seg);
    return seg;
  }

  /* arc in XY plane */
  function arc(parent, cx, cy, cz, r, a0, a1, segs = 72, op = 0.88) {
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (i / segs) * (a1 - a0);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts), lineMat(op),
    );
    parent.add(line);
    return line;
  }

  /* ── letter geometry ──────────────────────────────────────── */
  const S = 280;   /* half-height of letters */
  const G = 460;   /* horizontal spacing center-to-center */

  /* Letter X positions */
  const LC = [0, G, 2*G, 3.2*G, 4.2*G, 5.2*G, 6.2*G];
  /* [I, x, y, P, i, x, y] */

  const world = new THREE.Group();
  scene.add(world);

  /* ── I — tower with cross-beams ─── */
  {
    const cx = LC[0];
    beam(world, cx, -S,    0, cx,  S,    0, 38);       /* main spine */
    beam(world, cx-130,  S, 0, cx+130,  S, 0, 28);     /* top bar */
    beam(world, cx-130, -S, 0, cx+130, -S, 0, 28);     /* bottom bar */
    /* 3D depth — parallel offset beams give thickness */
    beam(world, cx, -S, -28, cx, S, -28, 18, 0.42);
    beam(world, cx, -S,  28, cx, S,  28, 18, 0.42);
    beam(world, cx-130,  S, -28, cx+130,  S, -28, 20, 0.30);
    beam(world, cx-130, -S, -28, cx+130, -S, -28, 20, 0.30);
  }

  /* ── x — two diagonal crossing beams ─── */
  {
    const cx = LC[1];
    const arm = S * 0.88;
    beam(world, cx-arm, -arm, 0, cx+arm, arm,  0, 36);   /* / */
    beam(world, cx+arm, -arm, 0, cx-arm, arm,  0, 36);   /* \ */
    beam(world, cx-arm, -arm, 28, cx+arm, arm, 28, 16, 0.38);
    beam(world, cx+arm, -arm, 28, cx-arm, arm, 28, 16, 0.38);
    /* structural node at intersection */
    boxFrame(world, cx, 0, 0, 48, 48, 52, 0.65);
  }

  /* ── y — fork junction ─── */
  {
    const cx = LC[2];
    const tw = S * 0.68;
    beam(world, cx-tw,  S, 0, cx,    0, 0, 34);           /* left arm */
    beam(world, cx+tw,  S, 0, cx,    0, 0, 34);           /* right arm */
    beam(world, cx,     0, 0, cx-tw*0.45, -S, 0, 34);     /* descending tail */
    beam(world, cx-tw*0.9, S, 26, cx, 0, 26, 15, 0.36);
    beam(world, cx+tw*0.9, S, 26, cx, 0, 26, 15, 0.36);
  }

  /* ── P — vertical spine + D arch ─── */
  {
    const cx    = LC[3];
    const spX   = cx - 60;          /* spine left of center */
    const archCY = S * 0.28;
    const archR  = S * 0.72;
    beam(world, spX, -S, 0, spX, S, 0, 38);                       /* spine */
    arc(world, spX, archCY, 0, archR, -Math.PI/2, Math.PI/2, 72, 0.86); /* D-arch */
    beam(world, spX, archCY+archR, 0, spX, archCY-archR, 0, 22, 0.50);  /* chord */
    /* depth copy */
    arc(world, spX, archCY, -32, archR*0.94, -Math.PI/2, Math.PI/2, 48, 0.28);
    beam(world, spX, -S, -28, spX, S, -28, 16, 0.36);
  }

  /* ── i — stem + floating dot cap ─── */
  {
    const cx  = LC[4];
    const dotY = S * 0.82;
    beam(world, cx, -S, 0, cx, dotY - S*0.14, 0, 34);  /* stem */
    boxFrame(world, cx, dotY + 28, 0, 76, 48, 52, 0.88); /* dot */
    beam(world, cx, -S, 22, cx, dotY - S*0.14, 22, 15, 0.36);
  }

  /* ── x (second) ─── */
  {
    const cx = LC[5];
    const arm = S * 0.88;
    beam(world, cx-arm, -arm,  0, cx+arm, arm,  0, 36);
    beam(world, cx+arm, -arm,  0, cx-arm, arm,  0, 36);
    beam(world, cx-arm, -arm, -28, cx+arm, arm, -28, 16, 0.36);
    beam(world, cx+arm, -arm, -28, cx-arm, arm, -28, 16, 0.36);
    boxFrame(world, cx, 0, 0, 48, 48, 52, 0.65);
  }

  /* ── y (second) ─── */
  {
    const cx = LC[6];
    const tw = S * 0.68;
    beam(world, cx-tw, S, 0, cx,  0, 0, 34);
    beam(world, cx+tw, S, 0, cx,  0, 0, 34);
    beam(world, cx, 0, 0, cx-tw*0.45, -S, 0, 34);
    beam(world, cx-tw*0.9, S, -26, cx, 0, -26, 15, 0.36);
    beam(world, cx+tw*0.9, S, -26, cx, 0, -26, 15, 0.36);
  }

  /* ── background world — hinted structures far behind ──────── */
  /* Seeded so they look intentional, not random noise */
  const BG_HINTS = [
    [-200, -100, -800,  40, 320,  40],
    [ 600,  300,-1200,  30, 200,  30],
    [1100, -400, -900,  60, 180,  60],
    [1800,  200,-1500,  35, 420,  35],
    [2200, -300,-1100,  45, 260,  45],
    [3000,  150,-1800,  30, 380,  30],
    [-300,  250,-2200,  55, 150,  55],
    [ 900, -200,-2500,  40, 290,  40],
    [2800, -150,-2000,  50, 200,  50],
    [1400,  400,-3000,  35, 340,  35],
    [ 400, -350,-1600,  28, 480,  28],
    [2100,  350,-2800,  42, 160,  42],
  ];
  for (const [gx, gy, gz, gw, gh, gd] of BG_HINTS) {
    boxFrame(world, gx, gy, gz, gw, gh, gd, 0.08 + Math.random() * 0.07);
  }

  /* ── grid floor — very faint depth reference ───────────────── */
  {
    const sz = 9000, div = 22, step = sz / div;
    const pts = [];
    for (let i = 0; i <= div; i++) {
      const v = -sz / 2 + i * step;
      pts.push(new THREE.Vector3(v, -S - 45, -sz / 2));
      pts.push(new THREE.Vector3(v, -S - 45,  sz / 2));
      pts.push(new THREE.Vector3(-sz / 2, -S - 45, v));
      pts.push(new THREE.Vector3( sz / 2, -S - 45, v));
    }
    const grid = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      lineMat(0.04),
    );
    scene.add(grid);
  }

  /* ── camera animation ─────────────────────────────────────── */
  const DURATION = 10000; /* ms for full sequence */
  let t0 = null;
  let revealFired = false;
  let completeFired = false;

  const lerp = (a, b, t) => a + (b - a) * t;
  const ss   = t => t * t * (3 - 2 * t);

  function camState(p) {
    p = Math.max(0, Math.min(1, p));
    let i = 0;
    while (i < CAM.length - 2 && CAM[i + 1][0] <= p) i++;
    const ka = CAM[i], kb = CAM[i + 1];
    const span = kb[0] - ka[0];
    const t = span < 0.0001 ? 1 : ss((p - ka[0]) / span);
    return {
      px: lerp(ka[1], kb[1], t), py: lerp(ka[2], kb[2], t), pz: lerp(ka[3], kb[3], t),
      tx: lerp(ka[4], kb[4], t), ty: lerp(ka[5], kb[5], t), tz: lerp(ka[6], kb[6], t),
      fov: lerp(ka[7], kb[7], t),
    };
  }

  const onResize = () => {
    cam.aspect = getW() / getH();
    cam.updateProjectionMatrix();
    renderer.setSize(getW(), getH());
  };
  window.addEventListener('resize', onResize);

  let disposed = false;
  let raf;

  function draw(ts) {
    if (disposed) return;
    raf = requestAnimationFrame(draw);
    if (t0 === null) t0 = ts;
    const p = Math.min((ts - t0) / DURATION, 1);

    const cs = camState(p);
    cam.position.set(cs.px, cs.py, cs.pz);
    cam.lookAt(cs.tx, cs.ty, cs.tz);
    cam.fov = cs.fov;
    cam.updateProjectionMatrix();

    /* gradually clear fog during pull-back for reveal clarity */
    if (p > 0.80) {
      fogObj.density = 0.00026 * (1 - ((p - 0.80) / 0.20) * 0.72);
    }

    renderer.render(scene, cam);

    if (p >= 0.83 && !revealFired) {
      revealFired = true;
      onReveal();
    }
    if (p >= 1 && !completeFired) {
      completeFired = true;
      setTimeout(onComplete, 1200);
    }
  }

  raf = requestAnimationFrame(draw);

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

/* ─── main component ─────────────────────────────────────────── */
export default function SplashScreen({ onDone }) {
  const canvasRef = useRef(null);
  const [fresh]   = useState(isFresh);
  const [reduced] = useState(prefersReduced);
  const [phase, setPhase] = useState('init'); /* init | playing | reveal | exit */
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    markSeen();

    /* returning visitor or reduced-motion: quick branded fade */
    if (!fresh || reduced) {
      setPhase('reveal');
      const t = setTimeout(() => {
        setPhase('exit');
        setTimeout(() => onDone?.(), 700);
      }, fresh ? 1600 : 500);
      return () => clearTimeout(t);
    }

    /* skip button appears after 2.5s */
    const skipT = setTimeout(() => setShowSkip(true), 2500);

    const canvas = canvasRef.current;
    if (!canvas) { clearTimeout(skipT); return; }

    let cleanup;

    import('three').then((THREE) => {
      cleanup = buildWorld(
        THREE,
        canvas,
        () => setPhase('reveal'),
        () => {
          setPhase('exit');
          setTimeout(() => onDone?.(), 900);
        },
      );
      setPhase('playing');
    });

    return () => {
      clearTimeout(skipT);
      cleanup?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = () => {
    setPhase('reveal');
    setTimeout(() => {
      setPhase('exit');
      setTimeout(() => onDone?.(), 700);
    }, 1600);
  };

  /* ── returning visitor: minimal branded fade ── */
  if (!fresh) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#06060A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        animation: 'sp-in 0.4s ease both',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(22px, 5.5vw, 44px)',
          fontWeight: 700,
          letterSpacing: '0.20em',
          color: 'rgba(255,255,255,0.88)',
          animation: 'sp-sub 0.6s ease 0.1s both',
        }}>
          IxyPixy
        </div>
      </div>
    );
  }

  /* ── full first-visit experience ── */
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#06060A',
      opacity: phase === 'exit' ? 0 : 1,
      transition: phase === 'exit' ? 'opacity 0.9s ease' : undefined,
    }}>
      {/* Three.js canvas — the 3D world */}
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Reveal overlay — IxyPixy text fades in over the pull-back */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        opacity: phase === 'reveal' || phase === 'exit' ? 1 : 0,
        transition: 'opacity 2.2s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* The name — appears as "understanding" over the 3D world */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(26px, 7vw, 54px)',
          fontWeight: 700,
          letterSpacing: '0.24em',
          color: 'rgba(255,255,255,0.88)',
          transform: (phase === 'reveal' || phase === 'exit')
            ? 'translateY(0)' : 'translateY(16px)',
          transition: 'transform 2.4s cubic-bezier(0.22,1,0.36,1) 0.5s',
        }}>
          IxyPixy
        </div>

        {/* Thin separator — appears after the name */}
        <div style={{
          marginTop: '1.4rem',
          width: 'clamp(36px, 6vw, 56px)',
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
          opacity: (phase === 'reveal' || phase === 'exit') ? 1 : 0,
          transition: 'opacity 1.6s ease 1s',
        }} />
      </div>

      {/* Skip button */}
      {showSkip && phase === 'playing' && (
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute', bottom: 30, right: 30,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.20)',
            color: 'rgba(255,255,255,0.42)',
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.15em',
            padding: '7px 18px',
            borderRadius: '20px',
            cursor: 'pointer',
            animation: 'sp-sub 0.5s ease both',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.42)';
          }}
        >
          SKIP
        </button>
      )}
    </div>
  );
}
