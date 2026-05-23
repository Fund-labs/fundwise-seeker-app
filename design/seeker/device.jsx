/* Device frame + primitives (Logo, StatusBar, Avatar, BottomNav, NavHeader) */

function StrataLogo({ size=80 }) {
  const id = React.useMemo(()=>'sl' + Math.random().toString(36).slice(2,7), []);
  return (
    <svg width={size} height={size} viewBox="0 0 96 96">
      <defs>
        <linearGradient id={id+'d'} x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse"><stop stopColor="#0A4D2C"/><stop offset="1" stopColor="#0D6B3A"/></linearGradient>
        <linearGradient id={id+'m'} x1="8" y1="32" x2="88" y2="72" gradientUnits="userSpaceOnUse"><stop stopColor="#0D6B3A"/><stop offset="1" stopColor="#1A9151"/></linearGradient>
        <linearGradient id={id+'l'} x1="8" y1="56" x2="88" y2="88" gradientUnits="userSpaceOnUse"><stop stopColor="#1A9151"/><stop offset="1" stopColor="#4EC98A"/></linearGradient>
      </defs>
      <rect x="14" y="22" width="68" height="14" rx="7" fill={`url(#${id}d)`} transform="rotate(-2 48 29)"/>
      <rect x="11" y="41" width="74" height="14" rx="7" fill={`url(#${id}m)`}/>
      <rect x="17" y="60" width="62" height="14" rx="7" fill={`url(#${id}l)`} transform="rotate(2 48 67)"/>
    </svg>
  );
}

function StatusBar({ dark }) {
  return (
    <div className="status-bar" data-dark={dark?'1':'0'}>
      <div>9:41</div>
      <div className="right">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/>
          <rect x="4" y="5" width="3" height="6" rx="0.5" fill="currentColor"/>
          <rect x="8" y="2" width="3" height="9" rx="0.5" fill="currentColor"/>
          <rect x="12" y="0" width="3" height="11" rx="0.5" fill="currentColor"/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 10.5l-2-2a2.83 2.83 0 014 0l-2 2zM4 6.5l-2-2a8.49 8.49 0 0112 0l-2 2a5.66 5.66 0 00-8 0z" fill="currentColor"/>
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
          <rect x="0.5" y="0.5" width="19" height="10" rx="2" fill="none" stroke="currentColor" strokeOpacity="0.5"/>
          <rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/>
          <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.6"/>
        </svg>
      </div>
    </div>
  );
}

function Device({ promptFp, scanning, onFingerTap, children }) {
  return (
    <div className="device" data-prompt-fp={promptFp?'1':'0'} data-scanning={scanning?'1':'0'}>
      <div className="device-shell"></div>
      <div className="device-bezel"></div>
      <div className="device-camera"></div>
      <div className="btn-volume-up"></div>
      <div className="btn-volume-down"></div>
      <div className="fp-halo"></div>
      <div className="fp-arrow">
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M16 7L2 7M8 1L2 7l6 6" stroke="#4EC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="lbl">Press to scan</span>
      </div>
      <div className="btn-power-fp" onClick={onFingerTap} title={promptFp?'Tap to authenticate':'Power'}></div>
      {children}
    </div>
  );
}

function Avatar({ who, size=32, ring }) {
  const p = personOf(who);
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:p.color, color:'#fff',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontWeight:700, fontSize:size*0.42, flexShrink:0, letterSpacing:'-0.02em',
      boxShadow: ring ? `0 0 0 ${ring}px var(--fw-bg), 0 0 0 ${ring+1.5}px ${p.color}33` : 'none',
    }}>{p.initial}</div>
  );
}

function AvatarStack({ ids, size=28, max=4 }) {
  const shown = ids.slice(0, max);
  const rest = ids.length - max;
  return (
    <div style={{display:'inline-flex',alignItems:'center'}}>
      {shown.map((id, i)=>(
        <div key={i} style={{marginLeft: i===0?0:-size*0.32, boxShadow:`0 0 0 2px var(--fw-bg)`, borderRadius:'50%'}}>
          <Avatar who={id} size={size}/>
        </div>
      ))}
      {rest > 0 && (
        <div style={{
          marginLeft:-size*0.32, width:size, height:size, borderRadius:'50%',
          background:'var(--fw-surface)', color:'var(--fw-ink-2)',
          display:'inline-flex',alignItems:'center',justifyContent:'center',
          fontWeight:700,fontSize:size*0.36,
          boxShadow:`0 0 0 2px var(--fw-bg), 0 0 0 3px var(--fw-border)`,
        }}>+{rest}</div>
      )}
    </div>
  );
}

function NavHeader({ onBack, title, right }) {
  return (
    <div className="nav-head">
      <div className="back" onClick={onBack}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="title">{title}</div>
      <div className="right">{right || <div style={{width:36}}></div>}</div>
    </div>
  );
}

function BottomNav({ active='home', onNav, onFab }) {
  const items = [
    { id:'home',     label:'Home',     ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg> },
    { id:'groups',   label:'Groups',   ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8"/><circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 19c.5-3 3-5 6-5s5.5 2 6 5M15 19c.4-2.4 2-3.8 4-3.8s3.6 1.4 4 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
    { id:'activity', label:'Activity', ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/></svg> },
    { id:'wallet',   label:'Wallet',   ico:<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18" stroke="currentColor" strokeWidth="1.8"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor"/></svg> },
  ];
  return (
    <div className="btm-nav">
      {items.slice(0,2).map(it => (
        <div key={it.id} className={`nav-item ${active===it.id?'on':''}`} onClick={()=>onNav && onNav(it.id)}>
          {it.ico}<div className="lbl">{it.label}</div>
        </div>
      ))}
      <button className="fab" onClick={onFab}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
      </button>
      {items.slice(2).map(it => (
        <div key={it.id} className={`nav-item ${active===it.id?'on':''}`} onClick={()=>onNav && onNav(it.id)}>
          {it.ico}<div className="lbl">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

const ChevronR = ({size=14}) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const ArrowR = ({size=14, color='#fff'}) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M1 7h12M8 2l5 5-5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const PlusIcon = ({size=14, color='currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);
const CloseIcon = ({size=14, color='currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
);

Object.assign(window, {
  StrataLogo, StatusBar, Device, Avatar, AvatarStack, NavHeader, BottomNav,
  ChevronR, ArrowR, PlusIcon, CloseIcon,
});
