/* Shared primitives — Logo, Avatar, Pill, Money counter, MoneyParticles, etc. */

const { useEffect, useState, useRef, useCallback, useMemo } = React;

/* ── FundWise mark (the strata logo) ── */
function Logo({ size=28, variant='gradient' }) {
  const id = useMemo(()=> 'lg' + Math.random().toString(36).slice(2,7), []);
  if (variant === 'white') {
    return (
      <svg width={size} height={size} viewBox="0 0 96 96">
        <rect x="14" y="22" width="68" height="14" rx="7" fill="#fff" opacity="0.65" transform="rotate(-2 48 29)"/>
        <rect x="11" y="41" width="74" height="14" rx="7" fill="#fff" opacity="0.85"/>
        <rect x="17" y="60" width="62" height="14" rx="7" fill="#fff" transform="rotate(2 48 67)"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={id+'-d'} x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A4D2C"/><stop offset="1" stopColor="#0D6B3A"/>
        </linearGradient>
        <linearGradient id={id+'-m'} x1="8" y1="32" x2="88" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0D6B3A"/><stop offset="1" stopColor="#1A9151"/>
        </linearGradient>
        <linearGradient id={id+'-l'} x1="8" y1="56" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1A9151"/><stop offset="1" stopColor="#4EC98A"/>
        </linearGradient>
      </defs>
      <rect x="14" y="22" width="68" height="14" rx="7" fill={`url(#${id}-d)`} transform="rotate(-2 48 29)"/>
      <rect x="11" y="41" width="74" height="14" rx="7" fill={`url(#${id}-m)`}/>
      <rect x="17" y="60" width="62" height="14" rx="7" fill={`url(#${id}-l)`} transform="rotate(2 48 67)"/>
    </svg>
  );
}

function Wordmark({ size=22, color }) {
  return (
    <span style={{
      fontFamily: FONT_SERIF, fontSize: size, color: color || BRAND.ink,
      letterSpacing: '-0.5px', lineHeight: 1, fontWeight: 400,
    }}>
      Fund<span style={{ fontStyle:'italic' }}>w</span>ise
    </span>
  );
}

function LogoLockup({ size=24, color }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
      <Logo size={size}/>
      <Wordmark size={size*0.95} color={color}/>
    </div>
  );
}

/* ── Avatar (initial circle in person's color) ── */
function Avatar({ who, size=32, ring }) {
  const p = personOf(who);
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background: p.color, color:'#fff',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily: FONT_SANS, fontWeight:700, fontSize: size*0.42,
      flexShrink:0, letterSpacing:'-0.02em',
      boxShadow: ring ? `0 0 0 2px ${BRAND.bg}, 0 0 0 ${ring}px ${p.color}33` : 'none',
    }}>{p.initial}</div>
  );
}

/* ── Avatar stack (overlapping) ── */
function AvatarStack({ whos, size=24, max=4, ringColor }) {
  const shown = whos.slice(0, max);
  const rest = whos.length - max;
  return (
    <div style={{ display:'inline-flex', alignItems:'center' }}>
      {shown.map((w, i) => (
        <div key={i} style={{ marginLeft: i===0 ? 0 : -size*0.35,
          boxShadow: `0 0 0 2px ${ringColor || BRAND.bg}`, borderRadius:'50%' }}>
          <Avatar who={w} size={size}/>
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          marginLeft: -size*0.35,
          width:size, height:size, borderRadius:'50%',
          background: BRAND.surface2, color: BRAND.ink2,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontFamily: FONT_SANS, fontWeight:700, fontSize: size*0.38,
          boxShadow:`0 0 0 2px ${ringColor || BRAND.bg}`,
        }}>+{rest}</div>
      )}
    </div>
  );
}

