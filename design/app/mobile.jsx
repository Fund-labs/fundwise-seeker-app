/* Mobile (iOS) screens — Home, Split detail, Fund detail, Flows, Onboarding */

const { useState: useStateM } = React;

/* ── Mobile device wrapper — wraps content in IOSDevice frame with status bar + home indicator */
function MobileFrame({ children, width=390, height=820, dark }) {
  const isDark = dark ?? (BRAND.themeName === 'dark');
  return (
    <IOSDevice width={width} height={height} dark={isDark}>
      <div style={{
        height:'100%', display:'flex', flexDirection:'column',
        background: BRAND.bg, color: BRAND.ink,
        fontFamily: FONT_SANS, paddingTop: 50, /* status bar */
      }}>
        {children}
      </div>
    </IOSDevice>
  );
}

/* ── Mobile bottom nav ── */
function MobileBottomNav({ active='home' }) {
  const items = [
    { id:'home',     label:'Home',     icon:'home'     },
    { id:'groups',   label:'Groups',   icon:'groups'   },
    { id:'add',      label:'',         icon:'plus', fab:true },
    { id:'activity', label:'Activity', icon:'activity' },
    { id:'wallet',   label:'Wallet',   icon:'wallet'   },
  ];
  return (
    <div style={{
      flexShrink:0, padding:'10px 14px 26px', background: BRAND.bg,
      borderTop:`1px solid ${BRAND.border}`,
      display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      {items.map(it => {
        const on = it.id === active;
        if (it.fab) {
          return (
            <button key={it.id} style={{
              width:52, height:52, marginTop:-22, borderRadius:18,
              background: BRAND.grad, color:'#fff', border:'none',
              boxShadow: `0 6px 16px ${BRAND.gMid}55`, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Icon name="plus" size={22} color="#fff" strokeWidth={2.4}/>
            </button>
          );
        }
        return (
          <button key={it.id} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            background:'none', border:'none', cursor:'pointer',
            color: on ? BRAND.gMid : BRAND.ink3,
          }}>
            <Icon name={it.icon} size={20} color={on ? BRAND.gMid : BRAND.ink3} strokeWidth={on?2:1.7}/>
            <span style={{ fontSize:10, fontWeight: on?700:500, fontFamily: FONT_SANS, letterSpacing:'-0.01em' }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Mobile top header (greeting style) ── */
function MobileHeader({ left, right, title }) {
  return (
    <div style={{
      flexShrink:0, padding:'10px 20px 10px', display:'flex', alignItems:'center', justifyContent:'space-between',
    }}>
      {left || <Logo size={26}/>}
      {title && <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.3px' }}>{title}</div>}
      {right || (
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${BRAND.border}`, background: BRAND.bg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
            <Icon name="bell" size={16} color={BRAND.ink2}/>
            <span style={{ position:'absolute', top:7, right:8, width:7, height:7, borderRadius:'50%', background: BRAND.gFresh, boxShadow:`0 0 0 2px ${BRAND.bg}` }}/>
          </button>
          <Avatar who="me" size={36}/>
        </div>
      )}
    </div>
  );
}

/* ── 1. Mobile Home Dashboard ── */
function MobileHome() {
  return (
    <MobileFrame>
      <MobileHeader/>
      <div style={{ flex:1, overflow:'auto', paddingBottom:8 }}>
        {/* Greeting */}
        <div style={{ padding:'4px 20px 14px' }}>
          <div style={{ fontSize:13, color: BRAND.ink2 }}>Good morning,</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize:30, color: BRAND.ink, letterSpacing:'-0.6px', lineHeight:1.1, marginTop:2 }}>
            Sarthi <span style={{ fontStyle:'italic', background: BRAND.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>👋</span>
          </div>
        </div>

        {/* Hero net balance card */}
        <div style={{ margin:'0 16px 14px', borderRadius:20, background: BRAND.grad, color:'#fff', padding:'20px 22px', position:'relative', overflow:'hidden' }}>
          <MeshGradient colors={['#fff','#fff','#fff']} intensity={0.22} radius={20}/>
          <Sparkles count={5} color="#fff" size={1.5}/>
          <Shimmer dur={10} radius={20}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.85 }}>Net across all groups</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize:44, letterSpacing:'-1.2px', lineHeight:1, marginTop:6 }}>
              <MoneyCounter value={39.50} sign={true}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
              <div style={{ fontSize:11, opacity:0.85 }}>Owed across 2 groups</div>
              <Sparkline data={SPEND_TREND} color="#fff" width={64} height={22}/>
            </div>
          </div>
          <div style={{ position:'relative', zIndex:1, display:'flex', gap:7, marginTop:16 }}>
            <button style={{ flex:1, padding:'9px', borderRadius:9, background:'#fff', color: BRAND.gForest, border:'none', fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Icon name="arrow-dn" size={14}/> Receive
            </button>
            <button style={{ flex:1, padding:'9px', borderRadius:9, background:'rgba(255,255,255,0.18)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Icon name="arrow-up" size={14}/> Pay
            </button>
            <button style={{ flex:1, padding:'9px', borderRadius:9, background:'rgba(255,255,255,0.18)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <Icon name="qr" size={14}/> Scan
            </button>
          </div>
        </div>

        {/* Needs attention banner */}
        <div style={{ margin:'0 16px 16px', borderRadius:14, background: BRAND.bg, border:`1px solid ${BRAND.bBorder}`, padding:'12px 14px', display:'flex', alignItems:'center', gap:12, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: BRAND.bGrad }}/>
          <div style={{ width:36, height:36, borderRadius:11, background: BRAND.bPale, color:BRAND.bMid, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="vote" size={17} color={BRAND.bMid}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color: BRAND.bMid, letterSpacing:'0.04em', textTransform:'uppercase' }}>Vote needed</div>
            <div style={{ fontSize:13, color: BRAND.ink, fontWeight:600, marginTop:1, lineHeight:1.25 }}>Amazon gift card · $450</div>
          </div>
          <Icon name="chevron-r" size={18} color={BRAND.ink3}/>
        </div>

        {/* Groups section */}
        <div style={{ padding:'4px 20px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.ink, letterSpacing:'-0.3px', whiteSpace:'nowrap' }}>Your groups</h3>
          <button style={{ background:'none', border:'none', color: BRAND.gMid, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>See all</button>
        </div>
        <div style={{ display:'flex', gap:8, padding:'0 20px 12px', overflowX:'auto' }}>
          <Pill active>All <span style={{ opacity:0.6, marginLeft:4 }}>4</span></Pill>
          <Pill color={BRAND.gMid} bg={BRAND.gPale}>Split</Pill>
          <Pill color={BRAND.bMid} bg={BRAND.bPale} border={BRAND.bBorder}>Fund</Pill>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 16px' }} className="fw-stagger">
          {GROUPS.slice(0,4).map(g => <MobileGroupCard key={g.id} g={g}/>)}
        </div>
      </div>
      <MobileBottomNav active="home"/>
    </MobileFrame>
  );
}

function MobileGroupCard({ g, onClick }) {
  const isSplit = g.mode === 'split';
  return (
    <button onClick={onClick} className="fw-hover-card" style={{
      display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:14,
      background: BRAND.bg, border:`1px solid ${BRAND.border}`, cursor:'pointer', textAlign:'left',
      width:'100%', fontFamily: FONT_SANS,
      boxShadow:'0 1px 3px rgba(13,31,20,0.025)',
    }}>
      <div style={{ width:44, height:44, borderRadius:12, background:g.cover, flexShrink:0, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-30%', right:'-15%', width:'80%', height:'140%', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 70%)',
          animation:'fw-breathe 8s ease-in-out infinite', mixBlendMode:'overlay',
        }}/>
        <div style={{
          position:'absolute', bottom:-3, right:-3, width:16, height:16, borderRadius:'50%',
          background: isSplit ? BRAND.gMid : BRAND.bMid, border:`2px solid ${BRAND.bg}`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name={isSplit ? 'split' : 'fund'} size={9} color="#fff" strokeWidth={2.5}/>
        </div>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color: BRAND.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.2 }}>{g.name}</div>
        <div style={{ fontSize:11, color: BRAND.ink2, marginTop:2, display:'flex', alignItems:'center', gap:6 }}>
          <AvatarStack whos={g.members} size={14} max={3} ringColor={BRAND.bg}/>
          <span>{g.lastActivity}</span>
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        {isSplit ? (
          <>
            <div style={{ fontFamily: FONT_SERIF, fontSize:17, color: g.myBalance >= 0 ? BRAND.gMid : BRAND.red, letterSpacing:'-0.3px', lineHeight:1, whiteSpace:'nowrap' }}>
              {fmtUSD(g.myBalance, { sign:true })}
            </div>
            <div style={{ fontSize:10, color: BRAND.ink3, marginTop:3, whiteSpace:'nowrap' }}>{g.myBalance >= 0 ? 'you get' : 'you owe'}</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: FONT_SERIF, fontSize:17, color: BRAND.bMid, letterSpacing:'-0.3px', lineHeight:1, whiteSpace:'nowrap' }}>
              {fmtUSDshort(g.total)}
            </div>
            <div style={{ fontSize:10, color: BRAND.ink3, marginTop:3, whiteSpace:'nowrap' }}>of {fmtUSDshort(g.goal)}</div>
          </>
        )}
      </div>
    </button>
  );
}

/* ── 2. Mobile Split-mode detail ── */
function MobileSplitDetail() {
  const g = GROUPS[0]; /* lisbon */
  return (
    <MobileFrame>
      <MobileHeader
        left={<button style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color: BRAND.gMid, fontSize:14, fontWeight:600, cursor:'pointer', padding:0 }}>
          <Icon name="chevron-l" size={20}/>
        </button>}
        right={<button style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${BRAND.border}`, background: BRAND.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="menu" size={16} color={BRAND.ink2}/>
        </button>}
      />
      <div style={{ flex:1, overflow:'auto' }}>
        {/* Hero */}
        <div style={{ padding:'4px 20px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background: g.cover }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize:24, color: BRAND.ink, letterSpacing:'-0.4px', lineHeight:1.1 }}>{g.name}</div>
              <div style={{ fontSize:11, color: BRAND.ink2, marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
                <ModeBadge mode="split"/>
                <span>{g.members.length} members</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop:18, padding:'18px 18px', borderRadius:16, background: BRAND.gPale, border:`1px solid ${BRAND.border2}`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-24, right:-24, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${BRAND.gLight}40, transparent 70%)`, animation:'fw-blob-1 14s ease-in-out infinite' }}/>
            <Sparkles count={4} color={BRAND.gLight} size={1.5}/>
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: BRAND.gMid }}>You are owed</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize:44, color: BRAND.ink, letterSpacing:'-1.2px', lineHeight:1, marginTop:4 }}>
                <MoneyCounter value={g.myBalance} sign={true}/>
              </div>
              <div style={{ fontSize:12, color: BRAND.ink2, marginTop:8 }}>3 people · settle to clear</div>
              <button style={{
                marginTop:14, width:'100%', padding:'12px', borderRadius:12, background: BRAND.grad, color:'#fff', border:'none',
                fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                <Icon name="check" size={16}/> Settle up · 1-click
              </button>
            </div>
          </div>
        </div>

        {/* Member balance chips */}
        <div style={{ display:'flex', gap:8, padding:'0 16px 14px', overflowX:'auto' }}>
          {g.balances.map(b => {
            const p = personOf(b.who);
            const owed = b.v > 0;
            return (
              <div key={b.who} style={{ flexShrink:0, padding:'10px 12px', borderRadius:12, background: BRAND.bg, border:`1px solid ${BRAND.border}`, display:'flex', alignItems:'center', gap:8, minWidth:140 }}>
                <Avatar who={b.who} size={28}/>
                <div>
                  <div style={{ fontSize:11, color: BRAND.ink, fontWeight:600 }}>{b.who === 'me' ? 'You' : p.name}</div>
                  <div style={{ fontFamily: FONT_SERIF, fontSize:14, color: owed ? BRAND.gMid : BRAND.red, letterSpacing:'-0.2px' }}>{fmtUSDshort(Math.abs(b.v))}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expenses */}
        <div style={{ padding:'4px 20px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.3px' }}>Expenses</h3>
          <button style={{ background:'none', border:'none', color: BRAND.gMid, fontSize:12, fontWeight:600, cursor:'pointer' }}>Filter</button>
        </div>
        <div style={{ padding:'0 8px 12px' }}>
          {g.expenses.map((e, i) => {
            const payer = personOf(e.payer);
            return (
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 12px', borderRadius:12, margin:'2px 0', cursor:'pointer' }}>
                <div style={{ width:40, height:40, borderRadius:11, background: BRAND.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{e.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:BRAND.ink, lineHeight:1.2 }}>{e.name}</div>
                  <div style={{ fontSize:11, color: BRAND.ink2, marginTop:2 }}>
                    {e.payer === 'me' ? 'You' : payer.name} paid · {e.date}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily: FONT_SERIF, fontSize:14, color: BRAND.ink, letterSpacing:'-0.2px' }}>{fmtUSD(e.total)}</div>
                  <div style={{ fontSize:10, color: e.myShare >= 0 ? BRAND.gMid : BRAND.red, fontWeight:600, marginTop:2 }}>
                    {e.myShare >= 0 ? '+' : '−'}{fmtUSDshort(Math.abs(e.myShare))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MobileBottomNav active="groups"/>
    </MobileFrame>
  );
}

/* ── 3. Mobile Fund-mode detail ── */
function MobileFundDetail() {
  const g = GROUPS[1]; /* priya */
  return (
    <MobileFrame>
      <MobileHeader
        left={<button style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', color: BRAND.bMid, fontSize:14, fontWeight:600, cursor:'pointer', padding:0 }}>
          <Icon name="chevron-l" size={20}/>
        </button>}
        right={<button style={{ width:36, height:36, borderRadius:'50%', border:`1px solid ${BRAND.border}`, background: BRAND.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="menu" size={16} color={BRAND.ink2}/>
        </button>}
      />
      <div style={{ flex:1, overflow:'auto' }}>
        {/* Hero treasury — premium surface */}
        <div style={{ padding:'4px 16px 18px' }}>
          <PremiumSurface
            background={BRAND.bGrad}
            radius={22}
            glowColor="rgba(42,79,168,0.35)"
          >
            <div style={{ padding:'22px 22px', color:'#fff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:100, background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.25)', fontSize:9, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  <Icon name="lock" size={10} color="#fff"/> Vault
                </span>
                <div style={{ fontFamily: FONT_SERIF, fontSize:15, letterSpacing:'-0.2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</div>
              </div>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.78, marginTop:14 }}>Treasury</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:10, marginTop:4, flexWrap:'wrap' }}>
                <div style={{ fontFamily: FONT_SERIF, fontSize:44, letterSpacing:'-1.4px', lineHeight:1, whiteSpace:'nowrap' }}>
                  <MoneyCounter value={g.total}/>
                </div>
                <div style={{ fontSize:13, opacity:0.78, whiteSpace:'nowrap' }}>of {fmtUSDshort(g.goal)}</div>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.16)', borderRadius:3, marginTop:14, overflow:'hidden', position:'relative' }}>
                <div style={{ height:'100%', width:`${(g.total/g.goal)*100}%`, background:'#fff', borderRadius:3, boxShadow:'0 0 10px rgba(255,255,255,0.5)', position:'relative' }}>
                  <BarShine radius={3}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:16 }}>
                <button className="fw-btn" style={{ flex:1, padding:'11px', borderRadius:11, background:'#fff', color: BRAND.bMid, border:'none', fontFamily: FONT_SANS, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, boxShadow:'0 2px 8px rgba(0,0,0,0.12)' }}>
                  <Icon name="arrow-dn" size={14}/> Contribute
                </button>
                <button className="fw-btn" style={{ flex:1, padding:'11px', borderRadius:11, background:'rgba(255,255,255,0.14)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', fontFamily: FONT_SANS, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Icon name="plus" size={14}/> Propose
                </button>
              </div>
            </div>
          </PremiumSurface>
        </div>

        {/* Member contributions */}
        <div style={{ padding:'4px 20px 6px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.3px', whiteSpace:'nowrap' }}>Contributors</h3>
          <span style={{ fontSize:11, color: BRAND.ink3, fontFamily: FONT_MONO, whiteSpace:'nowrap' }}>You: ${g.myContrib}</span>
        </div>
        <div style={{ display:'flex', gap:10, padding:'0 20px 14px', overflowX:'auto' }}>
          {g.contributions.map(c => {
            const p = personOf(c.who);
            return (
              <div key={c.who} style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:54 }}>
                <Avatar who={c.who} size={42} ring={2}/>
                <div style={{ fontSize:10, fontWeight:600, color:BRAND.ink, marginTop:2 }}>{c.who === 'me' ? 'You' : p.name}</div>
                <div style={{ fontSize:10, color:BRAND.bMid, fontWeight:700 }}>{fmtUSDshort(c.v)}</div>
              </div>
            );
          })}
        </div>

        {/* Proposals */}
        <div style={{ padding:'4px 20px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.3px' }}>Proposals</h3>
          <button style={{ padding:'4px 10px', borderRadius:100, background: BRAND.amberPale, color: BRAND.amber, fontSize:10, fontWeight:700, border:'none' }}>1 PENDING</button>
        </div>
        <div style={{ padding:'0 16px 12px', display:'flex', flexDirection:'column', gap:8 }}>
          {g.proposals.map(p => <MobileProposalCard key={p.id} p={p} threshold={g.threshold}/>)}
        </div>
      </div>
      <MobileBottomNav active="groups"/>
    </MobileFrame>
  );
}

function MobileProposalCard({ p, threshold }) {
  const statusMap = {
    pending:  { label:'Voting', bg: BRAND.amberPale, fg: BRAND.amber, gold:false },
    approved: { label:'Approved', bg: BRAND.gPale, fg: BRAND.gMid, gold:false },
    executed: { label:'Executed', bg: BRAND.goldPale || BRAND.surface2, fg: BRAND.gold || BRAND.ink2, gold:true },
  };
  const s = statusMap[p.status];
  return (
    <div className="fw-hover-card" style={{ padding:'14px 14px', borderRadius:14, background: BRAND.bg, border:`1px solid ${BRAND.border}`, boxShadow:'0 1px 3px rgba(13,31,20,0.025)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5, flexWrap:'wrap' }}>
            {s.gold ? (
              <GoldShimmer><Icon name="check" size={9} color="#3D2A0B" strokeWidth={3}/> {s.label}</GoldShimmer>
            ) : (
              <span style={{ padding:'2px 7px', borderRadius:100, background: s.bg, color: s.fg, fontSize:9, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{s.label}</span>
            )}
            <span style={{ fontSize:10, color: BRAND.ink3, whiteSpace:'nowrap' }}>by {personOf(p.by).name}</span>
          </div>
          <div style={{ fontFamily: FONT_SERIF, fontSize:16, color: BRAND.ink, letterSpacing:'-0.2px', lineHeight:1.2 }}>{p.title}</div>
          <div style={{ fontSize:11, color: BRAND.ink2, marginTop:2 }}>{p.memo}</div>
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.bMid, letterSpacing:'-0.4px', flexShrink:0 }}>{fmtUSD(p.amt)}</div>
      </div>
      <VoteBar yes={p.yes} no={p.no} total={p.tot} threshold={threshold.yes} color={BRAND.bMid}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
        <div style={{ fontSize:10, color: BRAND.ink2 }}>
          <strong style={{ color: BRAND.bMid }}>{p.yes}</strong> yes · needs {threshold.yes}
        </div>
        {p.status === 'pending' ? (
          <div style={{ display:'flex', gap:6 }}>
            <button style={{ padding:'5px 12px', borderRadius:8, background: BRAND.surface, color: BRAND.ink2, border:`1px solid ${BRAND.border}`, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily: FONT_SANS }}>No</button>
            <button style={{ padding:'5px 12px', borderRadius:8, background: BRAND.bMid, color:'#fff', border:'none', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily: FONT_SANS }}>Vote yes</button>
          </div>
        ) : (
          <Icon name="chevron-r" size={16} color={BRAND.ink3}/>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MobileFrame, MobileBottomNav, MobileHeader, MobileHome, MobileGroupCard, MobileSplitDetail, MobileFundDetail, MobileProposalCard });
