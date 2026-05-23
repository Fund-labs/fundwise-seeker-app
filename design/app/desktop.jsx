/* Desktop / web app screens — Sidebar shell + Home + Split detail + Fund detail */

const { useState: useStateD, useMemo: useMemoD, useEffect: useEffectD } = React;

/* ── Desktop shell with sidebar ── */
function DesktopShell({ active, onNav, children }) {
  const nav = [
    { id:'home',     label:'Dashboard', icon:'home'     },
    { id:'groups',   label:'Groups',    icon:'groups'   },
    { id:'activity', label:'Activity',  icon:'activity' },
    { id:'wallet',   label:'Wallet',    icon:'wallet'   },
  ];
  return (
    <div style={{ display:'flex', height:'100%', background: BRAND.bg, fontFamily: FONT_SANS, color: BRAND.ink }}>
      {/* Sidebar */}
      <aside style={{
        width: 232, flexShrink:0, background: BRAND.bg, borderRight:`1px solid ${BRAND.border}`,
        display:'flex', flexDirection:'column', padding:'20px 14px',
      }}>
        <div style={{ padding:'4px 8px 24px' }}>
          <LogoLockup size={22}/>
        </div>
        <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {nav.map(n => {
            const on = active === n.id;
            return (
              <button key={n.id} onClick={()=> onNav?.(n.id)} style={{
                display:'flex', alignItems:'center', gap:11, padding:'9px 10px',
                borderRadius:10, border:'none', background: on ? BRAND.surface : 'transparent',
                color: on ? BRAND.ink : BRAND.ink2, cursor:'pointer', textAlign:'left',
                fontFamily: FONT_SANS, fontSize:14, fontWeight: on?600:500, transition:'all 0.15s',
              }}>
                <Icon name={n.icon} size={18} color={on ? BRAND.gMid : BRAND.ink2}/>
                {n.label}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop:24, padding:'0 8px', fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:BRAND.ink3, textTransform:'uppercase' }}>Pinned</div>
        <div style={{ display:'flex', flexDirection:'column', gap:2, marginTop:6 }}>
          {GROUPS.slice(0,3).map(g => (
            <button key={g.id} style={{
              display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:10,
              border:'none', background:'transparent', cursor:'pointer', color:BRAND.ink2,
              fontFamily: FONT_SANS, fontSize:13, fontWeight:500, textAlign:'left',
            }}>
              <span style={{ width:22, height:22, borderRadius:7, background: g.cover, flexShrink:0 }}/>
              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{g.name}</span>
              <ModeBadge mode={g.mode} size="sm"/>
            </button>
          ))}
        </div>
        <div style={{ marginTop:'auto', padding:'12px 10px', display:'flex', alignItems:'center', gap:10,
          background: BRAND.surface, borderRadius:12, border:`1px solid ${BRAND.border}` }}>
          <Avatar who="me" size={32}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.2 }}>{ME.name}</div>
            <div style={{ fontSize:11, color: BRAND.ink3, fontFamily: FONT_MONO, marginTop:2 }}>{ME.addrShort}</div>
          </div>
          <Icon name="settings" size={16} color={BRAND.ink3}/>
        </div>
      </aside>
      <main style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
        {children}
      </main>
    </div>
  );
}

