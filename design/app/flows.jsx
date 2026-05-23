/* Flows — add expense, deposit, withdraw/settle, create proposal, vote sheet
   + Telegram mini-app variant + Onboarding */

const { useState: useStateF } = React;

/* ── Reusable bottom sheet over a phone background ── */
function MobileSheetFrame({ bgScreen, children, sheetHeight='auto', dark=false }) {
  return (
    <MobileFrame dark={dark}>
      <div style={{ position:'absolute', inset:0, paddingTop:50 }}>
        {/* dimmed background */}
        <div style={{ position:'absolute', inset:0, opacity:0.4, pointerEvents:'none' }}>{bgScreen}</div>
        <div style={{ position:'absolute', inset:0, background:'rgba(13,31,20,0.5)', backdropFilter:'blur(2px)' }}/>
        {/* sheet */}
        <div style={{
          position:'absolute', left:0, right:0, bottom:0,
          background: BRAND.bg, borderRadius:'24px 24px 0 0',
          padding:'10px 0 26px', maxHeight:'88%', overflow:'auto',
          boxShadow:'0 -8px 32px rgba(13,31,20,0.2)',
        }}>
          <div style={{ width:36, height:4, borderRadius:2, background: BRAND.border2, margin:'0 auto 10px' }}/>
          {children}
        </div>
      </div>
    </MobileFrame>
  );
}

/* Background that the sheets sit on top of */
function HomeBg() {
  return (
    <div style={{ height:'100%', background:BRAND.bg, padding:'4px 20px 14px' }}>
      <div style={{ fontSize:13, color:BRAND.ink2 }}>Good morning,</div>
      <div style={{ fontFamily: FONT_SERIF, fontSize:30, color:BRAND.ink, letterSpacing:'-0.6px', lineHeight:1.1 }}>Sarthi 👋</div>
    </div>
  );
}

