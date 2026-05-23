/* App — router + state */

const { useState, useEffect, useCallback, useRef, useMemo } = React;

const STEPS = [
  { id:'boot',    label:'Boot',         group:'Onboarding' },
  { id:'welcome', label:'Welcome',      group:'Onboarding' },
  { id:'auth',    label:'Authenticate', group:'Onboarding' },
  { id:'success', label:'Connected',    group:'Onboarding' },
  { id:'instr',   label:'Quick tour',   group:'Onboarding' },
  { id:'dash',    label:'Home',         group:'App' },
  { id:'group-split', label:'Group · Split',  group:'App' },
  { id:'group-fund',  label:'Group · Fund',   group:'App' },
  { id:'activity', label:'Activity tab', group:'App' },
  { id:'wallet',   label:'Wallet tab',   group:'App' },
];

function App() {
  // Routing
  const [stepIdx, setStepIdx] = useState(0);
  const stepId = STEPS[stepIdx].id;

  // Theme
  const [theme, setTheme] = useState('light'); // 'light' | 'dark'

  // Group context
  const [groupId, setGroupId] = useState(null);
  const group = useMemo(()=> GROUPS.find(g => g.id === groupId) || null, [groupId]);

  // Local mutable state for group proposals (so voting updates UI)
  const [groupOverrides, setGroupOverrides] = useState({});
  const effectiveGroup = useMemo(()=>{
    if (!group) return null;
    const o = groupOverrides[group.id];
    if (!o) return group;
    return { ...group, ...o };
  }, [group, groupOverrides]);

  // Sheets
  const [sheet, setSheet] = useState(null); // {kind, ctx}
  const closeSheet = () => setSheet(null);

  // Sign action (uses side fingerprint)
  // { purpose, successVariant, returnScreen, returnGroupId, apply }
  const signRef = useRef(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanPct, setScanPct] = useState(0);

  // Success variant (for ScrSuccess)
  const [successVariant, setSuccessVariant] = useState('connect');

  // Haptic ripples
  const [haptics, setHaptics] = useState([]);
  const haptic = useCallback((kind='tap')=>{
    const id = Math.random().toString(36).slice(2,8);
    setHaptics(h=>[...h, {id, kind}]);
    setTimeout(()=>setHaptics(h=>h.filter(x=>x.id!==id)), 500);
  }, []);

  // Auto-advance from boot
  useEffect(()=>{
    if (stepId === 'boot') {
      const t = setTimeout(()=>setStepIdx(STEPS.findIndex(s=>s.id==='welcome')), 2500);
      return ()=>clearTimeout(t);
    }
  }, [stepId]);

  const goTo = (id) => {
    const i = STEPS.findIndex(s=>s.id===id);
    if (i>=0) setStepIdx(i);
  };

  /* ── Fingerprint scan handler ── */
  // signing is active when:
  //  - stepId === 'auth' (onboarding connect)
  //  - signRef.current != null (transaction sign)
  const isSigningTx = !!signRef.current;
  const promptFp = !scanning && (stepId === 'auth' || isSigningTx);

  const triggerScan = () => {
    if (!promptFp && !scanning) {
      haptic('tap');
      return;
    }
    if (scanning) return;
    setScanning(true);
    setScanPct(0);
    haptic('tap');
    let p = 0;
    const tick = () => {
      p += 25;
      setScanPct(p);
      if (p >= 100) {
        haptic('success');
        setTimeout(()=>{
          setScanning(false);
          setScanPct(0);
          finishScan();
        }, 220);
      } else {
        setTimeout(tick, 240);
      }
    };
    setTimeout(tick, 240);
  };

  const finishScan = () => {
    if (signRef.current) {
      const { successVariant: sv, returnScreen, returnGroupId, apply } = signRef.current;
      signRef.current = null;
      // Show success
      setSuccessVariant(sv || 'settled');
      goTo('success-tx'); // intermediate variant — we re-use ScrSuccess but with sv
      // We use a side-channel for success variant; trigger return after animation.
      setTimeout(()=>{
        if (apply) apply();
        if (returnGroupId) setGroupId(returnGroupId);
        if (returnScreen) goTo(returnScreen);
      }, 2300);
    } else {
      // Onboarding connect path
      setSuccessVariant('connect');
      goTo('success');
    }
  };

  // 'success-tx' isn't in STEPS — fall back to 'success' index when transitioning.
  // Simpler: re-use 'success' for both. ScrSuccess receives `variant` prop based on successVariant.
  const renderSuccess = stepId === 'success';

  /* ── Sign-tx helper ── */
  const signTx = ({ purpose, successVariant: sv, returnScreen, returnGroupId, apply }) => {
    signRef.current = { purpose, successVariant: sv, returnScreen, returnGroupId, apply };
    setSheet(null);
    goTo('auth');
  };

  /* ── Navigation: open group ── */
  const openGroup = (id) => {
    const g = GROUPS.find(x=>x.id===id);
    if (!g) return;
    setGroupId(id);
    goTo(g.mode === 'split' ? 'group-split' : 'group-fund');
  };

  /* ── FAB menu dispatch ── */
  const handleFab = (id) => {
    if (id === 'menu') return setSheet({kind:'fab-menu'});
    if (id === 'add-expense') return setSheet({kind:'add-expense'});
    if (id === 'settle-pick') return setSheet({kind:'settle-picker'});
    if (id === 'deposit') return setSheet({kind:'deposit', ctx:{ group: GROUPS.find(g=>g.mode==='fund') }});
    if (id === 'create-group') return setSheet({kind:'create-group'});
  };

  /* ── Tab nav ── */
  const handleTab = (id) => {
    if (id === 'home') goTo('dash');
    else if (id === 'activity') goTo('activity');
    else if (id === 'groups') goTo('groups');
    else if (id === 'wallet') goTo('wallet');
  };

  /* ── Step list (caption) ── */
  // We split caption steps differently than internal STEPS — group by section
  const captionGroups = [
    { name:'Onboarding', steps: ['boot','welcome','auth','success','instr'] },
    { name:'App',        steps: ['dash','group-split','group-fund','activity','wallet'] },
  ];

  const onSideTap = () => {
    if (stepId === 'auth' || isSigningTx) triggerScan();
    else haptic('tap');
  };

  /* ── purpose for auth screen ── */
  const authPurpose = signRef.current?.purpose || 'connect';

  /* ── Apply: settle ── */
  const applySettle = (s) => {
    const gid = s.group.id;
    const prev = groupOverrides[gid] || {};
    // Remove this settlement from the list
    const newSettlements = s.group.settlements.filter(x => !(x.from===s.from && x.to===s.to && x.amt===s.amt));
    setGroupOverrides({ ...groupOverrides, [gid]: { ...prev, settlements:newSettlements } });
  };

  /* ── Apply: vote ── */
  const applyVote = (gid, propId, choice) => {
    const g = GROUPS.find(x=>x.id===gid);
    if (!g) return;
    const prev = groupOverrides[gid] || {};
    const props = (prev.proposals || g.proposals).map(p => {
      if (p.id !== propId) return p;
      const nx = { ...p, myVote: choice };
      if (p.myVote == null) {
        if (choice === 'yes') nx.yes = p.yes + 1;
        else nx.no = p.no + 1;
      }
      if (nx.yes >= 3 && nx.status === 'pending') nx.status = 'approved';
      return nx;
    });
    setGroupOverrides({ ...groupOverrides, [gid]: { ...prev, proposals: props } });
  };

  /* ── Sheet handlers ── */
  const sheetEl = (() => {
    if (!sheet) return null;
    const k = sheet.kind;
    if (k === 'fab-menu') {
      return <FabMenuSheet onClose={closeSheet} onPick={(id)=>{
        haptic('tap');
        setSheet(null);
        if (id === 'add-expense') return setSheet({kind:'add-expense'});
        if (id === 'settle-pick') return setSheet({kind:'settle-picker'});
        if (id === 'deposit')     return setSheet({kind:'deposit', ctx:{ group: GROUPS.find(g=>g.mode==='fund') }});
        if (id === 'create-group')return setSheet({kind:'create-group'});
      }}/>;
    }
    if (k === 'add-expense') {
      return <AddExpenseSheet
        onClose={closeSheet}
        defaultGroupId={groupId}
        haptic={haptic}
        onSubmit={(data)=>{
          haptic('success');
          setSheet(null);
          setSuccessVariant('expense-added');
          goTo('success');
        }}
      />;
    }
    if (k === 'settle-picker') {
      return <SettlePickerSheet
        onClose={closeSheet}
        haptic={haptic}
        onPick={(s)=> setSheet({kind:'settle', ctx:{s}})}
      />;
    }
    if (k === 'settle') {
      const s = sheet.ctx.s;
      return <SettleSheet settlement={s} onClose={closeSheet} haptic={haptic}
        onSign={()=>{
          signTx({
            purpose:'sign-settle',
            successVariant:'settled',
            returnScreen: group ? (group.mode==='split'?'group-split':'group-fund') : 'dash',
            returnGroupId: group?.id,
            apply: ()=> applySettle(s),
          });
        }}/>;
    }
    if (k === 'vote') {
      const { proposal, choice } = sheet.ctx;
      return <VoteSheet proposal={proposal} choice={choice} onClose={closeSheet} haptic={haptic}
        onSign={()=>{
          signTx({
            purpose:'sign-vote',
            successVariant:'voted',
            returnScreen:'group-fund',
            returnGroupId: group?.id,
            apply: ()=> applyVote(group.id, proposal.id, choice),
          });
        }}/>;
    }
    if (k === 'telegram') {
      return <TelegramSheet group={sheet.ctx?.group} onClose={closeSheet} haptic={haptic}/>;
    }
    if (k === 'invite') {
      return <InviteSheet group={sheet.ctx?.group} onClose={closeSheet} haptic={haptic}
        onTelegram={()=> setSheet({kind:'telegram', ctx:{group: sheet.ctx?.group}})}/>;
    }
    if (k === 'deposit') {
      return <DepositSheet group={sheet.ctx?.group} onClose={closeSheet} haptic={haptic}
        onSign={(amt)=>{
          signTx({
            purpose:'sign-settle',
            successVariant:'deposited',
            returnScreen: group ? 'group-fund' : 'dash',
            returnGroupId: group?.id,
            apply: ()=>{ /* no-op for prototype */ },
          });
        }}/>;
    }
    if (k === 'propose') {
      return <ProposeSheet group={effectiveGroup} onClose={closeSheet} haptic={haptic}
        onSubmit={(data)=>{
          setSheet(null);
          setSuccessVariant('expense-added'); // generic
          goTo('success');
        }}/>;
    }
    if (k === 'create-group') {
      return <CreateGroupSheet onClose={closeSheet} haptic={haptic}
        onCreate={(data)=>{
          setSheet(null);
          setSuccessVariant('group-created');
          goTo('success');
        }}/>;
    }
    if (k === 'profile') {
      return <ProfileSheet onClose={closeSheet} haptic={haptic}/>;
    }
    return null;
  })();

  /* ── Main screen render ── */
  const screenEl = (() => {
    if (stepId === 'boot')    return <ScrBoot key="boot"/>;
    if (stepId === 'welcome') return <ScrWelcome onNext={()=>{ haptic('tap'); goTo('instr'); }}/>;
    if (stepId === 'auth')    return <ScrAuth scanning={scanning} pct={scanPct} purpose={authPurpose}/>;
    if (stepId === 'success') return <ScrSuccess variant={successVariant} onNext={()=>{
      if (successVariant === 'connect') goTo('dash');
      else {
        const back = signRef.current?.returnScreen || 'dash';
        goTo(back);
      }
    }}/>;
    if (stepId === 'instr')   return <ScrInstructions onDone={()=>{ haptic('tap'); goTo('auth'); }} haptic={haptic}/>;
    if (stepId === 'dash')    return <ScrDashboard
      haptic={haptic}
      onOpenGroup={openGroup}
      onFab={handleFab}
      onTab={handleTab}
      onTelegram={()=>setSheet({kind:'telegram'})}
      onAlert={(kind)=>{
        if (kind==='vote') { setGroupId('priya'); goTo('group-fund'); }
        else if (kind==='settle') {
          const g = GROUPS.find(x=>x.id==='flat');
          setGroupId('flat');
          setSheet({kind:'settle', ctx:{s: { ...g.settlements[0], group:g }}});
        }
      }}
    />;
    if (stepId === 'group-split' && effectiveGroup && effectiveGroup.mode==='split') return <ScrGroupSplit
      group={effectiveGroup}
      haptic={haptic}
      onBack={()=>goTo('dash')}
      onAdd={()=>setSheet({kind:'add-expense'})}
      onSettle={()=>{
        // pick first settlement involving 'you'
        const s = effectiveGroup.settlements.find(x => x.from==='you' || x.to==='you');
        if (s) setSheet({kind:'settle', ctx:{s: {...s, group:effectiveGroup}}});
        else setSheet({kind:'settle-picker'});
      }}
      onInvite={()=>setSheet({kind:'invite', ctx:{group:effectiveGroup}})}
      onTelegram={()=>setSheet({kind:'telegram', ctx:{group:effectiveGroup}})}
    />;
    if (stepId === 'group-fund' && effectiveGroup && effectiveGroup.mode==='fund') return <ScrGroupFund
      group={effectiveGroup}
      haptic={haptic}
      onBack={()=>goTo('dash')}
      onPropose={()=>setSheet({kind:'propose', ctx:{group:effectiveGroup}})}
      onDeposit={()=>setSheet({kind:'deposit', ctx:{group:effectiveGroup}})}
      onInvite={()=>setSheet({kind:'invite', ctx:{group:effectiveGroup}})}
      onTelegram={()=>setSheet({kind:'telegram', ctx:{group:effectiveGroup}})}
      onVote={(p, choice)=>setSheet({kind:'vote', ctx:{proposal:p, choice}})}
    />;
    if (stepId === 'activity') return <ScrActivity haptic={haptic} onBack={()=>goTo('dash')} onTab={handleTab} onFab={handleFab}/>;
    if (stepId === 'groups')   return <ScrGroups haptic={haptic} onOpenGroup={openGroup} onBack={()=>goTo('dash')} onTab={handleTab} onFab={handleFab}/>;
    if (stepId === 'wallet')   return <ScrWallet haptic={haptic} onBack={()=>goTo('dash')} onTab={handleTab} onFab={handleFab} onTelegram={()=>setSheet({kind:'telegram'})}/>;
    // Fallback if we landed on a group screen without a valid group
    return <ScrDashboard haptic={haptic} onOpenGroup={openGroup} onFab={handleFab} onTab={handleTab} onTelegram={()=>setSheet({kind:'telegram'})}/>;
  })();

  /* ── Caption step click ── */
  const captionStepClick = (id) => {
    setScanning(false); setScanPct(0); signRef.current = null;
    // pre-seed groupId for group-* steps
    if (id === 'group-split') setGroupId('lisbon');
    if (id === 'group-fund')  setGroupId('priya');
    goTo(id);
  };

  /* ── Helper for caption "groups" step ── */
  // Map STEPS.id → caption section
  const captionItems = [
    { sec:'Onboarding' },
    { id:'boot',    n:'01', label:'Boot' },
    { id:'welcome', n:'02', label:'Welcome' },
    { id:'instr',   n:'03', label:'Quick tour' },
    { id:'auth',    n:'04', label:'Authenticate' },
    { id:'success', n:'05', label:'Connected' },
    { sec:'App' },
    { id:'dash',        n:'06', label:'Home' },
    { id:'group-split', n:'07', label:'Group · Split mode' },
    { id:'group-fund',  n:'08', label:'Group · Fund mode' },
    { id:'activity',    n:'09', label:'Activity' },
    { id:'wallet',      n:'10', label:'Wallet' },
  ];

  return (
    <div className="stage">
      <div className="caption">
        <div className="eyebrow">FundWise · Solana Seeker</div>
        <h1>Full app,<br/>end-to-<em>end.</em></h1>
        <p>Tap any step to scrub. On <b style={{color:'#dcf0e4'}}>Authenticate</b> or signing a transaction, tap the glowing fingerprint reader on the right edge.</p>
        <div className="step-list">
          {captionItems.map((it, i)=>{
            if (it.sec) return <div key={'sec'+i} className="step-h">{it.sec}</div>;
            const active = stepId === it.id;
            return (
              <div key={it.id} className={`step ${active?'active':''}`} onClick={()=>captionStepClick(it.id)}>
                <span className="n">{it.n}</span>
                <span>{it.label}</span>
              </div>
            );
          })}
        </div>
        <div className="note"><b>Haptic feedback</b> fires on every tap, scan and tx confirmation. Look for the green ripple over the screen.</div>
        <button
          className={`theme-toggle ${theme==='dark'?'on':''}`}
          onClick={()=>{ haptic('tap'); setTheme(t => t==='dark'?'light':'dark'); }}
        >
          <span className="knob"></span>
          {theme==='dark'?'Dark mode':'Light mode'}
        </button>
      </div>

      <Device promptFp={promptFp} scanning={scanning} onFingerTap={onSideTap}>
        <div className={`device-screen ${theme==='dark'?'dark':''}`}>
          {screenEl}
          {sheetEl}
          {haptics.map(h => (<div key={h.id} className={`haptic ${h.kind}`}></div>))}
        </div>
      </Device>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