/* ── Desktop top header (search + actions) ── */
function DesktopTopbar({ title, breadcrumb }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:20, padding:'18px 32px',
      borderBottom:`1px solid ${BRAND.border}`, background: BRAND.bg, position:'sticky', top:0, zIndex:5,
    }}>
      <div style={{ flex:1 }}>
        {breadcrumb && <div style={{ fontSize:11, color:BRAND.ink3, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:2 }}>{breadcrumb}</div>}
        <div style={{ fontFamily: FONT_SERIF, fontSize:26, color: BRAND.ink, letterSpacing:'-0.5px', lineHeight:1.1 }}>{title}</div>
      </div>
      <div style={{ position:'relative', width:280 }}>
        <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }}><Icon name="search" size={15} color={BRAND.ink3}/></span>
        <input placeholder="Search groups, people, expenses…" style={{
          width:'100%', padding:'8px 12px 8px 32px', borderRadius:10,
          border:`1px solid ${BRAND.border}`, background: BRAND.surface, fontSize:13,
          fontFamily: FONT_SANS, color: BRAND.ink, outline:'none',
        }}/>
      </div>
      <button style={{
        position:'relative', width:36, height:36, borderRadius:10, border:`1px solid ${BRAND.border}`,
        background: BRAND.bg, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
      }}>
        <Icon name="bell" size={17} color={BRAND.ink2}/>
        <span style={{ position:'absolute', top:7, right:8, width:7, height:7, borderRadius:'50%', background: BRAND.gFresh, boxShadow:`0 0 0 2px ${BRAND.bg}` }}/>
      </button>
      <button style={{
        padding:'9px 16px', borderRadius:10, border:'none', background: BRAND.grad, color:'#fff',
        fontFamily: FONT_SANS, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:7,
        whiteSpace:'nowrap', flexShrink:0,
      }}>
        <Icon name="plus" size={15} color="#fff"/> New group
      </button>
    </div>
  );
}

