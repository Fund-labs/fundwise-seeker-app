/* Sheets — AddExpense, Settle, Vote, Telegram share, CreateGroup, FabMenu, Invite, Deposit, Propose */

const { useState: useStateS } = React;

function Sheet({ title, onClose, children, body, foot }) {
  return (
    <div className="sheet-ov" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"></div>
        <div className="sheet-head">
          <div className="sheet-title">{title}</div>
          <button className="sheet-close" onClick={onClose}><CloseIcon size={12}/></button>
        </div>
        <div className="sheet-body">{body || children}</div>
        {foot && <div className="sheet-foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ── FAB action menu ── */
function FabMenuSheet({ onClose, onPick }) {
  const acts = [
    { id:'add-expense', t:'Add expense',   d:'Log a cost · split with the group', c:'#1A9151', i:<path d="M4 12h16M4 6h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/> },
    { id:'settle-pick', t:'Settle up',     d:'Pay what you owe · receive what you\u2019re owed', c:'#4EC98A', i:<><path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></> },
    { id:'deposit',     t:'Deposit to vault', d:'Top up a Fund-mode group', c:'#2A4FA8', i:<path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/> },
    { id:'create-group',t:'New group',     d:'Split or Fund · invite people', c:'#0A4D2C', i:<><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></> },
  ];
  return (
    <Sheet title="Quick actions" onClose={onClose}>
      <div className="fab-menu">
        {acts.map(a => (
          <div key={a.id} className="fab-act" onClick={()=>onPick(a.id)}>
            <div className="fa-ico" style={{background:a.c}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none">{a.i}</svg></div>
            <div className="fa-body"><div className="fa-t">{a.t}</div><div className="fa-d">{a.d}</div></div>
            <ChevronR/>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ── Add expense ── */
function AddExpenseSheet({ onClose, onSubmit, defaultGroupId, haptic }) {
  const splitGroups = GROUPS.filter(g => g.mode === 'split');
  const [gId, setGId] = useStateS(defaultGroupId || splitGroups[0].id);
  const [name, setName] = useStateS('');
  const [amount, setAmount] = useStateS('48.00');
  const [payer, setPayer] = useStateS('you');
  const g = splitGroups.find(x=>x.id===gId) || splitGroups[0];

  const submit = () => {
    haptic('success');
    onSubmit({ groupId:g.id, name: name||'New expense', amount: parseFloat(amount)||0, payer });
  };
  return (
    <Sheet
      title="Add expense"
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-primary grad btn-full" onClick={submit}>
            Save expense <ArrowR/>
          </button>
        </>
      }
    >
      <div className="fld">
        <div className="fld-lbl">Amount</div>
        <input className="fld-amt-input" type="text" value={'$'+amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))}/>
      </div>
      <div className="fld">
        <div className="fld-lbl">What for?</div>
        <input className="fld-input" placeholder="e.g. Wine dinner" value={name} onChange={e=>setName(e.target.value)}/>
      </div>
      <div className="fld">
        <div className="fld-lbl">Group</div>
        <div className="pill-row">
          {splitGroups.map(x => (
            <button key={x.id} className={`pill ${x.id===gId?'on':''}`} onClick={()=>setGId(x.id)}>{x.emoji} {x.name}</button>
          ))}
        </div>
      </div>
      <div className="fld">
        <div className="fld-lbl">Paid by</div>
        <div className="pill-row">
          {g.members.map(m => (
            <button key={m} className={`pill ${m===payer?'on':''}`} onClick={()=>setPayer(m)}>{personOf(m).name}</button>
          ))}
        </div>
      </div>
      <div className="fld">
        <div className="fld-lbl">Split</div>
        <div style={{background:'var(--fw-bg)',borderRadius:11,padding:'10px 14px'}}>
          <div className="split-rows">
            {g.members.map(m => {
              const share = (parseFloat(amount)||0) / g.members.length;
              return (
                <div key={m} className={`split-row ${m==='you'?'you':''}`}>
                  <Avatar who={m} size={26}/>
                  <span className="nm">{personOf(m).name}{m==='you' && <span style={{color:'var(--fw-ink-3)',fontSize:11,marginLeft:5}}>(me)</span>}</span>
                  <span className="v">${share.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/* ── Settle picker (choose who to settle with) ── */
function SettlePickerSheet({ onClose, onPick, haptic }) {
  const opts = [];
  GROUPS.filter(g=>g.mode==='split').forEach(g => {
    g.settlements.forEach(s => {
      if (s.from === 'you' || s.to === 'you') opts.push({ ...s, group:g });
    });
  });
  return (
    <Sheet title="Settle up" onClose={onClose}>
      <div style={{fontSize:12,color:'var(--fw-ink-2)',marginBottom:12,lineHeight:1.5}}>
        Pick a balance to settle. One on-chain transfer, ~$0.00025 in fees.
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {opts.map((s,i)=>{
          const owesMe = s.to === 'you';
          const other = owesMe ? s.from : s.to;
          return (
            <div key={i} className="grp" style={{padding:12}} onClick={()=>{ haptic('tap'); onPick(s); }}>
              <Avatar who={other} size={38}/>
              <div className="info">
                <div className="nm">{owesMe ? `${personOf(other).name} owes you` : `You owe ${personOf(other).name}`}</div>
                <div className="mt">{s.group.emoji} {s.group.name}</div>
              </div>
              <div className="right-col">
                <div className={`bal ${owesMe?'pos':'neg'}`}>{owesMe?'+':'−'}${s.amt.toFixed(2)}</div>
                <div className="bal-lbl">{owesMe?'Request':'Pay'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

/* ── Settle preview (before fingerprint sign) ── */
function SettleSheet({ settlement, onClose, onSign, haptic }) {
  const s = settlement;
  const owesMe = s.to === 'you';
  const other = owesMe ? s.from : s.to;
  return (
    <Sheet
      title={owesMe ? 'Request payment' : 'Settle up'}
      onClose={onClose}
      foot={
        <button className="btn btn-primary grad btn-full" onClick={()=>{ haptic('tap'); onSign(); }}>
          {owesMe ? 'Send request' : 'Sign & pay'} <ArrowR/>
        </button>
      }
    >
      <div className="settle-card">
        <Avatar who="you" size={42}/>
        <div className="from-to" style={{flex:1,justifyContent:'center',gap:14}}>
          <div className="arrow">
            <svg width="22" height="14" viewBox="0 0 22 14" fill="none"><path d="M1 7h20M15 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
        <Avatar who={other} size={42}/>
      </div>
      <div className="settle-amt">${s.amt.toFixed(2)}</div>
      <div className="settle-meta"><span>To</span><b>{personOf(other).name}</b></div>
      <div className="settle-meta"><span>Group</span><b>{s.group.emoji} {s.group.name}</b></div>
      <div className="settle-meta"><span>Token</span><b>USDC · Solana</b></div>
      <div className="settle-meta"><span>Network fee</span><b>~$0.00025</b></div>
      <div className="settle-meta"><span>Settlement</span><b>&lt; 1 second</b></div>

      <div style={{marginTop:14,padding:'12px 14px',borderRadius:11,background:'rgba(78,201,138,0.06)',border:'1px solid rgba(78,201,138,0.2)',fontSize:11,color:'var(--fw-ink-2)',lineHeight:1.5}}>
        <b style={{color:'var(--fw-emerald)'}}>Side button sign</b><br/>
        After "Sign & pay", press the fingerprint reader on the right edge to authorize.
      </div>
    </Sheet>
  );
}

/* ── Vote sheet (Fund mode) ── */
function VoteSheet({ proposal, choice, onClose, onSign, haptic }) {
  const p = proposal;
  return (
    <Sheet
      title={choice === 'yes' ? 'Approve proposal' : 'Reject proposal'}
      onClose={onClose}
      foot={
        <button className="btn btn-primary grad btn-full" onClick={()=>{ haptic('tap'); onSign(); }}>
          Sign vote <ArrowR/>
        </button>
      }
    >
      <div className="settle-card">
        <div style={{flex:1}}>
          <div style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--fw-ink-3)',marginBottom:4}}>Proposal</div>
          <div style={{fontFamily:'var(--serif)',fontSize:18,letterSpacing:'-0.3px'}}>{p.title}</div>
          <div style={{fontSize:11,color:'var(--fw-ink-2)',marginTop:2}}>{p.memo}</div>
        </div>
        <div style={{fontFamily:'var(--serif)',fontSize:22,letterSpacing:'-0.4px'}}>${p.amt}</div>
      </div>
      <div className="settle-meta"><span>Your vote</span><b style={{color: choice==='yes' ? 'var(--fw-emerald)' : 'var(--fw-red)'}}>{choice==='yes'?'Approve':'Reject'}</b></div>
      <div className="settle-meta"><span>Current tally</span><b>{p.yes} approve · {p.no} reject</b></div>
      <div className="settle-meta"><span>Threshold</span><b>3 of {p.total} required</b></div>
      <div className="settle-meta"><span>Network fee</span><b>~$0.00025</b></div>

      <div style={{marginTop:14,padding:'12px 14px',borderRadius:11,background:'rgba(78,201,138,0.06)',border:'1px solid rgba(78,201,138,0.2)',fontSize:11,color:'var(--fw-ink-2)',lineHeight:1.5}}>
        Votes are signed on-chain. Press the fingerprint reader to sign.
      </div>
    </Sheet>
  );
}

/* ── Telegram share ── */
function TelegramSheet({ group, onClose, haptic }) {
  const link = group ? `t.me/fundwise_bot?group=${group.id}` : 't.me/fundwise_bot';
  const [copied, setCopied] = useStateS(false);
  return (
    <Sheet title="Open in Telegram" onClose={onClose}>
      <div className="tg-hero">
        <div className="tg-ico">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="#fff" fillOpacity="0.15"/></svg>
        </div>
        <div>
          <div className="tg-t">FundWise · Mini-app</div>
          <div className="tg-d">{group ? `Share ${group.name}` : 'Split anywhere · in any chat'}</div>
        </div>
      </div>
      <div style={{fontSize:13,color:'var(--fw-ink-2)',lineHeight:1.6,marginBottom:14}}>
        Open the FundWise bot inside any Telegram chat to add expenses, vote on proposals, and settle balances — without leaving the conversation.
      </div>
      <div className="fld-lbl">Invite link</div>
      <div className="invite-link">
        <span className="url">{link}</span>
        <span className="copy-chip" onClick={()=>{ haptic('tap'); setCopied(true); setTimeout(()=>setCopied(false),1400); }}>{copied?'Copied ✓':'Copy'}</span>
      </div>
      <button className="btn btn-tg btn-full" onClick={()=>{ haptic('tap'); window.open('https://t.me/','_blank'); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" fill="#fff" fillOpacity="0.2"/></svg>
        Open in Telegram
      </button>
      <button className="btn btn-ghost btn-full" style={{marginTop:8}} onClick={()=>{ haptic('tap'); setCopied(true); setTimeout(()=>setCopied(false),1400); }}>
        Share via other apps
      </button>
    </Sheet>
  );
}

/* ── Invite (share group link) ── */
function InviteSheet({ group, onClose, onTelegram, haptic }) {
  const link = `fundwise.app/join/${group ? group.id : 'g7xK2mN'}`;
  const [copied, setCopied] = useStateS(false);
  return (
    <Sheet title={`Invite to ${group ? group.name : 'group'}`} onClose={onClose}>
      <div style={{fontSize:13,color:'var(--fw-ink-2)',lineHeight:1.6,marginBottom:14}}>
        Share this link. Anyone with a Solana wallet can join in 2 taps.
      </div>
      <div className="fld-lbl">Invite link</div>
      <div className="invite-link">
        <span className="url">{link}</span>
        <span className="copy-chip" onClick={()=>{ haptic('tap'); setCopied(true); setTimeout(()=>setCopied(false),1400); }}>{copied?'Copied ✓':'Copy'}</span>
      </div>
      <div className="qa-row" style={{padding:'10px 0 0'}}>
        <div className="qa" onClick={()=>{ haptic('tap'); onTelegram(); }}>
          <div className="qa-ico" style={{background:'rgba(34,158,217,0.12)',color:'var(--fw-tg)'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></div>
          <div className="qa-lbl">Telegram</div>
        </div>
        <div className="qa" onClick={()=>haptic('tap')}>
          <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></div>
          <div className="qa-lbl">QR</div>
        </div>
        <div className="qa" onClick={()=>haptic('tap')}>
          <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 8l9 6 9-6M3 8v10a2 2 0 002 2h14a2 2 0 002-2V8M3 8l9-4 9 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></div>
          <div className="qa-lbl">SMS</div>
        </div>
        <div className="qa" onClick={()=>haptic('tap')}>
          <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 6l-4-4-4 4M12 2v13M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
          <div className="qa-lbl">More</div>
        </div>
      </div>
    </Sheet>
  );
}

/* ── Deposit (fund vault) ── */
function DepositSheet({ group, onClose, onSign, haptic }) {
  const g = group || GROUPS.find(x=>x.mode==='fund');
  const [amount, setAmount] = useStateS('100');
  return (
    <Sheet
      title={`Deposit · ${g.name}`}
      onClose={onClose}
      foot={
        <button className="btn btn-primary grad btn-full" onClick={()=>{ haptic('tap'); onSign(parseFloat(amount)||0); }}>
          Sign & deposit <ArrowR/>
        </button>
      }
    >
      <div className="fld">
        <div className="fld-lbl">Amount</div>
        <input className="fld-amt-input" type="text" value={'$'+amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))}/>
      </div>
      <div className="pill-row" style={{marginBottom:14}}>
        {['25','50','100','250'].map(v=>(
          <button key={v} className={`pill ${amount===v?'on fund':''}`} onClick={()=>setAmount(v)}>${v}</button>
        ))}
      </div>
      <div className="settle-meta"><span>From</span><b>Your wallet · $248.30</b></div>
      <div className="settle-meta"><span>To</span><b>{g.emoji} {g.name} vault</b></div>
      <div className="settle-meta"><span>Token</span><b>USDC · Solana</b></div>
      <div className="settle-meta"><span>Network fee</span><b>~$0.00025</b></div>
    </Sheet>
  );
}

/* ── Propose (Fund mode new proposal) ── */
function ProposeSheet({ group, onClose, onSubmit, haptic }) {
  const [title, setTitle] = useStateS('');
  const [memo, setMemo] = useStateS('');
  const [amount, setAmount] = useStateS('200');
  return (
    <Sheet
      title="New proposal"
      onClose={onClose}
      foot={
        <button className="btn btn-primary grad btn-full" onClick={()=>{ haptic('success'); onSubmit({title:title||'Untitled', memo, amount:parseFloat(amount)||0}); }}>
          Open vote <ArrowR/>
        </button>
      }
    >
      <div className="fld">
        <div className="fld-lbl">Amount to spend</div>
        <input className="fld-amt-input" type="text" value={'$'+amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9.]/g,''))}/>
      </div>
      <div className="fld">
        <div className="fld-lbl">Title</div>
        <input className="fld-input" placeholder="e.g. Gift card order" value={title} onChange={e=>setTitle(e.target.value)}/>
      </div>
      <div className="fld">
        <div className="fld-lbl">Memo (optional)</div>
        <input className="fld-input" placeholder="Amazon · $450" value={memo} onChange={e=>setMemo(e.target.value)}/>
      </div>
      <div style={{background:'var(--fw-bg)',borderRadius:11,padding:'12px 14px',fontSize:11,color:'var(--fw-ink-2)',lineHeight:1.6}}>
        Needs <b style={{color:'var(--fw-ink)'}}>3 of {group.total || group.members.length} approvals</b> before the vault can execute the payout.
      </div>
    </Sheet>
  );
}

/* ── Create group ── */
function CreateGroupSheet({ onClose, onCreate, haptic }) {
  const [step, setStep] = useStateS(0);
  const [mode, setMode] = useStateS(null);
  const [name, setName] = useStateS('');
  const [token, setToken] = useStateS('USDC');
  const N = 3;
  const back = () => step>0 ? setStep(step-1) : onClose();
  const next = () => {
    if (step === N-1) {
      haptic('success');
      onCreate({mode, name, token});
    } else {
      haptic('tap');
      setStep(step+1);
    }
  };
  const canNext = (step===0 && mode) || (step===1 && name.trim()) || (step===2);

  return (
    <div className="sheet-ov" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()} style={{maxHeight:'92%'}}>
        <div className="sheet-handle"></div>
        <div className="sheet-head">
          <button className="sheet-close" onClick={back}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="sheet-title">New group</div>
          <button className="sheet-close" onClick={onClose}><CloseIcon size={12}/></button>
        </div>

        <div style={{display:'flex',gap:5,marginBottom:18}}>
          {Array.from({length:N}).map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background: i<=step?'var(--fw-emerald)':'var(--fw-bg)'}}></div>
          ))}
        </div>

        <div className="sheet-body">
          {step===0 && (
            <>
              <div style={{fontFamily:'var(--serif)',fontSize:22,letterSpacing:'-0.4px',marginBottom:6}}>Pick a mode</div>
              <div style={{fontSize:12,color:'var(--fw-ink-2)',marginBottom:16,lineHeight:1.5}}>Can't change later.</div>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div style={{padding:16,borderRadius:14,background: mode==='split'?'rgba(78,201,138,0.08)':'var(--fw-bg)',border:`2px solid ${mode==='split'?'var(--fw-emerald)':'transparent'}`,cursor:'pointer'}} onClick={()=>setMode('split')}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span className="mode-tag split">Split</span>
                    <span style={{fontFamily:'var(--serif)',fontSize:18,letterSpacing:'-0.3px'}}>Split mode</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--fw-ink-2)',lineHeight:1.5}}>Log expenses as they happen. We minimize transfers and settle in one click when you're ready.</div>
                </div>
                <div style={{padding:16,borderRadius:14,background: mode==='fund'?'var(--fw-purple-soft)':'var(--fw-bg)',border:`2px solid ${mode==='fund'?'var(--fw-purple)':'transparent'}`,cursor:'pointer'}} onClick={()=>setMode('fund')}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <span className="mode-tag fund">Fund</span>
                    <span style={{fontFamily:'var(--serif)',fontSize:18,letterSpacing:'-0.3px'}}>Fund mode</span>
                  </div>
                  <div style={{fontSize:12,color:'var(--fw-ink-2)',lineHeight:1.5}}>Pool stablecoins upfront. Spend through proposals with threshold voting. Vault locks until goal.</div>
                </div>
              </div>
            </>
          )}
          {step===1 && (
            <>
              <div style={{fontFamily:'var(--serif)',fontSize:22,letterSpacing:'-0.4px',marginBottom:6}}>Name your group</div>
              <div style={{fontSize:12,color:'var(--fw-ink-2)',marginBottom:16,lineHeight:1.5}}>Something your friends will recognise.</div>
              <div className="fld">
                <div className="fld-lbl">Group name</div>
                <input className="fld-input" placeholder="e.g. Lisbon Trip" value={name} onChange={e=>setName(e.target.value)} autoFocus/>
              </div>
            </>
          )}
          {step===2 && (
            <>
              <div style={{fontFamily:'var(--serif)',fontSize:22,letterSpacing:'-0.4px',marginBottom:6}}>Pick a stablecoin</div>
              <div style={{fontSize:12,color:'var(--fw-ink-2)',marginBottom:16,lineHeight:1.5}}>All expenses and settlements use this token.</div>
              <div className="pill-row" style={{marginBottom:16}}>
                {['USDC','USDT','PYUSD'].map(t=>(
                  <button key={t} className={`pill ${token===t?'on':''}`} onClick={()=>setToken(t)}>{t}</button>
                ))}
              </div>
              <div style={{background:'var(--fw-bg)',borderRadius:11,padding:'12px 14px'}}>
                <div className="settle-meta"><span>Mode</span><b style={{color: mode==='split'?'var(--fw-emerald)':'var(--fw-purple)'}}>{mode==='split'?'Split':'Fund'}</b></div>
                <div className="settle-meta"><span>Name</span><b>{name||'—'}</b></div>
                <div className="settle-meta"><span>Token</span><b>{token}</b></div>
              </div>
            </>
          )}
        </div>

        <div className="sheet-foot">
          <button className="btn btn-primary grad btn-full" onClick={next} style={{opacity:canNext?1:0.4,pointerEvents:canNext?'auto':'none'}}>
            {step === N-1 ? 'Create group' : 'Continue'} <ArrowR/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Profile / settings ── */
function ProfileSheet({ onClose, haptic }) {
  return (
    <Sheet title="Profile" onClose={onClose}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}>
        <div className="ava-btn" style={{width:56,height:56,fontSize:22}}>{ME.initial}</div>
        <div>
          <div style={{fontFamily:'var(--serif)',fontSize:22,letterSpacing:'-0.3px'}}>{ME.name}</div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--fw-ink-2)',marginTop:2}}>{ME.addr}</div>
        </div>
      </div>
      {[
        { i:'🛡️', t:'Security', d:'Seed Vault · biometrics' },
        { i:'🔔', t:'Notifications', d:'Vote, settle, deposit' },
        { i:'💱', t:'Default token', d:'USDC' },
        { i:'🌐', t:'Network', d:'Solana mainnet' },
        { i:'📡', t:'Connected dApps', d:'2 active' },
        { i:'❓', t:'Help & support', d:'Docs · Discord' },
      ].map((row,i)=>(
        <div key={i} className="exp-row" onClick={()=>haptic('tap')} style={{cursor:'pointer'}}>
          <div className="exp-ico">{row.i}</div>
          <div className="exp-main"><div className="exp-name">{row.t}</div><div className="exp-who">{row.d}</div></div>
          <ChevronR/>
        </div>
      ))}
    </Sheet>
  );
}

Object.assign(window, {
  Sheet, FabMenuSheet, AddExpenseSheet, SettlePickerSheet, SettleSheet,
  VoteSheet, TelegramSheet, InviteSheet, DepositSheet, ProposeSheet, CreateGroupSheet, ProfileSheet,
});
