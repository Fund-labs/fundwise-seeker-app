/* Dashboard screen */

function ScrDashboard({ haptic, onOpenGroup, onFab, onTab, onTelegram, onAlert }) {
  const tap = () => haptic('tap');

  return (
    <div className="scr scr-dash">
      <StatusBar />
      <div className="scroll-area">
        <div className="dash-top">
          <div>
            <div className="greet">Good morning</div>
            <div className="name">{ME.name} 👋</div>
          </div>
          <div className="right-cluster">
            <div className="icon-btn" onClick={tap}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11 21h2M6 8a6 6 0 0112 0v4l2 4H4l2-4V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="badge"></div>
            </div>
            <div className="ava-btn" onClick={tap}>{ME.initial}</div>
          </div>
        </div>

        <div className="dash-balance">
          <div className="lbl">Net balance · all groups</div>
          <div className="amt">+$39.50</div>
          <div className="sub">USDC owed to you across 2 groups</div>
          <div className="strip">
            <div className="stat"><div className="k">You're owed</div><div className="v">$114.50</div></div>
            <div className="stat"><div className="k">You owe</div><div className="v">$75.00</div></div>
            <div className="stat"><div className="k">In vaults</div><div className="v">$250</div></div>
          </div>
        </div>

        <div className="qa-row">
          <div className="qa" onClick={()=>{ haptic('tap'); onFab('add-expense'); }}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M4 6h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
            <div className="qa-lbl">Split</div>
          </div>
          <div className="qa" onClick={()=>{ haptic('tap'); onFab('deposit'); }}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="qa-lbl">Deposit</div>
          </div>
          <div className="qa" onClick={()=>{ haptic('tap'); onFab('settle-pick'); }}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="qa-lbl">Settle</div>
          </div>
          <div className="qa" onClick={()=>{ haptic('tap'); onFab('create-group'); }}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
            <div className="qa-lbl">New group</div>
          </div>
        </div>

        <div className="alerts">
          <div className="alert vote" onClick={()=>{ haptic('tap'); onAlert && onAlert('vote'); }}>
            <div className="a-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></div>
            <div className="a-body">
              <div className="a-t">Vote needed · Priya's Gift</div>
              <div className="a-s">Amazon gift card $450 · 3 of 4 yes</div>
            </div>
            <ChevronR/>
          </div>
          <div className="alert settle" onClick={()=>{ haptic('tap'); onAlert && onAlert('settle'); }}>
            <div className="a-ico"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12h18M14 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="a-body">
              <div className="a-t">You owe Kiran $30</div>
              <div className="a-s">Flatmates · settle in one tap</div>
            </div>
            <ChevronR/>
          </div>
          <div className="alert tg" onClick={()=>{ haptic('tap'); onTelegram && onTelegram(); }}>
            <div className="a-ico">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/></svg>
            </div>
            <div className="a-body">
              <div className="a-t">Split with anyone, in Telegram</div>
              <div className="a-s">Open the FundWise mini-app inside any chat</div>
            </div>
            <ChevronR/>
          </div>
        </div>

        <div className="sec-h"><h4>Your groups</h4><span className="see" onClick={()=>{ haptic('tap'); onTab && onTab('groups'); }}>See all</span></div>
        <div className="groups">
          {GROUPS.map(g => (
            <GroupCard key={g.id} g={g} onClick={()=>{ haptic('tap'); onOpenGroup(g.id); }}/>
          ))}
        </div>

        <div className="sec-h"><h4>Recent activity</h4><span className="see" onClick={()=>{ haptic('tap'); onTab && onTab('activity'); }}>View all</span></div>
        <div className="activity">
          {ACTIVITY.slice(0,4).map(a => (
            <div key={a.id} className="act">
              <div className="a-i">{a.icon}</div>
              <div className="a-m"><div className="a-t">{a.title}</div><div className="a-d">{a.sub}</div></div>
              <div className={`a-v ${a.kind}`}>{a.v}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav active="home" onNav={(id)=>{ haptic('tap'); onTab && onTab(id); }} onFab={()=>{ haptic('tap'); onFab('menu'); }}/>
      <div className="gesture-pill"></div>
    </div>
  );
}

function GroupCard({ g, onClick }) {
  const isSplit = g.mode === 'split';
  let bal, balLbl, balCls;
  if (isSplit) {
    if (g.myBalance >= 0) { bal = `+$${g.myBalance.toFixed(2)}`; balLbl = "You're owed"; balCls='pos'; }
    else                  { bal = `−$${Math.abs(g.myBalance).toFixed(2)}`; balLbl = 'You owe'; balCls='neg'; }
  } else {
    bal = `$${g.myContrib}`; balLbl='Contributed'; balCls='';
  }
  const sub = isSplit
    ? `${g.members.length} people · ${g.expenses.length} expenses`
    : `${g.members.length} people · ${Math.round((g.total/g.goal)*100)}% of goal`;
  return (
    <div className="grp" onClick={onClick}>
      <div className="emoji">{g.emoji}</div>
      <div className="info">
        <div className="nm">{g.name}</div>
        <div className="mt"><span className={`mode-tag ${isSplit?'split':'fund'}`}>{isSplit?'Split':'Fund'}</span> {sub}</div>
      </div>
      <div className="right-col">
        <div className={`bal ${balCls}`}>{bal}</div>
        <div className="bal-lbl">{balLbl}</div>
      </div>
    </div>
  );
}

/* Activity tab (full list) */
function ScrActivity({ haptic, onBack, onTab, onFab }) {
  return (
    <div className="scr scr-dash">
      <StatusBar />
      <NavHeader title="Activity" onBack={onBack}/>
      <div className="scroll-area">
        <div className="tabs">
          <div className="tab on">All</div>
          <div className="tab">Expenses</div>
          <div className="tab">Settlements</div>
          <div className="tab">Votes</div>
        </div>
        <div className="activity" style={{padding:'8px 22px 0'}}>
          {ACTIVITY.map(a => (
            <div key={a.id} className="act">
              <div className="a-i">{a.icon}</div>
              <div className="a-m"><div className="a-t">{a.title}</div><div className="a-d">{a.sub}</div></div>
              <div className={`a-v ${a.kind}`}>{a.v}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="activity" onNav={(id)=>{ haptic('tap'); onTab && onTab(id); }} onFab={()=>{ haptic('tap'); onFab('menu'); }}/>
      <div className="gesture-pill"></div>
    </div>
  );
}

/* Groups tab — full list */
function ScrGroups({ haptic, onOpenGroup, onBack, onTab, onFab }) {
  return (
    <div className="scr scr-dash">
      <StatusBar />
      <NavHeader title="Groups" onBack={onBack} right={
        <div className="icon-btn" onClick={()=>{ haptic('tap'); onFab('create-group'); }}>
          <PlusIcon size={16}/>
        </div>
      }/>
      <div className="scroll-area">
        <div className="tabs">
          <div className="tab on">All</div>
          <div className="tab">Split</div>
          <div className="tab">Fund</div>
        </div>
        <div className="groups" style={{paddingTop:8}}>
          {GROUPS.map(g => (
            <GroupCard key={g.id} g={g} onClick={()=>{ haptic('tap'); onOpenGroup(g.id); }}/>
          ))}
        </div>
      </div>
      <BottomNav active="groups" onNav={(id)=>{ haptic('tap'); onTab && onTab(id); }} onFab={()=>{ haptic('tap'); onFab('menu'); }}/>
      <div className="gesture-pill"></div>
    </div>
  );
}

/* Wallet tab */
function ScrWallet({ haptic, onBack, onTab, onFab, onTelegram }) {
  return (
    <div className="scr scr-dash">
      <StatusBar />
      <NavHeader title="Wallet" onBack={onBack}/>
      <div className="scroll-area">
        <div className="dash-balance" style={{margin:'0 22px'}}>
          <div className="lbl">Wallet balance</div>
          <div className="amt">$248.30</div>
          <div className="sub">USDC · Solana mainnet</div>
          <div className="strip">
            <div className="stat"><div className="k">Receive</div><div className="v">+$182</div></div>
            <div className="stat"><div className="k">Sent</div><div className="v">−$94</div></div>
            <div className="stat"><div className="k">Fees · 30d</div><div className="v">$0.01</div></div>
          </div>
        </div>

        <div className="qa-row">
          <div className="qa" onClick={()=>haptic('tap')}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="qa-lbl">Receive</div>
          </div>
          <div className="qa" onClick={()=>haptic('tap')}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
            <div className="qa-lbl">Send</div>
          </div>
          <div className="qa" onClick={()=>haptic('tap')}>
            <div className="qa-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></div>
            <div className="qa-lbl">QR</div>
          </div>
          <div className="qa" onClick={()=>{ haptic('tap'); onTelegram && onTelegram(); }}>
            <div className="qa-ico" style={{background:'rgba(34,158,217,0.12)',color:'var(--fw-tg)'}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 4L2 11l6 2 2 6 4-4 5 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></div>
            <div className="qa-lbl">Telegram</div>
          </div>
        </div>

        <div className="sec-h"><h4>Recent transactions</h4></div>
        <div className="activity">
          {ACTIVITY.map(a => (
            <div key={a.id} className="act">
              <div className="a-i">{a.icon}</div>
              <div className="a-m"><div className="a-t">{a.title}</div><div className="a-d">{a.sub}</div></div>
              <div className={`a-v ${a.kind}`}>{a.v}</div>
            </div>
          ))}
        </div>

        <div className="sec-h"><h4>Address</h4></div>
        <div style={{padding:'0 22px'}}>
          <div className="invite-link" style={{marginBottom:0}}>
            <span className="url">{ME.addr}</span>
            <span className="copy-chip">Copy</span>
          </div>
        </div>
      </div>
      <BottomNav active="wallet" onNav={(id)=>{ haptic('tap'); onTab && onTab(id); }} onFab={()=>{ haptic('tap'); onFab('menu'); }}/>
      <div className="gesture-pill"></div>
    </div>
  );
}

Object.assign(window, { ScrDashboard, ScrActivity, ScrGroups, ScrWallet, GroupCard });