/* ── Desktop Home Dashboard ── */
function DesktopHome() {
  return (
    <DesktopShell active="home">
      <DesktopTopbar title={<>Good morning, <em style={{ fontStyle:'italic', background: BRAND.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Sarthi</em></>} breadcrumb="Tuesday · April 22"/>
      <div style={{ padding:'24px 32px 48px', display:'flex', flexDirection:'column', gap:24 }}>
        {/* ── Stat row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:14 }}>
          {/* Net balance hero */}
          <div style={{
            padding:'22px 24px', borderRadius:18, background: BRAND.grad, color:'#fff',
            position:'relative', overflow:'hidden',
          }}>
            <MeshGradient colors={['#fff','#fff','#fff']} intensity={0.22} radius={18}/>
            <Sparkles count={5} color="#fff" size={1.5}/>
            <Shimmer dur={9} radius={18}/>
            <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.8 }}>Net across all groups</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:8, marginTop:6 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize:42, letterSpacing:'-1px', lineHeight:1 }}>
                <MoneyCounter value={39.50} sign={true}/>
              </div>
              <Sparkline data={SPEND_TREND} color="#fff" width={92} height={26}/>
            </div>
            <div style={{ fontSize:12, opacity:0.85, marginTop:8 }}>You're owed across 2 groups · 1 settlement ready</div>
            <div style={{ display:'flex', gap:8, marginTop:18 }}>
              <button className="fw-btn" style={{ padding:'8px 14px', borderRadius:9, background:'#fff', color: BRAND.gForest, border:'none', fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Icon name="arrow-dn" size={14}/> Receive
              </button>
              <button className="fw-btn" style={{ padding:'8px 14px', borderRadius:9, background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <Icon name="arrow-up" size={14}/> Pay
              </button>
            </div>
            </div>
          </div>
          {[
            { label:'Owed to you', value:120.50, sign:true, color:BRAND.gMid, sub:'3 people · 2 groups' },
            { label:'You owe',      value:-81.00, sign:true, color:BRAND.red,  sub:'2 people · 1 group' },
            { label:'Fund pools',   value:250,    sign:false,color:BRAND.bMid, sub:'In 2 active funds' },
          ].map((s, i) => (
            <div key={i} style={{ padding:'18px 18px', borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:BRAND.ink3 }}>{s.label}</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize:30, color: s.color, letterSpacing:'-0.5px', marginTop:8, lineHeight:1 }}>
                <MoneyCounter value={s.value} sign={s.sign}/>
              </div>
              <div style={{ fontSize:11, color:BRAND.ink2, marginTop:8 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Needs attention ── */}
        <div style={{ padding:'18px 22px', borderRadius:16, background:BRAND.bg, border:`1px solid ${BRAND.border}`,
          display:'flex', alignItems:'center', gap:18, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background: BRAND.bGrad }}/>
          <div style={{ width:42, height:42, borderRadius:12, background: BRAND.bPale, color: BRAND.bMid, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="vote" size={20} color={BRAND.bMid}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:BRAND.bMid }}>Pending your vote</div>
            <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, marginTop:3, letterSpacing:'-0.2px' }}>"Amazon gift card order" — $450 needs 1 more yes</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8, fontSize:12, color: BRAND.ink2 }}>
              <span>Priya's Wedding Gift</span>
              <span style={{ opacity:0.4 }}>·</span>
              <span>38 min ago</span>
              <span style={{ opacity:0.4 }}>·</span>
              <AvatarStack whos={['asha','kiran','mia']} size={18} max={3}/>
              <span>3 of 4 voted yes</span>
            </div>
          </div>
          <button style={{ padding:'10px 16px', borderRadius:9, background: BRAND.bMid, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>Review &amp; vote</button>
        </div>

        {/* ── Two columns: groups + activity ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:24 }}>
          {/* Groups grid */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize:22, color: BRAND.ink, letterSpacing:'-0.4px' }}>Your groups</h3>
              <div style={{ display:'flex', gap:6 }}>
                <Pill active>All <span style={{ opacity:0.6, marginLeft:4 }}>4</span></Pill>
                <Pill color={BRAND.gMid} bg={BRAND.gPale}>Split <span style={{ opacity:0.6, marginLeft:4 }}>2</span></Pill>
                <Pill color={BRAND.bMid} bg={BRAND.bPale} border={BRAND.bBorder}>Fund <span style={{ opacity:0.6, marginLeft:4 }}>2</span></Pill>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }} className="fw-stagger">
              {GROUPS.map(g => <DesktopGroupCard key={g.id} g={g}/>)}
            </div>
          </div>
          {/* Activity */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize:22, color: BRAND.ink, letterSpacing:'-0.4px' }}>Recent activity</h3>
              <button style={{ background:'none', border:'none', color: BRAND.gMid, fontSize:12, fontWeight:600, cursor:'pointer' }}>See all</button>
            </div>
            <div style={{ background: BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:16, overflow:'hidden' }}>
              {[
                { type:'expense', icon:'🍷', title:'Asha added "Wine dinner"', sub:'Lisbon Trip · You owe $30', time:'2h', accent:BRAND.gMid },
                { type:'vote',    icon:'🗳', title:'Mia voted yes on "Bouquet"', sub:"Priya's Wedding · 5 of 6", time:'4h', accent:BRAND.bMid },
                { type:'settle',  icon:'✓',  title:'Kiran settled $30 to you', sub:'Lisbon Trip · sig 8jK…m4q', time:'1d', accent:BRAND.gMid },
                { type:'deposit', icon:'⤓',  title:'You deposited $100', sub:"Priya's Wedding · via Phantom", time:'2d', accent:BRAND.bMid },
                { type:'proposal',icon:'☉',  title:'Kiran proposed "Nobu dinner"', sub:"Priya's Wedding · Executed", time:'3d', accent:BRAND.bMid },
              ].map((a,i)=> (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderBottom: i<4 ? `1px solid ${BRAND.border}` : 'none' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background: BRAND.surface, color:a.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{a.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color: BRAND.ink, lineHeight:1.3 }}>{a.title}</div>
                    <div style={{ fontSize:11, color: BRAND.ink2, marginTop:2 }}>{a.sub}</div>
                  </div>
                  <div style={{ fontSize:11, color: BRAND.ink3, flexShrink:0 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DesktopShell>
  );
}

function DesktopGroupCard({ g }) {
  const isSplit = g.mode === 'split';
  const accent = isSplit ? BRAND.gMid : BRAND.bMid;
  return (
    <div className="fw-hover-card" style={{
      borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}`,
      overflow:'hidden', cursor:'pointer',
      boxShadow:'0 2px 6px rgba(13,31,20,0.025)',
    }}>
      <div style={{ height:64, background: g.cover, position:'relative', overflow:'hidden' }}>
        {/* breathing blob in cover */}
        <div style={{ position:'absolute', top:'-30%', right:'-15%', width:'70%', height:'140%', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(255,255,255,0.45) 0%, transparent 65%)',
          animation:'fw-breathe 8s ease-in-out infinite', mixBlendMode:'overlay',
        }}/>
        <div style={{ position:'absolute', top:10, left:12 }}><ModeBadge mode={g.mode}/></div>
        <div style={{ position:'absolute', bottom:8, right:12 }}><AvatarStack whos={g.members} size={26} max={4} ringColor={BRAND.bg}/></div>
      </div>
      <div style={{ padding:'14px 16px 14px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</div>
            <div style={{ fontSize:11, color: BRAND.ink3, marginTop:3, whiteSpace:'nowrap' }}>{g.members.length} members · {g.lastActivity}</div>
          </div>
        </div>
        <div style={{ height:1, background: BRAND.border, margin:'12px 0' }}/>
        {isSplit ? (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:8 }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:10, color: BRAND.ink3, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Your balance</div>
              <div style={{ fontFamily: FONT_SERIF, fontSize:22, color: g.myBalance >= 0 ? BRAND.gMid : BRAND.red, letterSpacing:'-0.3px', marginTop:2, whiteSpace:'nowrap' }}>
                {fmtUSD(g.myBalance, { sign:true })}
              </div>
            </div>
            <div style={{ fontSize:11, color: BRAND.ink2, textAlign:'right', whiteSpace:'nowrap', flexShrink:0 }}>
              {fmtUSDshort(g.totalSpent)} spent
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:6, gap:8 }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:10, color: BRAND.ink3, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap' }}>Treasury</div>
                <div style={{ fontFamily: FONT_SERIF, fontSize:22, color: BRAND.bMid, letterSpacing:'-0.3px', marginTop:2, whiteSpace:'nowrap' }}>
                  {fmtUSD(g.total)}
                </div>
              </div>
              <div style={{ fontSize:11, color: BRAND.ink2, textAlign:'right', whiteSpace:'nowrap', flexShrink:0 }}>of {fmtUSDshort(g.goal)}</div>
            </div>
            <div style={{ height:5, background:BRAND.surface2, borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(g.total/g.goal)*100}%`, background:BRAND.bGrad, borderRadius:3 }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Desktop Split-mode group detail ── */
function DesktopSplitDetail({ groupId='lisbon' }) {
  const g = GROUPS.find(x => x.id === groupId);
  return (
    <DesktopShell active="groups">
      <DesktopTopbar
        title={<>{g.name}</>}
        breadcrumb={<>Groups <span style={{ margin:'0 6px', opacity:0.5 }}>›</span> Split mode</>}
      />
      <div style={{ padding:'24px 32px 48px', display:'grid', gridTemplateColumns:'1fr 360px', gap:24 }}>
        <div>
          {/* Hero balance card */}
          <div style={{
            padding:'24px 28px', borderRadius:18, background: BRAND.bg, border:`1px solid ${BRAND.border}`,
            position:'relative', overflow:'hidden', marginBottom:16,
          }}>
            <div style={{ position:'absolute', top:0, right:0, bottom:0, width:280,
              background: `radial-gradient(ellipse at 90% 50%, ${BRAND.gPale}, transparent 60%)`, pointerEvents:'none' }}/>
            <Sparkles count={5} color={BRAND.gLight} size={1.5}/>
            <div style={{ position:'absolute', top:'-20%', right:'-10%', width:'40%', height:'140%',
              borderRadius:'50%', background:`radial-gradient(circle, ${BRAND.gLight}55, transparent 65%)`,
              animation:'fw-blob-1 16s ease-in-out infinite', pointerEvents:'none', filter:'blur(4px)' }}/>
            <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:24 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: BRAND.gMid }}>You are owed</div>
                <div style={{ fontFamily: FONT_SERIF, fontSize:56, color: BRAND.ink, letterSpacing:'-1.5px', lineHeight:1, marginTop:6 }}>
                  <MoneyCounter value={g.myBalance} sign={true}/>
                </div>
                <div style={{ fontSize:13, color: BRAND.ink2, marginTop:10 }}>Across {g.members.length-1} others · {g.coin} on Solana</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button className="fw-btn" style={{ padding:'12px 22px', borderRadius:11, background: BRAND.grad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
                  <Icon name="check" size={16}/> Settle up
                </button>
                <button className="fw-btn" style={{ padding:'12px 22px', borderRadius:11, background: BRAND.bg, color: BRAND.ink, border:`1px solid ${BRAND.border}`, fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
                  <Icon name="plus" size={16}/> Add expense
                </button>
              </div>
            </div>
            {/* Members balance row */}
            <div style={{ position:'relative', display:'flex', gap:8, marginTop:24, paddingTop:20, borderTop:`1px solid ${BRAND.border}` }}>
              {g.balances.map(b => {
                const p = personOf(b.who);
                const owed = b.v > 0;
                return (
                  <div key={b.who} style={{ flex:1, minWidth:0, padding:'10px 12px', borderRadius:12, background: BRAND.surface, border:`1px solid ${BRAND.border}`, display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar who={b.who} size={28}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color: BRAND.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.1 }}>{b.who === 'me' ? 'You' : p.name}</div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:4, marginTop:2 }}>
                        <span style={{ fontSize:10, color: BRAND.ink3, whiteSpace:'nowrap' }}>{owed ? 'gets' : 'owes'}</span>
                        <span style={{ fontFamily: FONT_SERIF, fontSize:14, color: owed ? BRAND.gMid : BRAND.red, letterSpacing:'-0.2px', whiteSpace:'nowrap' }}>{fmtUSDshort(Math.abs(b.v))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expense list */}
          <div style={{ background: BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:16, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${BRAND.border}` }}>
              <h3 style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.ink, letterSpacing:'-0.3px' }}>Expenses</h3>
              <div style={{ display:'flex', gap:6 }}>
                <Pill active>All</Pill>
                <Pill>You paid</Pill>
                <Pill>You owe</Pill>
              </div>
            </div>
            {g.expenses.map((e, i) => {
              const payer = personOf(e.payer);
              return (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom: i < g.expenses.length-1 ? `1px solid ${BRAND.border}` : 'none' }}>
                  <div style={{ width:44, height:44, borderRadius:12, background: BRAND.surface, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{e.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:BRAND.ink, lineHeight:1.2 }}>{e.name}</div>
                    <div style={{ fontSize:12, color: BRAND.ink2, marginTop:3, display:'flex', alignItems:'center', gap:6 }}>
                      <Avatar who={e.payer} size={16}/>
                      <span>{e.payer === 'me' ? 'You' : payer.name} paid</span>
                      <span style={{ opacity:0.4 }}>·</span>
                      <span>{e.date} {e.time}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px' }}>{fmtUSD(e.total)}</div>
                    <div style={{ fontSize:12, color: e.myShare >= 0 ? BRAND.gMid : BRAND.red, fontWeight:600, marginTop:2 }}>
                      {e.myShare >= 0 ? 'you get ' : 'you owe '}{fmtUSDshort(Math.abs(e.myShare))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar — settlement plan & members */}
        <aside style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ padding:'18px 20px', borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <Icon name="sparkles" size={16} color={BRAND.gMid}/>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:BRAND.gMid }}>Suggested settlement</div>
            </div>
            <div style={{ fontSize:13, color: BRAND.ink2, marginBottom:14 }}>3 transfers will balance everyone. <strong style={{ color:BRAND.ink }}>~$0.001 in gas</strong>.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {g.settlements.map((s, i) => {
                const from = personOf(s.from), to = personOf(s.to);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, background: BRAND.surface, border:`1px solid ${BRAND.border}` }}>
                    <Avatar who={s.from} size={28}/>
                    <Icon name="arrow-r" size={14} color={BRAND.ink3}/>
                    <Avatar who={s.to} size={28}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color: BRAND.ink, lineHeight:1.2 }}>{s.from === 'me' ? 'You' : from.name} → {s.to === 'me' ? 'You' : to.name}</div>
                    </div>
                    <div style={{ fontFamily: FONT_SERIF, fontSize:15, color: BRAND.ink, letterSpacing:'-0.2px' }}>{fmtUSD(s.amt)}</div>
                  </div>
                );
              })}
            </div>
            <button style={{
              width:'100%', marginTop:14, padding:'12px', borderRadius:11, background: BRAND.grad, color:'#fff',
              border:'none', fontFamily: FONT_SANS, fontSize:13, fontWeight:700, cursor:'pointer',
            }}>Execute settlement →</button>
          </div>

          <div style={{ padding:'18px 20px', borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: BRAND.ink3, marginBottom:12 }}>Spending by category</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { name:'Stay',    pct:50, color: BRAND.gMid   },
                { name:'Food',    pct:30, color: BRAND.gFresh },
                { name:'Transit', pct:12, color: BRAND.gLight },
                { name:'Fun',     pct:8,  color: BRAND.amber  },
              ].map((c, i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color: BRAND.ink2, fontWeight:500 }}>{c.name}</span>
                    <span style={{ color: BRAND.ink, fontWeight:700, fontFamily: FONT_MONO, fontSize:11 }}>{c.pct}%</span>
                  </div>
                  <div style={{ height:6, background: BRAND.surface2, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${c.pct}%`, background: c.color, borderRadius:3 }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'18px 20px', borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: BRAND.ink3, marginBottom:12 }}>Group invite</div>
            <div style={{ padding:'12px', background: BRAND.surface, border:`1px dashed ${BRAND.border2}`, borderRadius:11, fontFamily: FONT_MONO, fontSize:11, color: BRAND.gForest, wordBreak:'break-all' }}>fundwise.app/join/g7xK2mN</div>
            <div style={{ display:'flex', gap:6, marginTop:10 }}>
              <button style={{ flex:1, padding:'8px', borderRadius:9, background: BRAND.surface, border:`1px solid ${BRAND.border}`, color: BRAND.ink2, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily: FONT_SANS }}><Icon name="copy" size={13}/> Copy</button>
              <button style={{ flex:1, padding:'8px', borderRadius:9, background: BRAND.surface, border:`1px solid ${BRAND.border}`, color: BRAND.ink2, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily: FONT_SANS }}><Icon name="qr" size={13}/> QR</button>
            </div>
          </div>
        </aside>
      </div>
    </DesktopShell>
  );
}

/* ── Desktop Fund-mode group detail ── */
function DesktopFundDetail({ groupId='priya' }) {
  const g = GROUPS.find(x => x.id === groupId);
  const pendingCount = g.proposals.filter(p => p.status === 'pending').length;
  return (
    <DesktopShell active="groups">
      <DesktopTopbar
        title={<>{g.name}</>}
        breadcrumb={<>Groups <span style={{ margin:'0 6px', opacity:0.5 }}>›</span> Fund mode</>}
      />
      <div style={{ padding:'24px 32px 48px', display:'grid', gridTemplateColumns:'1fr 360px', gap:24 }}>
        <div>
          {/* Treasury hero — premium surface */}
          <PremiumSurface
            background={BRAND.bGrad}
            radius={20}
            glowColor="rgba(42,79,168,0.35)"
            style={{ marginBottom:24 }}
          >
            <div style={{ padding:'26px 30px', color:'#fff' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:24 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:100, background:'rgba(255,255,255,0.16)', border:'1px solid rgba(255,255,255,0.25)', fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    <Icon name="lock" size={11} color="#fff"/> Vault
                  </span>
                  <span style={{ fontSize:11, opacity:0.7 }}>Solana · USDC</span>
                </div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.78, marginTop:14 }}>Treasury balance</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:14, marginTop:4, flexWrap:'wrap' }}>
                  <div style={{ fontFamily: FONT_SERIF, fontSize:60, letterSpacing:'-1.8px', lineHeight:1.05, whiteSpace:'nowrap' }}>
                    <MoneyCounter value={g.total}/>
                  </div>
                  <div style={{ fontSize:14, opacity:0.78, paddingLeft:2, whiteSpace:'nowrap' }}>of {fmtUSDshort(g.goal)}</div>
                </div>
                <div style={{ height:8, background:'rgba(255,255,255,0.16)', borderRadius:4, marginTop:18, overflow:'hidden', position:'relative' }}>
                  <div style={{ height:'100%', width:`${(g.total/g.goal)*100}%`, background:'#fff', borderRadius:4, boxShadow:'0 0 12px rgba(255,255,255,0.6)', position:'relative' }}>
                    <BarShine radius={4}/>
                  </div>
                </div>
                <div style={{ fontSize:12, opacity:0.82, marginTop:12 }}>{g.members.length} members contributing · {Math.round((g.total/g.goal)*100)}% to goal</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button className="fw-btn" style={{ padding:'12px 22px', borderRadius:11, background:'#fff', color: BRAND.bMid, border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 8px rgba(0,0,0,0.12)', whiteSpace:'nowrap' }}>
                  <Icon name="arrow-dn" size={16}/> Contribute
                </button>
                <button className="fw-btn" style={{ padding:'12px 22px', borderRadius:11, background:'rgba(255,255,255,0.14)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
                  <Icon name="plus" size={16}/> New proposal
                </button>
              </div>
            </div>
            </div>
          </PremiumSurface>

          {/* Member contributions strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:8, marginBottom:16 }}>
            {g.contributions.map(c => {
              const p = personOf(c.who);
              return (
                <div key={c.who} style={{ padding:'12px 10px', borderRadius:12, background: BRAND.bg, border:`1px solid ${BRAND.border}`, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  <Avatar who={c.who} size={32}/>
                  <div style={{ fontSize:11, fontWeight:600, color:BRAND.ink, lineHeight:1 }}>{c.who === 'me' ? 'You' : p.name}</div>
                  <div style={{ fontSize:11, color: BRAND.bMid, fontFamily: FONT_MONO, fontWeight:600 }}>{fmtUSDshort(c.v)}</div>
                </div>
              );
            })}
          </div>

          {/* Proposals */}
          <div style={{ background: BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:16, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${BRAND.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <h3 style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.ink, letterSpacing:'-0.3px' }}>Proposals</h3>
                {pendingCount > 0 && <span style={{ padding:'2px 8px', borderRadius:100, background: BRAND.amberPale, color: BRAND.amber, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>{pendingCount} pending</span>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <Pill active color={BRAND.bMid} bg={BRAND.bPale} border={BRAND.bBorder}>All</Pill>
                <Pill>Pending</Pill>
                <Pill>Executed</Pill>
              </div>
            </div>
            {g.proposals.map((p, i) => (
              <DesktopProposalCard key={p.id} p={p} threshold={g.threshold} isLast={i === g.proposals.length-1}/>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ padding:'18px 20px', borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: BRAND.ink3, marginBottom:12 }}>Vault details</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:13 }}>
              <Row k="Vault PDA" v={<span style={{ fontFamily: FONT_MONO, fontSize:11 }}>9xKp…m4q</span>}/>
              <Row k="Threshold" v={<><strong>{g.threshold.yes}</strong> of {g.threshold.of}</>}/>
              <Row k="Token" v={<>{g.coin} · Solana</>}/>
              <Row k="Withdraw lock" v="Until 100% goal"/>
              <Row k="Created" v="Apr 12, 2026"/>
            </div>
          </div>

          <div style={{ padding:'18px 20px', borderRadius:16, background: BRAND.bg, border:`1px solid ${BRAND.border}` }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color: BRAND.ink3, marginBottom:12 }}>Activity</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { who:'asha',  act:'proposed "Amazon gift card"', time:'38m' },
                { who:'mia',   act:'voted yes on "Bouquet"', time:'2h' },
                { who:'kiran', act:'executed "Nobu dinner"', time:'1d' },
                { who:'dev',   act:'contributed $100', time:'3d' },
              ].map((a, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar who={a.who} size={26}/>
                  <div style={{ flex:1, fontSize:12, color: BRAND.ink2, lineHeight:1.4 }}>
                    <strong style={{ color: BRAND.ink }}>{personOf(a.who).name}</strong> {a.act}
                  </div>
                  <div style={{ fontSize:11, color: BRAND.ink3 }}>{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </DesktopShell>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, fontSize:13 }}>
      <span style={{ color: BRAND.ink2, whiteSpace:'nowrap' }}>{k}</span>
      <span style={{ color: BRAND.ink, fontWeight:600, whiteSpace:'nowrap', textAlign:'right' }}>{v}</span>
    </div>
  );
}

function DesktopProposalCard({ p, threshold, isLast }) {
  const status = p.status;
  const statusMap = {
    pending:  { label:'Voting', bg: BRAND.amberPale, fg: BRAND.amber, gold:false },
    approved: { label:'Approved', bg: BRAND.gPale, fg: BRAND.gMid, gold:false },
    executed: { label:'Executed', bg: BRAND.goldPale || BRAND.surface2, fg: BRAND.gold || BRAND.ink2, gold:true },
  };
  const s = statusMap[status];
  return (
    <div style={{ padding:'18px 20px', borderBottom: isLast ? 'none' : `1px solid ${BRAND.border}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            {s.gold ? (
              <GoldShimmer><Icon name="check" size={10} color="#3D2A0B" strokeWidth={3}/> {s.label}</GoldShimmer>
            ) : (
              <span style={{ padding:'3px 9px', borderRadius:100, background: s.bg, color: s.fg, fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{s.label}</span>
            )}
            <span style={{ fontSize:11, color: BRAND.ink3, whiteSpace:'nowrap' }}>by {personOf(p.by).name} · {p.time}</span>
          </div>
          <div style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.ink, letterSpacing:'-0.3px', lineHeight:1.2 }}>{p.title}</div>
          <div style={{ fontSize:12, color: BRAND.ink2, marginTop:3 }}>{p.memo}</div>
        </div>
        <div style={{ fontFamily: FONT_SERIF, fontSize:26, color: BRAND.bMid, letterSpacing:'-0.5px' }}>{fmtUSD(p.amt)}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ flex:1 }}>
          <VoteBar yes={p.yes} no={p.no} total={p.tot} threshold={threshold.yes} color={BRAND.bMid}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color: BRAND.ink2, marginTop:6 }}>
            <span><strong style={{ color: BRAND.bMid }}>{p.yes}</strong> yes · <strong style={{ color: BRAND.red }}>{p.no}</strong> no</span>
            <span>Needs <strong>{threshold.yes}</strong> of {threshold.of}</span>
          </div>
        </div>
        {status === 'pending' && (
          <div style={{ display:'flex', gap:6 }}>
            <button style={{ padding:'9px 14px', borderRadius:9, background: BRAND.bMid, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer' }}>Vote yes</button>
            <button style={{ padding:'9px 14px', borderRadius:9, background: BRAND.surface, color: BRAND.ink2, border:`1px solid ${BRAND.border}`, fontFamily: FONT_SANS, fontSize:12, fontWeight:700, cursor:'pointer' }}>No</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DesktopHome, DesktopSplitDetail, DesktopFundDetail, DesktopShell, DesktopTopbar, DesktopGroupCard, DesktopProposalCard });
