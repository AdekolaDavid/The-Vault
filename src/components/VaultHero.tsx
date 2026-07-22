'use client';

import { useEffect, useRef, useState } from 'react';

const STROKE = '#2e4258';
const STROKE_FG = '#4a6480';
const STROKE_ACCENT = '#B6FF3B';
const TRACK_COLOR = '#B6FF3B';

const centerX = 250;
const centerY = 250;
const outerRingR = 220;
const rivetRingR = 202;
const doorFaceR = 178;
const midRingR = 135;
const hubOuterR = 62;
const hubInnerR = 46;
const centerR = 11;
const spokeInnerR = 22;
const spokeOuterR = hubOuterR - 5;
const rivetCount = 24;

const r4 = (n: number) => Math.round(n * 10000) / 10000;
const circ = (r: number) => r4(2 * Math.PI * r);

const rivets = Array.from({ length: rivetCount }, (_, i) => {
  const angle = (i / rivetCount) * Math.PI * 2;
  return { cx: r4(centerX + rivetRingR * Math.cos(angle)), cy: r4(centerY + rivetRingR * Math.sin(angle)) };
});

const spokes = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x1: r4(centerX + spokeInnerR * Math.cos(rad)), y1: r4(centerY + spokeInnerR * Math.sin(rad)),
    x2: r4(centerX + spokeOuterR * Math.cos(rad)), y2: r4(centerY + spokeOuterR * Math.sin(rad)),
  };
});

const bolts = [{ id: 'a', deg: 210 }, { id: 'b', deg: -30 }, { id: 'c', deg: 150 }, { id: 'd', deg: 30 }].map(({ id, deg }) => ({
  id, cx: r4(centerX + outerRingR * Math.cos((deg * Math.PI) / 180)), cy: r4(centerY + outerRingR * Math.sin((deg * Math.PI) / 180)),
}));

const TRACK_POINTS = [
  { id: 'dial',  cx: centerX,       cy: centerY,       label: 'DIAL_CTR',  baseCoord: `${centerX}.0000, ${centerY}.0000` },
  { id: 'hub',   cx: r4(centerX + hubOuterR * Math.cos(Math.PI * 0.25)), cy: r4(centerY - hubOuterR * Math.sin(Math.PI * 0.25)), label: 'HUB_RING', baseCoord: `${r4(centerX + hubOuterR * 0.707)}, ${r4(centerY - hubOuterR * 0.707)}` },
  { id: 'bolt0', cx: bolts[0].cx,   cy: bolts[0].cy,   label: 'BOLT_TL',   baseCoord: `${bolts[0].cx}, ${bolts[0].cy}` },
  { id: 'bolt1', cx: bolts[1].cx,   cy: bolts[1].cy,   label: 'BOLT_TR',   baseCoord: `${bolts[1].cx}, ${bolts[1].cy}` },
  { id: 'bolt2', cx: bolts[2].cx,   cy: bolts[2].cy,   label: 'BOLT_BL',   baseCoord: `${bolts[2].cx}, ${bolts[2].cy}` },
  { id: 'bolt3', cx: bolts[3].cx,   cy: bolts[3].cy,   label: 'BOLT_BR',   baseCoord: `${bolts[3].cx}, ${bolts[3].cy}` },
];

const MESH_LINES = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [2, 4], [3, 5],
];