/* ── 4. Add Expense flow (Split) ── */
function MobileAddExpense() {
  const [amount] = useStateF(48);
  const [splitMode, setSplitMode] = useStateF('equal');
  const members = ['me','asha','kiran','dev'];
  return (
    <MobileSheetFrame bgScreen={<HomeBg/>}>
      <div style={{ padding:'4px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <button style={{ background:'none', border:'none', color: BRAND.ink2, fontSize:14, cursor:'pointer', fontFamily: FONT_SANS }}>Cancel</button>
          <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px' }}>New expense</div>
          <div style={{ width:48 }}/>
        </div>

        {/* Amount input */}
        <div style={{ padding:'24px 20px', borderRadius:18, background: BRAND.gPale, border:`1px solid ${BRAND.border2}`, textAlign:'center', marginBottom:14, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${BRAND.gLight}40, transparent 70%)` }}/>
          <div style={{ fontSize:10, fontWeight:700, color: BRAND.gMid, letterSpacing:'0.08em', textTransform:'uppercase', position:'relative' }}>Amount in USDC</div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4, marginTop:6, position:'relative' }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize:42, color: BRAND.ink, lineHeight:1, letterSpacing:'-1px' }}>$</span>
            <span style={{ fontFamily: FONT_SERIF, fontSize:56, color: BRAND.ink, lineHeight:1, letterSpacing:'-1.6px' }}>{amount}</span>
            <span style={{ fontFamily: FONT_SERIF, fontSize:32, color: BRAND.ink3, lineHeight:1 }}>.00</span>
            <span style={{ width:2, height:48, background: BRAND.gMid, marginLeft:4, animation:'caret 1s steps(2) infinite' }}/>
          </div>
        </div>

        <Field label="Description" value="Airport taxi" icon="🚕"/>
        <Field label="Group" value="Lisbon Trip" sub="Split mode · 4 members"/>
        <Field label="Paid by" value="You" sub="(7xKp…mN4q)"/>
        <Field label="Date" value="Today, 14:32"/>

        {/* Split picker */}
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color: BRAND.ink3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Split how?</div>
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {[
              { id:'equal', label:'Equally' },
              { id:'exact', label:'By amount' },
              { id:'pct',   label:'By %' },
              { id:'share', label:'By share' },
            ].map(m => (
              <button key={m.id} onClick={()=> setSplitMode(m.id)} style={{
                flex:1, padding:'8px 4px', borderRadius:9,
                background: splitMode===m.id ? BRAND.gPale : BRAND.surface,
                border: `1px solid ${splitMode===m.id ? BRAND.border2 : BRAND.border}`,
                color: splitMode===m.id ? BRAND.gMid : BRAND.ink2,
                fontSize:11, fontWeight:600, fontFamily: FONT_SANS, cursor:'pointer',
              }}>{m.label}</button>
            ))}
          </div>
          {/* Member shares */}
          <div style={{ background: BRAND.surface, borderRadius:12, border:`1px solid ${BRAND.border}`, padding:'4px 0' }}>
            {members.map((m, i) => {
              const p = personOf(m);
              return (
                <div key={m} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom: i<members.length-1 ? `1px solid ${BRAND.border}` : 'none' }}>
                  <Avatar who={m} size={28}/>
                  <div style={{ flex:1, fontSize:13, fontWeight:600, color:BRAND.ink }}>{m === 'me' ? 'You' : p.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: BRAND.gMid, width:18, height:18 }}/>
                    <div style={{ fontFamily: FONT_MONO, fontSize:13, color: BRAND.ink2, minWidth:48, textAlign:'right' }}>$12.00</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ padding:'16px 20px 0', position:'sticky', bottom:0, background: BRAND.bg }}>
        <button style={{ width:'100%', padding:'14px', borderRadius:12, background: BRAND.grad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          Add expense · sign with Phantom
        </button>
      </div>
    </MobileSheetFrame>
  );
}

function Field({ label, value, sub, icon }) {
  return (
    <div style={{
      padding:'12px 14px', borderRadius:11, background: BRAND.surface, border:`1px solid ${BRAND.border}`,
      marginBottom:8, display:'flex', alignItems:'center', gap:12,
    }}>
      {icon && <div style={{ width:36, height:36, borderRadius:10, background: BRAND.bg, border:`1px solid ${BRAND.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{icon}</div>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:10, fontWeight:700, color: BRAND.ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</div>
        <div style={{ fontSize:13, fontWeight:600, color: BRAND.ink, marginTop:1 }}>{value}</div>
        {sub && <div style={{ fontSize:11, color: BRAND.ink3, marginTop:1 }}>{sub}</div>}
      </div>
      <Icon name="chevron-r" size={16} color={BRAND.ink3}/>
    </div>
  );
}

/* ── 5. Contribute / Deposit flow (Fund) ── */
function MobileDeposit() {
  const [amount, setAmount] = useStateF(50);
  const [source, setSource] = useStateF('phantom');
  return (
    <MobileSheetFrame bgScreen={<HomeBg/>}>
      <div style={{ padding:'4px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <button style={{ background:'none', border:'none', color: BRAND.ink2, fontSize:14, cursor:'pointer', fontFamily: FONT_SANS }}>Cancel</button>
          <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px' }}>Contribute to fund</div>
          <div style={{ width:48 }}/>
        </div>

        {/* Group context */}
        <div style={{ padding:'14px', borderRadius:14, background: BRAND.bPale, border:`1px solid ${BRAND.bBorder}`, display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:'linear-gradient(135deg,#A8C0F0,#6B85D4)', flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily: FONT_SERIF, fontSize:16, color: BRAND.ink, letterSpacing:'-0.2px' }}>Priya's Wedding Gift</div>
            <div style={{ fontSize:11, color: BRAND.ink2 }}>$600 of $750 · 6 contributors</div>
          </div>
          <ModeBadge mode="fund"/>
        </div>

        {/* Amount */}
        <div style={{ padding:'24px 20px', borderRadius:18, background: BRAND.bPale, border:`1px solid ${BRAND.bBorder}`, textAlign:'center', marginBottom:14, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, left:-20, width:80, height:80, borderRadius:'50%', background:`radial-gradient(circle, ${BRAND.bFresh}30, transparent 70%)` }}/>
          <div style={{ position:'relative' }}>
            <div style={{ fontSize:10, fontWeight:700, color: BRAND.bMid, letterSpacing:'0.08em', textTransform:'uppercase' }}>Amount</div>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:2, marginTop:6 }}>
              <span style={{ fontFamily: FONT_SERIF, fontSize:42, color: BRAND.ink, lineHeight:1, letterSpacing:'-1px' }}>$</span>
              <span style={{ fontFamily: FONT_SERIF, fontSize:56, color: BRAND.ink, lineHeight:1, letterSpacing:'-1.6px' }}>{amount}</span>
              <span style={{ fontFamily: FONT_SERIF, fontSize:32, color: BRAND.ink3, lineHeight:1 }}>.00</span>
            </div>
            <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:14 }}>
              {[25,50,100,150].map(v=> (
                <button key={v} onClick={()=> setAmount(v)} style={{
                  padding:'6px 12px', borderRadius:100, fontSize:12, fontWeight:600,
                  background: amount===v ? BRAND.bMid : BRAND.bg,
                  color: amount===v ? '#fff' : BRAND.bMid,
                  border:`1px solid ${amount===v ? BRAND.bMid : BRAND.bBorder}`,
                  fontFamily: FONT_SANS, cursor:'pointer',
                }}>${v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Source selector */}
        <div style={{ fontSize:11, fontWeight:700, color: BRAND.ink3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Pay from</div>
        <div style={{ background: BRAND.surface, borderRadius:14, border:`1px solid ${BRAND.border}`, overflow:'hidden', marginBottom:14 }}>
          {[
            { id:'phantom',  label:'Phantom Wallet',  sub:'7xKp…mN4q · 412 USDC', icon:'👻', bg:'#4C44C6' },
            { id:'bridge',   label:'Bridge from Base',sub:'Cross-chain · ~12s',   icon:'🌉', bg:'#0052FF' },
            { id:'card',     label:'Apple Pay',       sub:'•••• 4242 · fiat→USDC',icon:'',   ap:true },
            { id:'tg',       label:'TON Wallet',      sub:'Via Telegram',         icon:'💎', bg:'#0098EA' },
          ].map((s, i) => (
            <button key={s.id} onClick={()=> setSource(s.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
              background: source===s.id ? BRAND.bPale : 'transparent',
              borderBottom: i<3 ? `1px solid ${BRAND.border}` : 'none',
              border:'none', borderLeft:'none', borderRight:'none', borderTop:'none',
              cursor:'pointer', textAlign:'left', fontFamily: FONT_SANS,
            }}>
              <div style={{ width:34, height:34, borderRadius:10, background: s.ap ? '#000' : s.bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                {s.ap ? <span style={{ fontFamily:'-apple-system', fontWeight:600, fontSize:14 }}> Pay</span> : s.icon}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:BRAND.ink }}>{s.label}</div>
                <div style={{ fontSize:11, color: BRAND.ink2, marginTop:1 }}>{s.sub}</div>
              </div>
              <div style={{
                width:18, height:18, borderRadius:'50%',
                border:`2px solid ${source===s.id ? BRAND.bMid : BRAND.border2}`,
                background: source===s.id ? BRAND.bMid : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {source===s.id && <Icon name="check" size={11} color="#fff" strokeWidth={3}/>}
              </div>
            </button>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background: BRAND.surface, borderRadius:12, border:`1px solid ${BRAND.border}`, padding:'12px 14px', marginBottom:14 }}>
          <SummaryRow k="You contribute" v={`$${amount}.00 USDC`}/>
          <SummaryRow k="Network fee" v="~$0.001"/>
          <SummaryRow k="Your share after" v={`$${100+amount} of $${600+amount}`}/>
          <SummaryRow k="New fund total" v={`$${600+amount} of $750`} accent={BRAND.bMid}/>
        </div>
      </div>
      <div style={{ padding:'4px 20px 0', position:'sticky', bottom:0, background: BRAND.bg }}>
        <button style={{ width:'100%', padding:'14px', borderRadius:12, background: BRAND.bGrad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <Icon name="lock" size={15} color="#fff"/> Contribute ${amount} to vault
        </button>
        <div style={{ textAlign:'center', fontSize:10, color: BRAND.ink3, marginTop:8 }}>Locked until 100% goal or threshold withdraw vote</div>
      </div>
    </MobileSheetFrame>
  );
}

function SummaryRow({ k, v, accent }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', fontSize:12 }}>
      <span style={{ color: BRAND.ink2 }}>{k}</span>
      <span style={{ color: accent || BRAND.ink, fontWeight:600, fontFamily: FONT_MONO }}>{v}</span>
    </div>
  );
}

/* ── 6. Settle Up flow ── */
function MobileSettle() {
  return (
    <MobileSheetFrame bgScreen={<HomeBg/>}>
      <div style={{ padding:'4px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <button style={{ background:'none', border:'none', color: BRAND.ink2, fontSize:14, cursor:'pointer', fontFamily: FONT_SANS }}>Close</button>
          <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px' }}>Settle up</div>
          <div style={{ width:48 }}/>
        </div>

        {/* Suggestion banner */}
        <div style={{ padding:'14px', borderRadius:14, background: BRAND.gPale, border:`1px solid ${BRAND.border2}`, marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="sparkles" size={18} color={BRAND.gMid}/>
          <div style={{ flex:1, fontSize:12, color: BRAND.ink2 }}>
            We minimized to <strong style={{ color:BRAND.ink }}>3 transfers</strong> — everyone clear in one batch.
          </div>
        </div>

        {/* Transfer plan */}
        <div style={{ background: BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 }}>
          {[
            { from:'kiran', to:'me',    amt:30,  status:'ready' },
            { from:'dev',   to:'me',    amt:30,  status:'ready' },
            { from:'asha',  to:'kiran', amt:24.5,status:'pending' },
          ].map((s, i) => {
            const from = personOf(s.from), to = personOf(s.to);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 14px', borderBottom: i<2 ? `1px solid ${BRAND.border}` : 'none' }}>
                <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                  <Avatar who={s.from} size={32}/>
                  <div style={{
                    width:18, height:18, borderRadius:'50%',
                    background: BRAND.bg, border:`2px solid ${BRAND.bg}`,
                    marginLeft:-6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    <Icon name="arrow-r" size={11} color={BRAND.gMid} strokeWidth={2.5}/>
                  </div>
                  <Avatar who={s.to} size={32}/>
                </div>
                <div style={{ flex:1, marginLeft:6 }}>
                  <div style={{ fontSize:13, fontWeight:600, color: BRAND.ink, lineHeight:1.2 }}>
                    {s.from==='me' ? 'You' : from.name} → {s.to==='me' ? 'You' : to.name}
                  </div>
                  <div style={{ fontSize:11, color: BRAND.ink3, marginTop:2, fontFamily: FONT_MONO }}>USDC · Solana</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.3px' }}>{fmtUSD(s.amt)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div style={{ background: BRAND.surface, borderRadius:12, border:`1px solid ${BRAND.border}`, padding:'12px 14px', marginBottom:14 }}>
          <SummaryRow k="You receive" v="+$60.00" accent={BRAND.gMid}/>
          <SummaryRow k="Network fee" v="$0.003"/>
          <SummaryRow k="Settlement window" v="~6 sec"/>
        </div>
      </div>
      <div style={{ padding:'4px 20px 0', position:'sticky', bottom:0, background: BRAND.bg }}>
        <button style={{ width:'100%', padding:'14px', borderRadius:12, background: BRAND.grad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <Icon name="check" size={16}/> Execute all · sign once
        </button>
        <div style={{ textAlign:'center', fontSize:10, color: BRAND.ink3, marginTop:8 }}>Signed via Phantom · batched in one transaction</div>
      </div>
    </MobileSheetFrame>
  );
}

/* ── 7. Create Proposal + Vote flow ── */
function MobileCreateProposal() {
  return (
    <MobileSheetFrame bgScreen={<HomeBg/>}>
      <div style={{ padding:'4px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <button style={{ background:'none', border:'none', color: BRAND.ink2, fontSize:14, cursor:'pointer', fontFamily: FONT_SANS }}>Cancel</button>
          <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px' }}>New proposal</div>
          <div style={{ width:48 }}/>
        </div>

        <Field label="Group" value="Priya's Wedding Gift" sub="Fund mode · 6 members" icon="🎁"/>
        <Field label="Title" value="Amazon gift card order"/>

        {/* Amount */}
        <div style={{ padding:'18px 20px', borderRadius:14, background: BRAND.bPale, border:`1px solid ${BRAND.bBorder}`, textAlign:'center', marginBottom:10 }}>
          <div style={{ fontSize:10, fontWeight:700, color: BRAND.bMid, letterSpacing:'0.08em', textTransform:'uppercase' }}>Spend</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize:42, color: BRAND.ink, letterSpacing:'-1px', marginTop:2 }}>$450.00</div>
          <div style={{ fontSize:11, color: BRAND.ink2, marginTop:2 }}>Treasury has $600 · $150 left</div>
        </div>

        <Field label="Recipient" value="amazon-gift@payouts.com" sub="External · email/USDC" icon="✉"/>
        <Field label="Memo" value="Priya's wedding gift card"/>

        {/* Proposal type */}
        <div style={{ marginTop:6 }}>
          <div style={{ fontSize:11, fontWeight:700, color: BRAND.ink3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Schedule</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
            {[
              { id:'once', label:'One-time', icon:'check' },
              { id:'recur',label:'Recurring',icon:'clock' },
              { id:'lock', label:'Time-locked',icon:'lock'},
            ].map((s, i)=> (
              <button key={s.id} style={{
                padding:'10px 8px', borderRadius:10,
                background: i===0 ? BRAND.bPale : BRAND.surface,
                border:`1px solid ${i===0 ? BRAND.bBorder : BRAND.border}`,
                color: i===0 ? BRAND.bMid : BRAND.ink2,
                fontFamily: FONT_SANS, fontSize:11, fontWeight:600, cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
                <Icon name={s.icon} size={15} color={i===0 ? BRAND.bMid : BRAND.ink2}/>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Threshold preview */}
        <div style={{ marginTop:14, padding:'12px 14px', background: BRAND.surface, borderRadius:12, border:`1px solid ${BRAND.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontSize:11, fontWeight:700, color: BRAND.ink3, letterSpacing:'0.06em', textTransform:'uppercase' }}>Threshold</div>
            <div style={{ fontSize:12, fontWeight:700, color: BRAND.ink }}>4 of 6 yes</div>
          </div>
          <div style={{ height:5, background: BRAND.surface2, borderRadius:3, overflow:'hidden', display:'flex' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ flex:1, marginRight: i<6?2:0, background: i<=4 ? BRAND.bMid : BRAND.surface2, borderRadius:1 }}/>
            ))}
          </div>
          <div style={{ fontSize:10, color: BRAND.ink3, marginTop:6 }}>Auto-executes once 4 members vote yes</div>
        </div>
      </div>
      <div style={{ padding:'16px 20px 0', position:'sticky', bottom:0, background: BRAND.bg }}>
        <button style={{ width:'100%', padding:'14px', borderRadius:12, background: BRAND.bGrad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer' }}>
          Propose · open vote
        </button>
      </div>
    </MobileSheetFrame>
  );
}

/* ── 7b. Vote screen (proposal detail with comments) ── */
function MobileVoteSheet() {
  return (
    <MobileSheetFrame bgScreen={<HomeBg/>}>
      <div style={{ padding:'4px 20px 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <button style={{ background:'none', border:'none', color: BRAND.ink2, fontSize:14, cursor:'pointer', fontFamily: FONT_SANS }}>Close</button>
          <div style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.2px' }}>Proposal</div>
          <Icon name="attach" size={18} color={BRAND.ink2}/>
        </div>

        {/* Header */}
        <div style={{ padding:'18px', borderRadius:16, background: BRAND.bPale, border:`1px solid ${BRAND.bBorder}`, marginBottom:14, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-20, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${BRAND.bFresh}30, transparent 70%)` }}/>
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
              <span style={{ padding:'2px 9px', borderRadius:100, background: BRAND.amberPale, color: BRAND.amber, fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>Voting</span>
              <span style={{ fontSize:11, color: BRAND.ink2 }}>by Asha · 38m</span>
            </div>
            <div style={{ fontFamily: FONT_SERIF, fontSize:24, color: BRAND.ink, letterSpacing:'-0.4px', lineHeight:1.15 }}>Amazon gift card order</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:8 }}>
              <div style={{ fontFamily: FONT_SERIF, fontSize:36, color: BRAND.bMid, letterSpacing:'-0.8px' }}>$450</div>
              <div style={{ fontSize:12, color: BRAND.ink2 }}>USDC · to amazon-gift@payouts.com</div>
            </div>

            {/* Vote bar */}
            <div style={{ marginTop:14 }}>
              <VoteBar yes={3} no={0} total={6} threshold={4} color={BRAND.bMid} height={10}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, fontSize:12, color: BRAND.ink2 }}>
                <span><strong style={{ color: BRAND.bMid, fontSize:14 }}>3</strong> of 6 yes</span>
                <span><strong style={{ color: BRAND.ink }}>1 more</strong> needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Members + votes */}
        <div style={{ background: BRAND.bg, border:`1px solid ${BRAND.border}`, borderRadius:14, overflow:'hidden', marginBottom:14 }}>
          {[
            { who:'asha',  vote:'yes', time:'38m', proposer:true },
            { who:'kiran', vote:'yes', time:'24m' },
            { who:'mia',   vote:'yes', time:'18m' },
            { who:'dev',   vote:null },
            { who:'raj',   vote:null },
            { who:'me',    vote:null },
          ].map((m, i) => {
            const p = personOf(m.who);
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom: i<5 ? `1px solid ${BRAND.border}` : 'none' }}>
                <Avatar who={m.who} size={28}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color: BRAND.ink }}>{m.who === 'me' ? 'You' : p.name}{m.proposer && <span style={{ fontSize:10, color:BRAND.ink3, marginLeft:6, fontWeight:500 }}>proposer</span>}</div>
                </div>
                {m.vote === 'yes' && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color: BRAND.gMid, fontWeight:600 }}>
                    <span style={{ width:14, height:14, borderRadius:'50%', background: BRAND.gMid, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="check" size={9} color="#fff" strokeWidth={3}/></span>
                    Yes · {m.time}
                  </div>
                )}
                {m.vote === null && <span style={{ fontSize:11, color: BRAND.ink3, fontWeight:500 }}>Pending</span>}
              </div>
            );
          })}
        </div>

        {/* Comments */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color: BRAND.ink3, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:8 }}>Discussion · 2</div>
          {[
            { who:'kiran', msg:'Confirmed Priya has Amazon, this works. ✓', time:'21m' },
            { who:'mia',   msg:'Lets send a card with it too?', time:'17m' },
          ].map((c, i) => {
            const p = personOf(c.who);
            return (
              <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
                <Avatar who={c.who} size={26}/>
                <div style={{ flex:1 }}>
                  <div style={{ background: BRAND.surface, padding:'8px 12px', borderRadius:'4px 12px 12px 12px', fontSize:12, color: BRAND.ink, lineHeight:1.4 }}>
                    <div style={{ fontWeight:700, color: BRAND.ink, fontSize:11, marginBottom:1 }}>{p.name}</div>
                    {c.msg}
                  </div>
                  <div style={{ fontSize:10, color: BRAND.ink3, marginTop:3 }}>{c.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vote bar (sticky) */}
      <div style={{ padding:'14px 20px 0', position:'sticky', bottom:0, background: BRAND.bg, borderTop:`1px solid ${BRAND.border}` }}>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ flex:1, padding:'14px', borderRadius:12, background: BRAND.surface, color: BRAND.red, border:`1px solid ${BRAND.border}`, fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Icon name="close" size={16}/> Vote no
          </button>
          <button style={{ flex:2, padding:'14px', borderRadius:12, background: BRAND.bGrad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <Icon name="check" size={16}/> Vote yes & execute
          </button>
        </div>
      </div>
    </MobileSheetFrame>
  );
}

/* ── 8. Onboarding ── */
function MobileOnboardConnect() {
  return (
    <MobileFrame>
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'8px 28px 12px' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center' }}>
          <Logo size={64}/>
          <div style={{ fontFamily: FONT_SERIF, fontSize:34, color: BRAND.ink, letterSpacing:'-0.8px', lineHeight:1.05, marginTop:24 }}>
            Welcome to <em style={{ fontStyle:'italic', background: BRAND.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>FundWise</em>
          </div>
          <div style={{ fontSize:14, color: BRAND.ink2, marginTop:10, lineHeight:1.6, maxWidth:260 }}>
            Split expenses with friends, pool funds with intention — all on-chain.
          </div>
          {/* Decorative coin */}
          <div style={{ marginTop:32, position:'relative', height:140, width:'100%', display:'flex', justifyContent:'center', alignItems:'center' }}>
            <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', background: BRAND.grad, opacity:0.2, filter:'blur(30px)', animation:'fw-breathe 4s ease-in-out infinite' }}/>
            <Sparkles count={10} color={BRAND.gFresh} size={2}/>
            <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
              {['asha','kiran','mia','dev'].map((p, i) => (
                <div key={p} style={{ marginLeft: i===0 ? 0 : -14, animation:`float${i} 4s ease-in-out infinite`, animationDelay:`${i*0.3}s`, zIndex: 4 - i }}>
                  <Avatar who={p} size={52} ring={3}/>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ paddingBottom:18 }}>
          <button style={{ width:'100%', padding:'14px', borderRadius:14, background: BRAND.grad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:8 }}>
            Connect Phantom <Icon name="arrow-r" size={16}/>
          </button>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <button style={{ flex:1, padding:'12px', borderRadius:12, background: BRAND.bg, color: BRAND.ink, border:`1px solid ${BRAND.border}`, fontFamily: FONT_SANS, fontSize:13, fontWeight:600, cursor:'pointer' }}>Solflare</button>
            <button style={{ flex:1, padding:'12px', borderRadius:12, background: BRAND.bg, color: BRAND.ink, border:`1px solid ${BRAND.border}`, fontFamily: FONT_SANS, fontSize:13, fontWeight:600, cursor:'pointer' }}>Backpack</button>
            <button style={{ flex:1, padding:'12px', borderRadius:12, background: BRAND.bg, color: BRAND.ink, border:`1px solid ${BRAND.border}`, fontFamily: FONT_SANS, fontSize:13, fontWeight:600, cursor:'pointer' }}>More</button>
          </div>
          <div style={{ fontSize:11, color: BRAND.ink3, textAlign:'center', lineHeight:1.5 }}>
            No email. No password. Your wallet is your identity.
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}

function MobileOnboardCreate() {
  return (
    <MobileFrame>
      <MobileHeader
        left={<Icon name="chevron-l" size={22} color={BRAND.ink2}/>}
        title="Create group"
        right={<div style={{ fontSize:13, color: BRAND.ink3, fontFamily: FONT_MONO }}>1 of 3</div>}
      />
      <div style={{ flex:1, padding:'4px 20px 14px' }}>
        {/* Step dots */}
        <div style={{ display:'flex', gap:5, marginBottom:24 }}>
          <div style={{ flex:1, height:5, borderRadius:3, background: BRAND.gMid }}/>
          <div style={{ flex:1, height:5, borderRadius:3, background: BRAND.surface2 }}/>
          <div style={{ flex:1, height:5, borderRadius:3, background: BRAND.surface2 }}/>
        </div>

        <div style={{ fontFamily: FONT_SERIF, fontSize:28, color: BRAND.ink, letterSpacing:'-0.6px', lineHeight:1.1 }}>How will this group move money?</div>
        <div style={{ fontSize:13, color: BRAND.ink2, marginTop:8, lineHeight:1.6 }}>You can't switch later — pick the one that fits.</div>

        {/* Mode picker - bigger */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:24 }}>
          {/* Split */}
          <div style={{
            padding:'20px', borderRadius:18, background: BRAND.gPale, border:`2px solid ${BRAND.gMid}`,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${BRAND.gFresh}40, transparent 70%)` }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:11, background: BRAND.gMid, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="split" size={18} color="#fff" strokeWidth={2}/>
                </div>
                <div style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.ink, letterSpacing:'-0.3px' }}>Split mode</div>
                <span style={{ marginLeft:'auto', padding:'2px 8px', borderRadius:100, background: BRAND.gMid, color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'0.04em' }}>SELECTED</span>
              </div>
              <div style={{ fontSize:13, color: BRAND.ink2, lineHeight:1.5 }}>
                Log expenses as they happen. We minimize transfers and settle in one click when you're ready.
              </div>
              <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                {['Trips','Roommates','Date nights','Restaurants'].map(t => (
                  <span key={t} style={{ padding:'3px 8px', borderRadius:100, background:'#fff', color: BRAND.gMid, fontSize:10, fontWeight:600, border:`1px solid ${BRAND.border2}` }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Fund */}
          <div style={{ padding:'20px', borderRadius:18, background: BRAND.bg, border:`2px solid ${BRAND.border}`, position:'relative' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:11, background: BRAND.bPale, color: BRAND.bMid, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="fund" size={18} color={BRAND.bMid}/>
              </div>
              <div style={{ fontFamily: FONT_SERIF, fontSize:20, color: BRAND.ink, letterSpacing:'-0.3px' }}>Fund mode</div>
            </div>
            <div style={{ fontSize:13, color: BRAND.ink2, lineHeight:1.5 }}>
              Pool stablecoins upfront. Spend through proposals with threshold voting. Vault locks until goal.
            </div>
            <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
              {['Group gifts','Bachelor party','DAO treasury','Class fund'].map(t => (
                <span key={t} style={{ padding:'3px 8px', borderRadius:100, background: BRAND.surface, color: BRAND.ink2, fontSize:10, fontWeight:600, border:`1px solid ${BRAND.border}` }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding:'12px 20px 0', borderTop:`1px solid ${BRAND.border}`, background: BRAND.bg }}>
        <button style={{ width:'100%', padding:'14px', borderRadius:12, background: BRAND.grad, color:'#fff', border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          Continue with Split <Icon name="arrow-r" size={16}/>
        </button>
      </div>
    </MobileFrame>
  );
}

/* ── Telegram Mini-App variant ── */
function TelegramMiniApp() {
  return (
    <div style={{
      width:390, height:820, position:'relative', overflow:'hidden',
      borderRadius:24, boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
      background:'#0f1419', fontFamily: FONT_SANS,
    }}>
      {/* Telegram chrome */}
      <div style={{ height:88, background:'#17212B', display:'flex', flexDirection:'column' }}>
        {/* Status bar */}
        <div style={{ height:44, padding:'13px 24px 0', color:'#fff', fontSize:14, fontWeight:600, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>9:41</span>
          <span style={{ fontSize:11, opacity:0.7 }}>tg://app</span>
        </div>
        {/* TG nav */}
        <div style={{ flex:1, padding:'0 16px', display:'flex', alignItems:'center', gap:12, color:'#fff' }}>
          <Icon name="close" size={22} color="#fff"/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:600 }}>FundWise</div>
            <div style={{ fontSize:11, opacity:0.6 }}>mini app · @fundwise_bot</div>
          </div>
          <Icon name="menu" size={20} color="#fff"/>
        </div>
      </div>

      {/* App content (uses bg=tg-style but our brand) */}
      <div style={{
        height:'calc(100% - 88px)', overflow:'auto',
        background: BRAND.bg, color: BRAND.ink, paddingBottom:80,
      }}>
        {/* TG-style banner */}
        <div style={{ padding:'14px 20px 6px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#0098EA', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            <Icon name="tg" size={18} color="#fff"/>
          </div>
          <div style={{ flex:1, fontSize:12, color: BRAND.ink2 }}>
            Connected via Telegram · <strong style={{ color:BRAND.ink }}>@sarthi</strong>
          </div>
        </div>

        {/* Hero card */}
        <div style={{ margin:'4px 16px 14px', borderRadius:18, background: BRAND.grad, color:'#fff', padding:'18px 20px', position:'relative', overflow:'hidden' }}>
          <MeshGradient colors={['#fff','#fff','#fff']} intensity={0.25} radius={18}/>
          <Sparkles count={4} color="#fff" size={1.5}/>
          <Shimmer dur={10} radius={18}/>
          <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', opacity:0.85 }}>Net balance</div>
          <div style={{ fontFamily: FONT_SERIF, fontSize:36, letterSpacing:'-0.9px', marginTop:4 }}>
            <MoneyCounter value={39.50} sign={true}/>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button style={{ flex:1, padding:'8px', borderRadius:9, background:'#fff', color: BRAND.gForest, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily: FONT_SANS }}>Receive</button>
            <button style={{ flex:1, padding:'8px', borderRadius:9, background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.35)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily: FONT_SANS }}>Pay</button>
          </div>
          </div>
        </div>

        {/* Vote nudge */}
        <div style={{ margin:'0 16px 14px', borderRadius:12, background: BRAND.bPale, border:`1px solid ${BRAND.bBorder}`, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="vote" size={18} color={BRAND.bMid}/>
          <div style={{ flex:1, fontSize:12 }}>
            <strong style={{ color: BRAND.ink }}>Vote needed</strong>
            <div style={{ color: BRAND.ink2, fontSize:11, marginTop:1 }}>Amazon gift card · $450 · 1 more yes</div>
          </div>
          <Icon name="chevron-r" size={16} color={BRAND.bMid}/>
        </div>

        {/* Groups */}
        <div style={{ padding:'4px 20px 6px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize:18, color: BRAND.ink, letterSpacing:'-0.3px' }}>Groups</h3>
          <span style={{ fontSize:11, color: BRAND.ink3 }}>4 active</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'0 16px' }}>
          {GROUPS.slice(0,4).map(g => <MobileGroupCard key={g.id} g={g}/>)}
        </div>

        {/* TG share suggestion */}
        <div style={{ margin:'18px 16px 0', padding:'14px', borderRadius:12, background: BRAND.surface, border:`1px dashed ${BRAND.border2}`, textAlign:'center' }}>
          <Icon name="tg" size={20} color={BRAND.bMid}/>
          <div style={{ fontSize:12, color: BRAND.ink2, marginTop:6, lineHeight:1.5 }}>Share <strong style={{ color: BRAND.ink }}>@fundwise_bot</strong> in any chat<br/>to split with that group instantly.</div>
        </div>
      </div>

      {/* TG main button (sticky bottom) */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0, padding:'12px 16px 16px',
        background:'rgba(13,31,20,0.04)', borderTop:`1px solid ${BRAND.border}`, backdropFilter:'blur(8px)',
      }}>
        <button style={{
          width:'100%', padding:'14px', borderRadius:10, background:'#0098EA', color:'#fff',
          border:'none', fontFamily: FONT_SANS, fontSize:14, fontWeight:600, letterSpacing:'0.04em',
          textTransform:'uppercase', cursor:'pointer',
        }}>NEW EXPENSE</button>
      </div>
    </div>
  );
}

Object.assign(window, { MobileSheetFrame, MobileAddExpense, MobileDeposit, MobileSettle, MobileCreateProposal, MobileVoteSheet, MobileOnboardConnect, MobileOnboardCreate, TelegramMiniApp });
