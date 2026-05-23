/* FundWise mock data + brand tokens + helpers */

const BRAND_LIGHT = {
  /* greens (split / primary) */
  gDeep: '#0A4D2C', gForest: '#0D6B3A', gMid: '#1A9151', gFresh: '#2DB870',
  gLight: '#72D4A0', gMint: '#4EC98A', gPale: '#E6F7EE',
  grad: 'linear-gradient(135deg,#0D6B3A 0%,#2DB870 100%)',
  /* blues (fund) — premium navy depth */
  bDeep: '#0F2466', bMid: '#2A4FA8', bFresh: '#4671D8',
  bPale: '#EEF2FC', bBorder: '#B6C8EF',
  bGrad: 'linear-gradient(135deg,#0F2466 0%,#2A4FA8 60%,#4671D8 100%)',
  /* neutrals (warm cream / ink) */
  bg: '#FBFCF9', surface: '#F5FAF6', surface2: '#EAF3EC',
  border: '#D5E8DA', border2: '#C0D9C7',
  ink: '#0D1F14', ink2: '#4A6B55', ink3: '#8DAB97',
  /* semantics + premium gold for fund accents */
  red: '#C73B3B', redPale: '#FBECEC', amber: '#D88A2C', amberPale: '#FBF1DC',
  gold: '#B8852A', goldPale: '#FBF4E0',
  /* meta */
  themeName: 'light',
  canvasBg: '#F4F1EA',
};

const BRAND_DARK = {
  /* greens stay vibrant, push slightly more luminescent for dark bg */
  gDeep: '#0D6B3A', gForest: '#1A9151', gMid: '#3DC880', gFresh: '#5BD898',
  gLight: '#86E0AE', gMint: '#7DDFA8', gPale: '#0F2418',
  grad: 'linear-gradient(135deg,#1A9151 0%,#3DC880 60%,#5BD898 100%)',
  /* blues + premium edge for fund */
  bDeep: '#0B1E4D', bMid: '#6A8FE8', bFresh: '#8AAEEE',
  bPale: '#101A33', bBorder: '#2A3D6E',
  bGrad: 'linear-gradient(135deg,#0B1E4D 0%,#2A4FA8 50%,#6A8FE8 100%)',
  /* neutrals — deep luminous ink */
  bg: '#06100B', surface: '#0D1A14', surface2: '#13241D',
  border: '#1B2D24', border2: '#2A4438',
  ink: '#F2F8F3', ink2: '#A7BEAD', ink3: '#6B8378',
  /* semantics + a premium gold for fund accents */
  red: '#E15A5A', redPale: '#2A1414', amber: '#E6A050', amberPale: '#2A1F10',
  gold: '#E8C77A', goldPale: '#2A2418',
  themeName: 'dark',
  canvasBg: '#020806',
};

/* live mutable object — components read from this each render. */
const BRAND = { ...BRAND_LIGHT };

function setBrandTheme(name) {
  const src = name === 'dark' ? BRAND_DARK : BRAND_LIGHT;
  Object.keys(BRAND).forEach(k => { delete BRAND[k]; });
  Object.assign(BRAND, src);
}

function setFundAccent(hex) {
  /* derive mid-tone, lighter, pale, gradient + border from a single hex */
  if (!hex) return;
  BRAND.bMid = hex;
  /* parse hex → rgb → soften */
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), gC = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const mix = (a,bb,t)=> Math.round(a*(1-t)+bb*t);
  const toHex = (v)=> v.toString(16).padStart(2,'0');
  const bDeep = '#' + toHex(mix(r,0,0.35)) + toHex(mix(gC,0,0.35)) + toHex(mix(b,0,0.35));
  const bFresh = '#' + toHex(mix(r,255,0.25)) + toHex(mix(gC,255,0.25)) + toHex(mix(b,255,0.25));
  BRAND.bDeep = bDeep;
  BRAND.bFresh = bFresh;
  BRAND.bGrad = `linear-gradient(135deg,${bDeep} 0%,${hex} 100%)`;
  if (BRAND.themeName === 'light') {
    BRAND.bPale = '#' + toHex(mix(r,255,0.88)) + toHex(mix(gC,255,0.88)) + toHex(mix(b,255,0.88));
    BRAND.bBorder = '#' + toHex(mix(r,255,0.55)) + toHex(mix(gC,255,0.55)) + toHex(mix(b,255,0.55));
  } else {
    BRAND.bPale = '#' + toHex(mix(r,0,0.75)) + toHex(mix(gC,0,0.75)) + toHex(mix(b,0,0.75));
    BRAND.bBorder = '#' + toHex(mix(r,0,0.55)) + toHex(mix(gC,0,0.55)) + toHex(mix(b,0,0.55));
  }
}

