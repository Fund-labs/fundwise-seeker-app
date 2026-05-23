/* Premium polish — mesh gradients, sparkles, shimmer, ambient motion. */

const { useEffect: useEffectP, useRef: useRefP, useState: useStateP } = React;

/* Inject CSS keyframes once */
(function injectPremiumCSS() {
  if (document.getElementById('fw-premium-css')) return;
  const s = document.createElement('style');
  s.id = 'fw-premium-css';
  s.textContent = `
    @keyframes fw-blob-1 {
      0%,100% { transform: translate3d(0,0,0) scale(1); }
      33%     { transform: translate3d(20%,-15%,0) scale(1.15); }
      66%     { transform: translate3d(-15%,20%,0) scale(0.9); }
    }
    @keyframes fw-blob-2 {
      0%,100% { transform: translate3d(0,0,0) scale(1); }
      40%     { transform: translate3d(-20%,15%,0) scale(1.2); }
      75%     { transform: translate3d(15%,-25%,0) scale(0.85); }
    }
    @keyframes fw-blob-3 {
      0%,100% { transform: translate3d(0,0,0) scale(1.1); }
      50%     { transform: translate3d(25%,25%,0) scale(0.95); }
    }
    @keyframes fw-shimmer-bg {
      0%   { background-position: 200% 0%; }
      100% { background-position: -200% 0%; }
    }
    @keyframes fw-shimmer {
      0%   { transform: translateX(-200%) skewX(-20deg); opacity: 0; }
      30%  { opacity: 0.55; }
      70%  { opacity: 0.55; }
      100% { transform: translateX(200%) skewX(-20deg); opacity: 0; }
    }
    @keyframes fw-twinkle {
      0%,100% { opacity: 0; transform: scale(0.4); }
      50%     { opacity: 1; transform: scale(1); }
    }
    @keyframes fw-breathe {
      0%,100% { transform: scale(1); opacity: 0.55; }
      50%     { transform: scale(1.08); opacity: 0.75; }
    }
    @keyframes fw-bar-shine {
      0%   { transform: translateX(-120%); }
      100% { transform: translateX(220%); }
    }
    @keyframes fw-bob {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-4px); }
    }
    @keyframes fw-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fw-pulse-ring {
      0%   { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
      100% { box-shadow: 0 0 0 12px currentColor; opacity: 0; }
    }
    @keyframes fw-coin-spin {
      0%,100% { transform: rotateY(0); }
      50%     { transform: rotateY(15deg); }
    }

    /* Group-card hover lift */
    .fw-hover-card {
      transition: transform 0.35s cubic-bezier(0.22,1.36,0.34,1),
                  box-shadow 0.35s ease, border-color 0.25s ease;
    }
    .fw-hover-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(13,31,20,0.08), 0 4px 10px rgba(13,31,20,0.04);
    }

    /* Subtle button hover lift */
    .fw-btn {
      transition: transform 0.18s ease, box-shadow 0.25s ease, filter 0.2s ease;
      position: relative; overflow: hidden;
    }
    .fw-btn:hover { transform: translateY(-1px); }
    .fw-btn:active { transform: translateY(0) scale(0.985); }

    /* Bottom-sheet entry */
    .fw-sheet-enter { animation: fw-fade-up 0.45s cubic-bezier(0.22,1,0.36,1); }

    /* Staggered list entry */
    .fw-stagger > * {
      opacity: 0;
      animation: fw-fade-up 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
    }
    .fw-stagger > *:nth-child(1) { animation-delay: 0.04s; }
    .fw-stagger > *:nth-child(2) { animation-delay: 0.10s; }
    .fw-stagger > *:nth-child(3) { animation-delay: 0.16s; }
    .fw-stagger > *:nth-child(4) { animation-delay: 0.22s; }
    .fw-stagger > *:nth-child(5) { animation-delay: 0.28s; }
    .fw-stagger > *:nth-child(6) { animation-delay: 0.34s; }
    .fw-stagger > *:nth-child(7) { animation-delay: 0.40s; }
    .fw-stagger > *:nth-child(8) { animation-delay: 0.46s; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `;
  document.head.appendChild(s);
})();

/* ── Animated mesh gradient ── Three drifting blobs behind hero content */
function MeshGradient({ colors=['#fff','#fff','#fff'], intensity=0.22, radius=18 }) {
  return (
    <div style={{
      position:'absolute', inset:0, borderRadius:radius, overflow:'hidden',
      pointerEvents:'none', mixBlendMode:'screen',
    }}>
      <div style={{
        position:'absolute', top:'-30%', left:'-20%', width:'70%', height:'120%',
        borderRadius:'50%', background:`radial-gradient(circle, ${colors[0]} 0%, transparent 65%)`,
        opacity: intensity, filter:'blur(8px)', animation:'fw-blob-1 14s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', top:'-15%', right:'-25%', width:'80%', height:'130%',
        borderRadius:'50%', background:`radial-gradient(circle, ${colors[1]} 0%, transparent 60%)`,
        opacity: intensity * 0.9, filter:'blur(10px)', animation:'fw-blob-2 18s ease-in-out infinite',
      }}/>
      <div style={{
        position:'absolute', bottom:'-30%', left:'10%', width:'60%', height:'100%',
        borderRadius:'50%', background:`radial-gradient(circle, ${colors[2]} 0%, transparent 65%)`,
        opacity: intensity * 0.7, filter:'blur(12px)', animation:'fw-blob-3 22s ease-in-out infinite',
      }}/>
    </div>
  );
}