export default function VaultHero() {
  const heroRef = useRef<HTMLElement>(null);
  const vaultBgRef = useRef<HTMLDivElement>(null);
  const vaultFgRef = useRef<HTMLDivElement>(null);
  const trackingRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<SVGGElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  const ringRefs = [
    useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null),
    useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null),
  ];
  const ringRadii = [outerRingR, outerRingR - 10, doorFaceR, midRingR, hubOuterR, hubInnerR];

  const [trackCoords, setTrackCoords] = useState(TRACK_POINTS.map(p => p.baseCoord));
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const [trackOpacity, setTrackOpacity] = useState(0);

  useEffect(() => {
    let destroyed = false;
    let idleAnimFrame: number;
    let flickerInterval: ReturnType<typeof setInterval>;
    let isMouseOver = false;
    let idleT = 0;

    const pos = { bgX: 0, bgY: 0, fgX: 0, fgY: 0 };
    const target = { bgX: 0, bgY: 0, fgX: 0, fgY: 0 };
    const BG_STRENGTH = 12;
    const FG_STRENGTH = 22;

    function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

    function applyTransforms() {
      if (vaultBgRef.current) vaultBgRef.current.style.transform = `translate(${pos.bgX}px, ${pos.bgY}px)`;
      if (vaultFgRef.current) vaultFgRef.current.style.transform = `translate(${pos.fgX}px, ${pos.fgY}px)`;
      if (trackingRef.current) trackingRef.current.style.transform = `translate(${pos.fgX}px, ${pos.fgY}px)`;
    }

    function tick() {
      if (destroyed) return;
      if (isMouseOver) {
        pos.bgX = lerp(pos.bgX, target.bgX, 0.06);
        pos.bgY = lerp(pos.bgY, target.bgY, 0.06);
        pos.fgX = lerp(pos.fgX, target.fgX, 0.06);
        pos.fgY = lerp(pos.fgY, target.fgY, 0.06);
      } else {
        idleT += 0.004;
        const ix = Math.sin(idleT * 0.7) * 5;
        const iy = Math.sin(idleT) * 4;
        target.bgX = -ix * 0.6; target.bgY = -iy * 0.6;
        target.fgX = ix; target.fgY = iy;
        pos.bgX = lerp(pos.bgX, target.bgX, 0.02);
        pos.bgY = lerp(pos.bgY, target.bgY, 0.02);
        pos.fgX = lerp(pos.fgX, target.fgX, 0.02);
        pos.fgY = lerp(pos.fgY, target.fgY, 0.02);
      }
      applyTransforms();
      idleAnimFrame = requestAnimationFrame(tick);
    }

    function onMouseMove(e: MouseEvent) {
      const hero = heroRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      target.bgX = nx * BG_STRENGTH; target.bgY = ny * BG_STRENGTH;
      target.fgX = nx * FG_STRENGTH; target.fgY = ny * FG_STRENGTH;
    }

    function onMouseEnter() { isMouseOver = true; }
    function onMouseLeave() {
      isMouseOver = false;
      target.bgX = 0; target.bgY = 0; target.fgX = 0; target.fgY = 0;
      setActivePoint(null);
    }

    function startFlicker() {
      flickerInterval = setInterval(() => {
        if (destroyed) return;
        setTrackCoords(prev => prev.map((coord, i) => {
          if (Math.random() > 0.65) return coord;
          const base = TRACK_POINTS[i];
          const noise = () => r4((Math.random() - 0.5) * 0.8);
          const parts = base.baseCoord.split(', ');
          return `${r4(parseFloat(parts[0]) + noise())}, ${r4(parseFloat(parts[1]) + noise())}`;
        }));
        if (Math.random() > 0.7) {
          const idx = Math.floor(Math.random() * TRACK_POINTS.length);
          setActivePoint(TRACK_POINTS[idx].id);
          setTimeout(() => setActivePoint(null), 400);
        }
      }, 800);
    }

    async function init() {
      const { animate } = await import('animejs');
      if (destroyed) return;

      if (heroRef.current) animate(heroRef.current, { opacity: [0, 1], duration: 500, easing: 'easeOutQuart' });
      if (vaultBgRef.current) animate(vaultBgRef.current, { opacity: [0, 0.11], duration: 1000, delay: 100, easing: 'easeOutQuart' });

      const delays = [0, 200, 380, 540, 680, 800];
      ringRefs.forEach((ref, i) => {
        const el = ref.current;
        if (!el) return;
        const c = circ(ringRadii[i]);
        el.style.strokeDasharray = `${c}`;
        el.style.strokeDashoffset = `${c}`;
        animate(el, { strokeDashoffset: [c, 0], duration: 1600, delay: delays[i], easing: 'easeInOutQuart' });
      });

      if (vaultFgRef.current) animate(vaultFgRef.current, { opacity: [0, 1], duration: 700, delay: 200, easing: 'easeOutQuart' });
      if (dialRef.current) animate(dialRef.current, { rotate: 360, duration: 18000, easing: 'linear', loop: true });

      const textEls = [badgeRef.current, headlineRef.current, subtextRef.current, btnRef.current];
      textEls.forEach((el, i) => {
        if (!el) return;
        animate(el, { opacity: [0, 1], translateY: [20, 0], duration: 700, delay: 700 + i * 130, easing: 'easeOutQuart' });
      });

      setTimeout(() => { if (!destroyed) setTrackOpacity(1); }, 1400);
      startFlicker();

      idleAnimFrame = requestAnimationFrame(tick);
      const hero = heroRef.current;
      if (hero) {
        hero.addEventListener('mousemove', onMouseMove);
        hero.addEventListener('mouseenter', onMouseEnter);
        hero.addEventListener('mouseleave', onMouseLeave);
      }
    }

    init();
    return () => {
      destroyed = true;
      cancelAnimationFrame(idleAnimFrame);
      clearInterval(flickerInterval);
      const hero = heroRef.current;
      if (hero) {
        hero.removeEventListener('mousemove', onMouseMove);
        hero.removeEventListener('mouseenter', onMouseEnter);
        hero.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);

  return (
    <section
      ref={heroRef}
      style={{ opacity: 0 }}
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0C1A2B]"
    >
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #1e1e1e 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 25%, rgba(4,4,4,0.9) 100%)' }} />

      {/* Inner glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(182,255,59,0.05) 0%, transparent 70%)' }} />

      {/* DEEP LAYER */}
      <div ref={vaultBgRef} className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0, willChange: 'transform' }}>
        <svg viewBox="30 30 440 440" xmlns="http://www.w3.org/2000/svg"
          style={{ width: 'min(110vw, 960px)', height: 'auto', filter: 'drop-shadow(0 0 80px rgba(182,255,59,0.03))' }}>
          <circle cx={centerX} cy={centerY} r={outerRingR} fill="none" stroke={STROKE} strokeWidth="2" />
          <circle cx={centerX} cy={centerY} r={outerRingR - 10} fill="none" stroke={STROKE} strokeWidth="0.75" />
          {rivets.map((rv, i) => <circle key={i} cx={rv.cx} cy={rv.cy} r="4" fill="none" stroke={STROKE} strokeWidth="1" />)}
          <circle cx={centerX} cy={centerY} r={doorFaceR} fill="none" stroke={STROKE} strokeWidth="1.5" />
          <circle cx={centerX} cy={centerY} r={midRingR} fill="none" stroke={STROKE} strokeWidth="1.25" />
          <circle cx={centerX} cy={centerY} r={hubOuterR} fill="none" stroke={STROKE} strokeWidth="1.25" />
          <circle cx={centerX} cy={centerY} r={hubInnerR} fill="none" stroke={STROKE} strokeWidth="1" />
          {bolts.map(({ id, cx, cy }) => <circle key={id} cx={cx} cy={cy} r="7" fill="none" stroke={STROKE} strokeWidth="1.25" />)}
          <g stroke={STROKE} strokeWidth="1.25" fill="none">
            <rect x={centerX + outerRingR - 12} y={centerY - 120} width="60" height="40" rx="5" />
            <rect x={centerX + outerRingR - 12} y={centerY + 80} width="60" height="40" rx="5" />
          </g>
        </svg>
      </div>

      {/* NEAR LAYER */}
      <div ref={vaultFgRef} className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: 0, willChange: 'transform', filter: 'drop-shadow(0 0 40px rgba(182,255,59,0.08)) drop-shadow(0 0 90px rgba(182,255,59,0.04))' }}>
        <svg viewBox="30 30 440 440" xmlns="http://www.w3.org/2000/svg"
          style={{ width: 'min(80vw, 700px)', height: 'auto' }}>
          <circle ref={ringRefs[0]} cx={centerX} cy={centerY} r={outerRingR} fill="none" stroke={STROKE_FG} strokeWidth="2.5" />
          <circle ref={ringRefs[1]} cx={centerX} cy={centerY} r={outerRingR - 10} fill="none" stroke={STROKE_FG} strokeWidth="1" />
          {rivets.map((rv, i) => <circle key={i} cx={rv.cx} cy={rv.cy} r="5" fill="none" stroke={STROKE_FG} strokeWidth="1.25" />)}
          <circle ref={ringRefs[2]} cx={centerX} cy={centerY} r={doorFaceR} fill="none" stroke={STROKE_FG} strokeWidth="2" />
          <circle ref={ringRefs[3]} cx={centerX} cy={centerY} r={midRingR} fill="none" stroke={STROKE_FG} strokeWidth="1.5" />
          <circle ref={ringRefs[4]} cx={centerX} cy={centerY} r={hubOuterR} fill="none" stroke={STROKE_FG} strokeWidth="1.75" />
          <circle ref={ringRefs[5]} cx={centerX} cy={centerY} r={hubInnerR} fill="none" stroke={STROKE_FG} strokeWidth="1.25" />
          <g ref={dialRef} style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
            <g stroke={STROKE_FG} strokeWidth="1.5" fill="none">
              {spokes.map((sp, i) => <line key={i} x1={sp.x1} y1={sp.y1} x2={sp.x2} y2={sp.y2} />)}
            </g>
            <circle cx={centerX} cy={centerY} r={centerR} fill="none" stroke={STROKE_ACCENT} strokeWidth="2" />
          </g>
          {bolts.map(({ id, cx, cy }) => <circle key={id} cx={cx} cy={cy} r="8" fill="none" stroke={STROKE_FG} strokeWidth="1.5" />)}
          <g stroke={STROKE_FG} strokeWidth="1.5" fill="none">
            <rect x={centerX + outerRingR - 12} y={centerY - 120} width="60" height="40" rx="5" />
            <rect x={centerX + outerRingR - 12} y={centerY + 80} width="60" height="40" rx="5" />
          </g>
          <rect x={centerX + outerRingR + 8} y={centerY - 22} width="28" height="44" rx="6" fill="none" stroke={STROKE_FG} strokeWidth="2" />
        </svg>
      </div>

      {/* TRACKING OVERLAY */}
      <div ref={trackingRef} className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: trackOpacity, willChange: 'transform', transition: 'opacity 0.8s ease' }}>
        <svg viewBox="30 30 440 440" xmlns="http://www.w3.org/2000/svg"
          style={{ width: 'min(80vw, 700px)', height: 'auto' }}>
          {MESH_LINES.map(([a, b], i) => (
            <line key={i}
              x1={TRACK_POINTS[a].cx} y1={TRACK_POINTS[a].cy}
              x2={TRACK_POINTS[b].cx} y2={TRACK_POINTS[b].cy}
              stroke={TRACK_COLOR} strokeWidth="0.4" opacity="0.2" strokeDasharray="3 4" />
          ))}
          {TRACK_POINTS.map((pt, i) => {
            const isActive = activePoint === pt.id;
            const boxSize = 14;
            const cornerLen = 4;
            const bx = pt.cx - boxSize / 2;
            const by = pt.cy - boxSize / 2;
            const opacity = isActive ? 1 : 0.45;
            const color = isActive ? '#e8ffaa' : TRACK_COLOR;
            return (
              <g key={pt.id} opacity={opacity} style={{ transition: 'opacity 0.15s' }}>
                <path d={`M ${bx + cornerLen} ${by} L ${bx} ${by} L ${bx} ${by + cornerLen}`} fill="none" stroke={color} strokeWidth="0.8" />
                <path d={`M ${bx + boxSize - cornerLen} ${by} L ${bx + boxSize} ${by} L ${bx + boxSize} ${by + cornerLen}`} fill="none" stroke={color} strokeWidth="0.8" />
                <path d={`M ${bx} ${by + boxSize - cornerLen} L ${bx} ${by + boxSize} L ${bx + cornerLen} ${by + boxSize}`} fill="none" stroke={color} strokeWidth="0.8" />
                <path d={`M ${bx + boxSize - cornerLen} ${by + boxSize} L ${bx + boxSize} ${by + boxSize} L ${bx + boxSize} ${by + boxSize - cornerLen}`} fill="none" stroke={color} strokeWidth="0.8" />
                <circle cx={pt.cx} cy={pt.cy} r="1.2" fill={color} />
                <text x={pt.cx + (pt.cx > centerX ? boxSize : -boxSize) + (pt.cx > centerX ? 3 : -3)} y={pt.cy - 4}
                  fill={color} fontSize="5.5" fontFamily="monospace" textAnchor={pt.cx > centerX ? 'start' : 'end'} opacity="0.9">
                  {pt.label}
                </text>
                <text x={pt.cx + (pt.cx > centerX ? boxSize : -boxSize) + (pt.cx > centerX ? 3 : -3)} y={pt.cy + 4}
                  fill={color} fontSize="4.5" fontFamily="monospace" textAnchor={pt.cx > centerX ? 'start' : 'end'} opacity="0.7">
                  {trackCoords[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* TEXT */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-6">
        <div ref={badgeRef} style={{ opacity: 0, borderColor: '#B6FF3B30', color: '#B6FF3B' }}
          className="border px-4 py-1.5 font-mono text-xs tracking-[0.25em] uppercase">
          UI Component Library
        </div>

        <div ref={headlineRef} style={{ opacity: 0 }}>
          <h1 className="uppercase leading-none" style={{
            fontFamily: "'Ethnocentric', monospace",
            fontSize: 'clamp(3rem, 9vw, 7.5rem)',
            letterSpacing: '0.02em',
            color: '#ffffff',
          }}>THE VAULT</h1>
          <p className="uppercase leading-none mt-2" style={{
            fontFamily: "'Ethnocentric', monospace",
            fontSize: 'clamp(1rem, 3vw, 2.25rem)',
            letterSpacing: '0.08em',
            color: 'white',
            textShadow: '0 0 20px #B6FF3B, 0 0 40px #B6FF3B, 0 0 80px rgba(182,255,59,0.5)',
          }}>BUILT FOR BUILDERS</p>
        </div>

        <p ref={subtextRef} style={{ opacity: 0 }}
          className="font-mono text-sm text-neutral-500 max-w-md leading-relaxed">
          Free, open UI components — grab the code, ship faster.
        </p>

        <div ref={btnRef} style={{ opacity: 0 }} className="flex items-center gap-4 mt-2">
          <button
            onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })}
            className="relative font-mono text-xs tracking-widest uppercase px-8 py-3 transition-all duration-300 overflow-hidden"
            style={{
              background: 'repeating-linear-gradient(45deg, #080808, #080808 10px, #0C1A2B 10px, #0C1A2B 20px)',
              color: '#B6FF3B',
              border: '1px solid rgba(182,255,59,0.3)',
            }}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.background = '#B6FF3B';
              btn.style.color = '#0C1A2B';
              btn.style.border = '1px solid #B6FF3B';
              btn.querySelectorAll<HTMLSpanElement>('.corner').forEach(c => { c.style.opacity = '1'; });
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.background = 'repeating-linear-gradient(45deg, #080808, #080808 10px, #0C1A2B 10px, #0C1A2B 20px)';
              btn.style.color = '#B6FF3B';
              btn.style.border = '1px solid rgba(182,255,59,0.3)';
              btn.querySelectorAll<HTMLSpanElement>('.corner').forEach(c => { c.style.opacity = '0'; });
            }}
          >
            <span className="corner absolute top-0.5 left-0.5 w-3 h-3 border-t-2 border-l-2 border-[#0C1A2B] transition-opacity duration-200" style={{ opacity: 0 }} />
            <span className="corner absolute top-0.5 right-0.5 w-3 h-3 border-t-2 border-r-2 border-[#0C1A2B] transition-opacity duration-200" style={{ opacity: 0 }} />
            <span className="corner absolute bottom-0.5 left-0.5 w-3 h-3 border-b-2 border-l-2 border-[#0C1A2B] transition-opacity duration-200" style={{ opacity: 0 }} />
            <span className="corner absolute bottom-0.5 right-0.5 w-3 h-3 border-b-2 border-r-2 border-[#0C1A2B] transition-opacity duration-200" style={{ opacity: 0 }} />
            Browse Components ↓
          </button>
        </div>
      </div>

      {/* Accent lines */}
      <div className="absolute left-0 top-1/4 w-px h-32 opacity-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #B6FF3B, transparent)' }} />
      <div className="absolute right-0 top-1/4 w-px h-32 opacity-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #B6FF3B, transparent)' }} />

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-8 opacity-40"
          style={{ background: 'linear-gradient(to bottom, #B6FF3B, transparent)' }} />
      </div>
    </section>
  );
}