const FONT_SERIF = `'DM Serif Display', Georgia, serif`;
const FONT_SANS = `'Plus Jakarta Sans', system-ui, sans-serif`;
const FONT_MONO = `'JetBrains Mono', ui-monospace, monospace`;

/* ── MOCK DATA ── */

const ME = {
  name: 'Sarthi',
  handle: '@sarthi.sol',
  avatar: 'S',
  color: '#2DB870',
  addr: '7xKp9LkJ8mN4qR2sT5vW8xY1zA3bC6dE9fG2hI5jK8mN4q',
  addrShort: '7xKp…mN4q',
};

const PEOPLE = {
  asha: { name: 'Asha',  initial: 'A', color: '#E07B91' },
  kiran:{ name: 'Kiran', initial: 'K', color: '#5B8EE0' },
  dev:  { name: 'Dev',   initial: 'D', color: '#D4A93E' },
  mia:  { name: 'Mia',   initial: 'M', color: '#9B6BD4' },
  raj:  { name: 'Raj',   initial: 'R', color: '#3FA89E' },
  sam:  { name: 'Sam',   initial: 'S', color: '#E08C58' },
  pat:  { name: 'Pat',   initial: 'P', color: '#7A9E4A' },
  me:   { name: 'You',   initial: 'S', color: '#2DB870' },
};

const GROUPS = [
  {
    id: 'lisbon',
    name: 'Lisbon Trip',
    mode: 'split',
    coin: 'USDC',
    cover: 'linear-gradient(135deg,#F4D4A5,#E8907A)',
    members: ['me','asha','kiran','dev'],
    myBalance: +84.5,
    totalSpent: 640,
    lastActivity: '2h ago',
    settleSuggested: true,
    expenses: [
      { id:1, name:'Wine dinner',       icon:'🍷', payer:'asha',  total:120, myShare:-30,  date:'Today',      time:'19:24', cat:'food'    },
      { id:2, name:'Airport taxi',      icon:'🚕', payer:'me',    total:48,  myShare:+36,  date:'Today',      time:'08:12', cat:'transit' },
      { id:3, name:'Hotel · 2 nights',  icon:'🏨', payer:'kiran', total:320, myShare:-80,  date:'Yesterday',  time:'14:00', cat:'stay'    },
      { id:4, name:'LX Market lunch',   icon:'🥗', payer:'me',    total:72,  myShare:+54,  date:'Yesterday',  time:'13:42', cat:'food'    },
      { id:5, name:'Museum tickets',    icon:'🎨', payer:'dev',   total:80,  myShare:-20,  date:'Apr 22',     time:'10:30', cat:'fun'     },
    ],
    balances: [
      { who:'me',    v: +84.5 },
      { who:'kiran', v: -30   },
      { who:'asha',  v: -24.5 },
      { who:'dev',   v: -30   },
    ],
    settlements: [
      { from:'kiran', to:'me', amt:30 },
      { from:'dev',   to:'me', amt:30 },
      { from:'asha',  to:'kiran', amt:24.5 },
    ],
  },
  {
    id: 'priya',
    name: "Priya's Wedding Gift",
    mode: 'fund',
    coin: 'USDC',
    cover: 'linear-gradient(135deg,#A8C0F0,#6B85D4)',
    members: ['me','asha','kiran','dev','mia','raj'],
    total: 600,
    goal: 750,
    myContrib: 100,
    threshold: { yes:4, of:6 },
    lastActivity: '38m ago',
    proposals: [
      { id:1, title:'Amazon gift card order',  by:'asha',  memo:'$450 — to Priya',           amt:450, status:'pending',  yes:3, no:0, tot:6, time:'38m ago', cat:'shop' },
      { id:2, title:'FTD bouquet delivery',    by:'mia',   memo:'Same-day, Sunday',          amt:80,  status:'approved', yes:5, no:0, tot:6, time:'2h ago',  cat:'gift' },
      { id:3, title:'Nobu dinner deposit',     by:'kiran', memo:'Reservation for 8',         amt:120, status:'executed',yes:6, no:0, tot:6, time:'Yesterday', cat:'food' },
    ],
    contributions: [
      { who:'me',    v:100 },
      { who:'asha',  v:100 },
      { who:'kiran', v:100 },
      { who:'dev',   v:100 },
      { who:'mia',   v:100 },
      { who:'raj',   v:100 },
    ],
  },
  {
    id: 'flat',
    name: 'Flatmates',
    mode: 'split',
    coin: 'USDC',
    cover: 'linear-gradient(135deg,#C3D9C8,#7AA689)',
    members: ['me','kiran','asha'],
    myBalance: -45,
    totalSpent: 210,
    lastActivity: '1d ago',
    expenses: [
      { id:1, name:'Internet bill', icon:'📡', payer:'kiran', total:60, myShare:-20, date:'Apr 21', time:'09:00', cat:'home' },
      { id:2, name:'Groceries',     icon:'🛒', payer:'me',    total:90, myShare:+60, date:'Apr 19', time:'18:30', cat:'food' },
      { id:3, name:'Cleaning kit',  icon:'🧽', payer:'asha',  total:30, myShare:-10, date:'Apr 18', time:'12:10', cat:'home' },
    ],
    balances: [
      { who:'me',    v:-45 },
      { who:'kiran', v:+30 },
      { who:'asha',  v:+15 },
    ],
    settlements: [
      { from:'me', to:'kiran', amt:30 },
      { from:'me', to:'asha',  amt:15 },
    ],
  },
  {
    id: 'berlin',
    name: 'Berlin DevCon',
    mode: 'fund',
    coin: 'USDC',
    cover: 'linear-gradient(135deg,#D5C5E8,#9A7BC4)',
    members: ['me','asha','kiran','dev','mia','raj','sam','pat'],
    total: 1200,
    goal: 2000,
    myContrib: 150,
    threshold: { yes:5, of:8 },
    lastActivity: '3d ago',
    proposals: [
      { id:1, title:'Conference tickets', by:'kiran', memo:'x8 @ $80',          amt:640, status:'executed', yes:8, no:0, tot:8, time:'3d ago',  cat:'work' },
      { id:2, title:'Airbnb deposit',     by:'asha',  memo:'3 nights, Mitte',   amt:480, status:'pending',  yes:4, no:1, tot:8, time:'5h ago',  cat:'stay' },
    ],
    contributions: [],
  },
];

