/* Group detail — Split mode */

function ScrGroupSplit({ group, haptic, onBack, onAdd, onSettle, onInvite, onTelegram }) {
  const g = group;
  // group expenses by day
  const byDay = {};
  g.expenses.forEach(e => { (byDay[e.day] = byDay[e.day] || []).push(e); });

  return (
    <div className="scr scr-dash">
      <StatusBar />
      <NavHeader
        onBack={onBack}
        title={g.name}
        right={
          <div className="icon-btn" onClick={()=>{ haptic('tap'); onInvite(); }} title="Invite">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 6h6M17 3v6M3 18c.5-3 3-5 6-5s5.5 2 6 5M9 11a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
        }
      />
      <div className="scroll-area">
        {/* Hero */}
        <div className="grp-hero">
          <div className="row">
            <div className="emoji-big">{g.emoji}</div>
            <div style={{textAlign:'right'}}>
              <div className="lbl">Your balance</div>
              <div className="amt">{g.myBalance >= 0 ? '+' : '−'}${Math.abs(g.myBalance).toFixed(2)}</div>
              <div className="sub">{g.myBalance >= 0 ? "You're owed" : 'You owe'} · {g.currency}</div>
            </div>
          </div>
          <div className="members-row">
            <AvatarStack ids={g.members} size={28} max={5}/>
            <span className="more">{g.members.length} members</span>
          </div>
        </div>

        {/* Balance chips */}
        <div className="bal-strip">
          {g.balances.map((b,i)=>(
            <div key={i} className="bal-chip">
              <div className="who">{personOf(b.who).name}</div>
              <div className={`v ${b.v>=0?'pos':'neg'}`}>{b.v>=0?'+':'−'}${Math.abs(b.v).toFixed(2)}</div>
            </div>
          ))}
        </div>

        {/* Telegram chip */}
        <div className="alerts" style={{paddingTop:14}}>
          <div className="alert tg" onClick={()=>{ haptic('tap'); onTelegram(); }}>
            <div className="a-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/></svg>
            </div>
            <div className="a-body">
              <div className="a-t">Share this group on Telegram</div>
              <div className="a-s">Open the mini-app in any chat to add expenses</div>
            </div>
            <ChevronR/>
          </div>
        </div>

        {/* Expenses */}
        {Object.entries(byDay).map(([day, items])=>(
          <React.Fragment key={day}>
            <div className="exp-day">{day}</div>
            <div className="exp-list">
              {items.map(e => (
                <div className="exp-row" key={e.id} onClick={()=>haptic('tap')}>
                  <div className="exp-ico">{e.icon}</div>
                  <div className="exp-main">
                    <div className="exp-name">{e.name}</div>
                    <div className="exp-who">{personOf(e.payer).name} paid · {g.members.length} ways</div>
                  </div>
                  <div className="exp-rt">
                    <div className="exp-total">${e.total.toFixed(2)}</div>
                    <div className={`exp-share ${e.myShare>=0?'pos':'neg'}`}>
                      {e.myShare>=0?`you lent +$${e.myShare.toFixed(2)}`:`you owe −$${Math.abs(e.myShare).toFixed(2)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        ))}
        <div style={{height:24}}></div>
      </div>

      {/* Sticky action bar */}
      <div className="act-bar">
        <button className="btn btn-ghost" style={{flex:1}} onClick={()=>{ haptic('tap'); onAdd(); }}>
          <PlusIcon size={14} color="currentColor"/> Add expense
        </button>
        <button className="btn btn-primary grad" style={{flex:1}} onClick={()=>{ haptic('tap'); onSettle(); }}>
          Settle up <ArrowR/>
        </button>
      </div>
      <div className="gesture-pill"></div>
    </div>
  );
}

Object.assign(window, { ScrGroupSplit });