/* ── Mode badge ── */
function ModeBadge({ mode, size='sm' }) {
  const isSplit = mode === 'split';
  const px = size === 'sm' ? 8 : 10;
  const py = size === 'sm' ? 3 : 4;
  const fs = size === 'sm' ? 10 : 11;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:`${py}px ${px}px`, borderRadius:100,
      background: isSplit ? BRAND.gPale : BRAND.bPale,
      color: isSplit ? BRAND.gForest : BRAND.bMid,
      border:`1px solid ${isSplit ? BRAND.border2 : BRAND.bBorder}`,
      fontFamily: FONT_SANS, fontSize: fs, fontWeight:700, letterSpacing:'0.04em',
      textTransform:'uppercase',
    }}>
      <span style={{
        width:5, height:5, borderRadius:'50%',
        background: isSplit ? BRAND.gFresh : BRAND.bFresh,
      }}/>
      {isSplit ? 'Split' : 'Fund'}
    </span>
  );
}

/* ── Animated money counter ── */
function MoneyCounter({ value, prefix='$', sign=false, duration=900, style={} }) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (value === displayed) return;
    fromRef.current = displayed;
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);
    const animate = (t) => {
      if (!startRef.current) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(fromRef.current + (value - fromRef.current) * ease);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
      else setDisplayed(value);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const abs = Math.abs(displayed).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  let str;
  if (sign) {
    if (displayed > 0.005) str = '+' + prefix + abs;
    else if (displayed < -0.005) str = '−' + prefix + abs;
    else str = prefix + abs;
  } else {
    str = prefix + abs;
  }
  return <span style={style}>{str}</span>;
}

/* ── Sparkline ── */
function Sparkline({ data, color=BRAND.gMid, width=120, height=32, fill=true }) {
  const max = Math.max(...data.map(d=>d.v));
  const min = Math.min(...data.map(d=>d.v));
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length-1)) * width;
    const y = height - 4 - ((d.v - min) / range) * (height - 8);
    return [x, y];
  });
  const d = 'M ' + pts.map(([x,y])=> x.toFixed(1)+' '+y.toFixed(1)).join(' L ');
  const fillD = d + ` L ${width} ${height} L 0 ${height} Z`;
  const id = useMemo(()=> 'sp'+Math.random().toString(36).slice(2,7), []);
  return (
    <svg width={width} height={height} style={{ overflow:'visible' }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={color} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={fillD} fill={`url(#${id})`}/>
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.length && (
        <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color}/>
      )}
    </svg>
  );
}

/* ── Pill button ── */
function Pill({ children, active, onClick, color=BRAND.gMid, bg=BRAND.gPale, border=BRAND.border2 }) {
  return (
    <button onClick={onClick} style={{
      padding:'7px 12px', borderRadius:100, border:`1px solid ${active ? border : BRAND.border}`,
      background: active ? bg : BRAND.bg, color: active ? color : BRAND.ink2,
      fontFamily: FONT_SANS, fontSize:12, fontWeight:600, cursor:'pointer',
      transition:'all 0.15s', whiteSpace:'nowrap',
    }}>{children}</button>
  );
}

/* ── Vote progress bar with threshold marker ── */
function VoteBar({ yes, no, total, threshold, color=BRAND.bMid, height=6 }) {
  const yesPct = (yes/total)*100;
  const noPct = (no/total)*100;
  const threshPct = (threshold/total)*100;
  return (
    <div style={{ position:'relative', width:'100%', height, background:BRAND.surface2, borderRadius:height/2, overflow:'visible' }}>
      <div style={{
        position:'absolute', left:0, top:0, height:'100%',
        width:`${yesPct}%`, background: color, borderRadius:height/2,
        transition:'width 0.5s cubic-bezier(0.22,1.4,0.36,1)',
      }}/>
      <div style={{
        position:'absolute', left:`${yesPct}%`, top:0, height:'100%',
        width:`${noPct}%`, background: BRAND.red, opacity:0.7,
        transition:'width 0.5s cubic-bezier(0.22,1.4,0.36,1)',
      }}/>
      {/* threshold tick */}
      <div style={{
        position:'absolute', left:`${threshPct}%`, top:-3, height:height+6, width:2,
        background: BRAND.ink, borderRadius:1, transform:'translateX(-1px)',
      }}/>
    </div>
  );
}

