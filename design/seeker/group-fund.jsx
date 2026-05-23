/* Group detail — Fund mode */

const { useState: useStateGF } = React;

function ScrGroupFund({ group, haptic, onBack, onPropose, onDeposit, onVote, onInvite, onTelegram }) {
  const g = group;
  const pct = Math.min(100, Math.round((g.total / g.goal) * 100));
  const [showContrib, setShowContrib] = useStateGF(false);

  return (
    <div className="scr scr-dash">
      <StatusBar />
      <NavHeader
        onBack={onBack}
        title={g.name}
        right={
          <div className="icon-btn" onClick={()=>{ haptic('tap'); onInvite(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 6h6M17 3v6M3 18c.5-3 3-5 6-5s5.5 2 6 5M9 11a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        }
      />
      <div className="scroll-area">
        {/* Treasury hero — pool liquidity + my contribution */}
        <div className="grp-hero fund">
          <div className="row">
            <div className="emoji-big">{g.emoji}</div>
            <div style={{textAlign:'right'}}>
              <div className="lbl">Pool liquidity</div>
              <div className="amt">${g.total}</div>
              <div className="sub">{g.currency} · {pct}% of ${g.goal} goal</div>
            </div>
          </div>
          <div className="progress"><div className="fill" style={{width: pct+'%'}}></div></div>
          <div className="goal-row"><span>Goal · ${g.goal}</span><span>You contributed · ${g.myContrib}</span></div>
          <div className="members-row">
            <AvatarStack ids={g.members} size={28} max={5}/>
            <span className="more">{g.members.length} members · 3-of-5 multisig</span>
          </div>
        </div>

        {/* Your contribution card — at top */}
        <div style={{padding:'14px 22px 0'}}>
          <div style={{background:'var(--fw-surface)',border:'1px solid var(--fw-border)',borderRadius:14,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
            <Avatar who="you" size={38}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,color:'var(--fw-ink-2)'}}>Your contribution</div>
              <div style={{fontFamily:'var(--serif)',fontSize:22,letterSpacing:'-0.4px',lineHeight:1.1,marginTop:1}}>${g.myContrib}</div>
              <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--fw-ink-3)',letterSpacing:'.06em',marginTop:3}}>
                {Math.round((g.myContrib / g.total) * 100)}% of pool
              </div>
            </div>
            <button className="btn btn-sm btn-primary grad" onClick={()=>{ haptic('tap'); onDeposit(); }}>
              <PlusIcon size={12} color="#fff"/> Top up
            </button>
          </div>
        </div>

        {/* Telegram share — small feature at top */}
        <div className="alerts" style={{paddingTop:10}}>
          <div className="alert tg" onClick={()=>{ haptic('tap'); onTelegram(); }}>
            <div className="a-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/></svg></div>
            <div className="a-body">
              <div className="a-t">Share to Telegram</div>
              <div className="a-s">Members vote inside the chat</div>
            </div>
            <ChevronR/>
          </div>
        </div>

        {/* Proposals */}
        <div className="sec-h" style={{paddingTop:18}}>
          <h4>Proposals</h4>
          <span className="see" onClick={()=>{ haptic('tap'); onPropose(); }}>+ New</span>
        </div>
        <div className="prop-list">
          {g.proposals.map(p => (
            <ProposalCard key={p.id} p={p} onVote={(choice)=>{ haptic('tap'); onVote(p, choice); }} haptic={haptic}/>
          ))}
        </div>

        {/* Collapsible members section — count only by default */}
        <div className="sec-h">
          <h4>Members</h4>
          <span
            className="see"
            onClick={()=>{ haptic('tap'); setShowContrib(v=>!v); }}
            style={{display:'flex',alignItems:'center',gap:4}}
          >
            {showContrib ? 'Hide' : 'Show all'}
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" style={{transform: showContrib?'rotate(180deg)':'none',transition:'transform .2s'}}>
              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <div style={{padding:'0 22px'}}>
          {!showContrib ? (
            <div
              style={{
                background:'var(--fw-surface)',border:'1px solid var(--fw-border)',borderRadius:14,
                padding:'12px 14px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',
              }}
              onClick={()=>{ haptic('tap'); setShowContrib(true); }}
            >
              <AvatarStack ids={g.members} size={30} max={5}/>
              <div style={{flex:1,fontSize:12,color:'var(--fw-ink-2)'}}>
                {g.members.length} members in this pool
              </div>
              <ChevronR/>
            </div>
          ) : (
            <div style={{background:'var(--fw-surface)',border:'1px solid var(--fw-border)',borderRadius:14,overflow:'hidden'}}>
              {g.members.map((id, i) => {
                const p = personOf(id);
                const me = id === 'you';
                return (
                  <div
                    key={id}
                    style={{
                      display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                      borderBottom: i < g.members.length-1 ? '1px solid var(--fw-border)' : 'none',
                    }}
                  >
                    <Avatar who={id} size={32}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,letterSpacing:'-0.1px'}}>
                        {p.name}
                        {me && <span style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--fw-ink-3)',marginLeft:6}}>· me</span>}
                      </div>
                      <div style={{fontSize:11,color:'var(--fw-ink-3)',marginTop:1,fontFamily:'var(--mono)'}}>
                        Joined · signed
                      </div>
                    </div>
                    {me && (
                      <div style={{fontFamily:'var(--serif)',fontSize:14,letterSpacing:'-0.2px'}}>${g.myContrib}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{height:24}}></div>
      </div>

      <div className="act-bar">
        <button className="btn btn-primary grad btn-full" onClick={()=>{ haptic('tap'); onPropose(); }}>
          <PlusIcon size={14} color="#fff"/> New proposal
        </button>
      </div>
      <div className="gesture-pill"></div>
    </div>
  );
}

function ProposalCard({ p, onVote, haptic }) {
  const pctYes = Math.round((p.yes / p.total) * 100);
  return (
    <div className="prop">
      <div className="row">
        <div>
          <div className="title">{p.title}</div>
          <div className="memo">{p.memo}</div>
        </div>
        <span className={`prop-status ${p.status}`}>{p.status}</span>
      </div>
      <div className="amt">${p.amt}</div>
      <div className="prop-bar"><div className="fill" style={{width: pctYes+'%'}}></div></div>
      <div className="vote-row">
        <span>{p.yes}/{p.total} approved</span>
        {p.status==='pending' && <span style={{color:'var(--fw-warn)'}}>{p.total - p.yes - p.no} undecided</span>}
        {p.status==='executed' && <span>Tx 5KqJ…3Mw8x</span>}
      </div>
      {p.status === 'pending' && (
        <div className="vote-btns">
          <button className={`vote-btn no ${p.myVote==='no'?'voted-no':''}`} onClick={()=>onVote('no')}>Reject</button>
          <button className={`vote-btn yes ${p.myVote==='yes'?'voted-yes':''}`} onClick={()=>onVote('yes')}>Approve</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ScrGroupFund, ProposalCard });