/* spending by category for charts */
const SPEND_TREND = [
  { d:'Mon', v: 24 }, { d:'Tue', v: 88 }, { d:'Wed', v: 12 },
  { d:'Thu', v: 156 },{ d:'Fri', v: 72 }, { d:'Sat', v: 240 }, { d:'Sun', v: 48 },
];

/* helpers */
function fmtUSD(v, { sign=false }={}) {
  const n = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  if (!sign) return '$' + n;
  if (v > 0) return '+$' + n;
  if (v < 0) return '−$' + n;
  return '$' + n;
}

function fmtUSDshort(v) {
  return '$' + Math.abs(v).toLocaleString('en-US', { maximumFractionDigits:0 });
}

function personOf(key) { return PEOPLE[key] || { name: key, initial: key[0]?.toUpperCase() || '?', color:'#888' }; }

/* haptic helper — Telegram WebApp or Vibration API */
function haptic(kind='light') {
  try {
    const tg = window.Telegram?.WebApp?.HapticFeedback;
    if (tg) {
      if (['light','medium','heavy','rigid','soft'].includes(kind)) tg.impactOccurred(kind === 'rigid' || kind === 'soft' ? 'light' : kind);
      else if (kind === 'success' || kind === 'error' || kind === 'warning') tg.notificationOccurred(kind);
      else if (kind === 'select') tg.selectionChanged();
      return;
    }
  } catch(e) {}
  if (navigator.vibrate) {
    const map = { light:[8], medium:[14], heavy:[20], success:[10,30,10], error:[30,40,30], warning:[20,20,20], select:[5] };
    navigator.vibrate(map[kind] || [8]);
  }
  /* visual flash for prototype */
  const flash = document.createElement('div');
  flash.className = 'haptic-flash';
  flash.dataset.kind = kind;
  document.body.appendChild(flash);
  setTimeout(()=> flash.remove(), 220);
}

Object.assign(window, { BRAND, FONT_SERIF, FONT_SANS, FONT_MONO, ME, PEOPLE, GROUPS, SPEND_TREND, fmtUSD, fmtUSDshort, personOf, haptic });