/* ── Skeleton-style stripe placeholder for imagery ── */
function ImagePlaceholder({ ratio='3/2', label, radius=12, style={} }) {
  return (
    <div style={{
      aspectRatio: ratio, width:'100%', borderRadius: radius,
      border:`1px dashed ${BRAND.border}`,
      backgroundImage:`repeating-linear-gradient(45deg, ${BRAND.surface}, ${BRAND.surface} 8px, ${BRAND.bg} 8px, ${BRAND.bg} 16px)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily: FONT_MONO, fontSize:11, color:BRAND.ink3,
      ...style,
    }}>{label}</div>
  );
}

/* ── Inline icons (stroke style, 20px default) ── */
function Icon({ name, size=18, color='currentColor', strokeWidth=1.75 }) {
  const sw = strokeWidth;
  const props = { width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:sw, strokeLinecap:'round', strokeLinejoin:'round' };
  switch (name) {
    case 'home':    return <svg {...props}><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>;
    case 'groups':  return <svg {...props}><circle cx="9" cy="9" r="3.5"/><circle cx="17" cy="11" r="2.5"/><path d="M3 19c1-3 3.5-4.5 6-4.5s5 1.5 6 4.5M14 19c.5-2 2-3 3-3s2.5 1 3 3"/></svg>;
    case 'activity':return <svg {...props}><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>;
    case 'wallet':  return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 13h2M3 9h18"/></svg>;
    case 'user':    return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/></svg>;
    case 'plus':    return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus':   return <svg {...props}><path d="M5 12h14"/></svg>;
    case 'arrow-r': return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-l': return <svg {...props}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case 'arrow-up':return <svg {...props}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-dn':return <svg {...props}><path d="M12 5v14M5 12l7 7 7-7"/></svg>;
    case 'chevron-r':return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-l':return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chevron-d':return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case 'close':   return <svg {...props}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'check':   return <svg {...props}><path d="M5 12l5 5L20 7"/></svg>;
    case 'search':  return <svg {...props}><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>;
    case 'filter':  return <svg {...props}><path d="M4 5h16M7 12h10M10 19h4"/></svg>;
    case 'bell':    return <svg {...props}><path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 21a2 2 0 004 0"/></svg>;
    case 'send':    return <svg {...props}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>;
    case 'split':   return <svg {...props}><path d="M6 3v6c0 2.5 2 4 4 4h4c2 0 4 1.5 4 4v4M16 3l5 3-5 3M8 21l-5-3 5-3"/></svg>;
    case 'fund':    return <svg {...props}><path d="M12 21c-5 0-8-3-8-7v-3l8-5 8 5v3c0 4-3 7-8 7zM8 13l3 3 5-6"/></svg>;
    case 'vote':    return <svg {...props}><path d="M4 7l3 3 5-6M4 14l3 3 5-6M14 9h6M14 16h6"/></svg>;
    case 'sparkles':return <svg {...props}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 15l.7 2 2 .7-2 .7L19 21l-.7-2-2-.7 2-.7zM5 17l.5 1.4L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z"/></svg>;
    case 'settings':return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case 'qr':      return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h7M17 17v4"/></svg>;
    case 'copy':    return <svg {...props}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>;
    case 'link':    return <svg {...props}><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66l1-1"/></svg>;
    case 'lock':    return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'receipt': return <svg {...props}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4"/></svg>;
    case 'clock':   return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'comment': return <svg {...props}><path d="M21 12a9 9 0 11-3-6.7L21 4l-1.3 3A9 9 0 0121 12z"/></svg>;
    case 'attach':  return <svg {...props}><path d="M21 11l-9 9a5 5 0 01-7-7l9-9a3 3 0 014 4l-9 9a1 1 0 01-1.5-1.5L15 7"/></svg>;
    case 'play':    return <svg {...props}><path d="M7 4l13 8-13 8z" fill={color}/></svg>;
    case 'menu':    return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
    case 'sun':     return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>;
    case 'phone':   return <svg {...props}><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>;
    case 'tg':      return <svg {...props}><path d="M22 3L2 11l5 2 2 6 3-4 5 4 5-16z"/></svg>;
    default:        return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

Object.assign(window, { Logo, Wordmark, LogoLockup, Avatar, AvatarStack, ModeBadge, MoneyCounter, Sparkline, Pill, VoteBar, ImagePlaceholder, Icon });