/* ── Diagonal shimmer sweep ── Slow shine across hero gradient */
function Shimmer({ delay=0, dur=8, radius=18 }) {
  return (
    <div style={{
      position:'absolute', inset:0, borderRadius:radius, overflow:'hidden', pointerEvents:'none',
    }}>
      <div style={{
        position:'absolute', top:0, bottom:0, width:'40%',
        background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
        animation: `fw-shimmer ${dur}s linear infinite`,
        animationDelay: `${delay}s`,
      }}/>
    </div>
  );
}

/* ── Twinkling sparkle dots ── */
function Sparkles({ count=8, color='#fff', size=2 }) {
  const dots = React.useMemo(() => Array.from({length: count}).map((_, i) => ({
    top:  Math.random() * 90 + 5,
    left: Math.random() * 90 + 5,
    sz:   size + Math.random() * 1.5,
    dur:  2.5 + Math.random() * 3,
    delay: Math.random() * 4,
  })), [count, size]);
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {dots.map((d, i) => (
        <div key={i} style={{
          position:'absolute', top:`${d.top}%`, left:`${d.left}%`,
          width:d.sz, height:d.sz, borderRadius:'50%', background: color,
          boxShadow:`0 0 ${d.sz*3}px ${color}`,
          animation:`fw-twinkle ${d.dur}s ease-in-out infinite`,
          animationDelay:`${d.delay}s`, opacity:0,
        }}/>
      ))}
    </div>
  );
}

/* ── Progress bar shine sweep ── Use on top of any filled bar */
function BarShine({ active=true, radius=4 }) {
  if (!active) return null;
  return (
    <div style={{
      position:'absolute', inset:0, borderRadius:radius, overflow:'hidden', pointerEvents:'none',
    }}>
      <div style={{
        position:'absolute', top:0, bottom:0, width:'30%',
        background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
        animation:'fw-bar-shine 3.5s ease-in-out infinite',
      }}/>
    </div>
  );
}

/* ── Premium hero gradient card ── A drop-in replacement for hero gradient sections.
   Renders the gradient + mesh + shimmer + sparkles + content. */
function HeroGradient({ background, color='#fff', radius=18, sparkleCount=6, sparkleColor='#fff', children, style={} }) {
  return (
    <div style={{
      borderRadius:radius, background, color, position:'relative', overflow:'hidden', ...style,
    }}>
      <MeshGradient colors={['#fff','#fff','#fff']} intensity={0.22} radius={radius}/>
      <Sparkles count={sparkleCount} color={sparkleColor} size={1.5}/>
      <Shimmer dur={9} radius={radius}/>
      <div style={{ position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
}

/* ── Premium surface ── Glass-edge inner highlight + outer ambient glow.
   Use for Fund-mode hero cards to signal premium / monetized surfaces. */
function PremiumSurface({ background, radius=18, glowColor='rgba(106,143,232,0.35)', gold=true, children, style={} }) {
  return (
    <div style={{
      position:'relative', borderRadius:radius, isolation:'isolate', ...style,
    }}>
      {/* outer ambient glow */}
      <div aria-hidden style={{
        position:'absolute', inset:-20, borderRadius:radius+8, pointerEvents:'none',
        background:`radial-gradient(ellipse at 50% 100%, ${glowColor} 0%, transparent 60%)`,
        filter:'blur(10px)', opacity:0.7, zIndex:0,
      }}/>
      <div style={{
        position:'relative', borderRadius:radius, background, overflow:'hidden', zIndex:1,
        boxShadow:'0 18px 40px rgba(11,30,77,0.18), 0 4px 12px rgba(11,30,77,0.08)',
      }}>
        <MeshGradient colors={['#fff','#fff','#fff']} intensity={0.18} radius={radius}/>
        <Sparkles count={5} color="#fff" size={1.4}/>
        {gold && <Sparkles count={2} color="#E8C77A" size={2}/>}
        <Shimmer dur={11} radius={radius}/>
        {/* inner top edge highlight */}
        <div aria-hidden style={{
          position:'absolute', top:0, left:0, right:0, height:1,
          background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
          zIndex:2,
        }}/>
        {/* inner left edge subtle highlight */}
        <div aria-hidden style={{
          position:'absolute', top:0, bottom:0, left:0, width:1,
          background:'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 60%)',
          zIndex:2,
        }}/>
        <div style={{ position:'relative', zIndex:3 }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Gold ribbon shimmer ── For premium markers (executed-status badges, vault icons) */
function GoldShimmer({ children, style={} }) {
  return (
    <span style={{
      position:'relative', display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 9px', borderRadius:100,
      background:'linear-gradient(135deg, #E8C77A 0%, #D4A85E 50%, #E8C77A 100%)',
      backgroundSize:'200% 100%',
      color:'#3D2A0B', fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
      animation:'fw-shimmer-bg 6s linear infinite',
      boxShadow:'inset 0 1px 0 rgba(255,255,255,0.4), 0 1px 2px rgba(184,133,42,0.25)',
      ...style,
    }}>{children}</span>
  );
}

Object.assign(window, { MeshGradient, Shimmer, Sparkles, BarShine, HeroGradient, PremiumSurface, GoldShimmer });
