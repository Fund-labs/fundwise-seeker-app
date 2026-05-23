/* Onboarding screens: Boot, Welcome, Auth, Success, Instructions */

const { useState: useStateOB, useEffect: useEffectOB } = React;

function ScrBoot() {
  const [go, setGo] = useStateOB(false);
  useEffectOB(()=>{ const t=setTimeout(()=>setGo(true),80); return ()=>clearTimeout(t); },[]);
  return (
    <div className={`scr scr-boot ${go?'go':''}`}>
      <div className="stack-zone">
        <div className="slab slab-1"></div>
        <div className="slab slab-2"></div>
        <div className="slab slab-3"></div>
      </div>
      <div className="wm">Fund<em>w</em>ise</div>
      <div className="tag">Stack · split · settle</div>
      <div className="loadbar"></div>
      <div className="gesture-pill" data-dark="1"></div>
    </div>
  );
}

function ScrWelcome({ onNext }) {
  return (
    <div className="scr scr-welcome">
      <StatusBar />
      <div className="scr-pad">
        <div className="welcome-hero">
          <div className="wlogo"><StrataLogo size={56}/></div>
          <h2>Welcome to<br/>Fund<em>w</em>ise</h2>
          <p>Split expenses with friends, pool funds with intention — all on-chain.</p>
          <div className="welcome-halo">
            <div className="blur"></div>
            <div className="sparkle" style={{top:'18%',left:'22%',animationDelay:'0s'}}></div>
            <div className="sparkle" style={{top:'68%',left:'18%',animationDelay:'1.1s'}}></div>
            <div className="sparkle" style={{top:'24%',right:'22%',animationDelay:'2.0s'}}></div>
            <div className="sparkle" style={{top:'72%',right:'30%',animationDelay:'0.6s'}}></div>
            <div className="sparkle" style={{top:'50%',right:'10%',animationDelay:'1.7s'}}></div>
            <div className="ava-row">
              <div className="ava ava-0">A</div>
              <div className="ava ava-1">K</div>
              <div className="ava ava-2">M</div>
              <div className="ava ava-3">D</div>
            </div>
          </div>
        </div>
      </div>
      <div className="scr-foot">
        <button className="btn btn-primary grad btn-full" onClick={onNext}>
          Get started
          <ArrowR/>
        </button>
        <div className="terms">No email · No password · Your wallet is your identity</div>
      </div>
      <div className="gesture-pill"></div>
    </div>
  );
}

function ScrAuth({ scanning, pct, purpose }) {
  // purpose: 'connect' | 'sign-settle' | 'sign-vote'
  const headings = {
    connect:     { eyebrow:'Seed Vault · Authorize', title:'Place your finger on the sensor', body:'Press the fingerprint reader on the right edge of your Seeker. No screen tap needed.' },
    'sign-settle': { eyebrow:'Seed Vault · Sign transaction', title:'Authorize payment', body:'Hold your finger on the side sensor to sign this on-chain settlement.' },
    'sign-vote': { eyebrow:'Seed Vault · Sign vote', title:'Sign your vote', body:'Your vote is recorded on-chain. Hold your finger on the side sensor.' },
  };
  const h = headings[purpose] || headings.connect;
  return (
    <div className="scr scr-auth">
      <StatusBar />
      <div className="scr-pad">
        <div className="auth-body">
          <div className="auth-eyebrow">{h.eyebrow}</div>
          <h3>{scanning ? 'Hold still…' : h.title}</h3>
          <p>{scanning ? 'Verifying with the secure element.' : h.body}</p>
          <div className={`fp-visual ${scanning?'scanning':''}`}>
            <div className="fp-rings"><span></span><span></span><span></span></div>
            <div className="fp-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M24 8c-7 0-13 5.5-13 13v8c0 1.5.5 3 1 4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 24c0-4.5 3.5-8 8-8s8 3.5 8 8v6c0 3-1 5-2.5 7" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 24c0-2 2-4 4-4s4 2 4 4v8c0 2-1 4-2 5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M24 26v8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="fp-scan-line"></div>
            </div>
          </div>
          <div className="fp-progress" style={{'--pct': pct+'%'}}></div>
          <div className="fp-cta">
            <span className="pulse-dot"></span>
            {scanning ? 'Scanning…' : 'Hold finger on the side sensor →'}
          </div>
        </div>
      </div>
      <div className="scr-foot">
        <div className="wallet-strip" style={{alignSelf:'center'}}>
          <span className="dot"></span>
          Solana mainnet · {ME.addr}
        </div>
      </div>
      <div className="gesture-pill"></div>
    </div>
  );
}

function ScrSuccess({ onNext, variant='connect' }) {
  // variant: 'connect' | 'settled' | 'voted' | 'deposited' | 'expense-added'
  const v = {
    connect:        { t:'Wallet connected',     s:'Signature verified by Seed Vault. You\u2019re ready to fund and split.', show:'pubkey' },
    settled:        { t:'Settlement sent',      s:'Transaction confirmed on Solana mainnet.', show:'sig' },
    voted:          { t:'Vote recorded',        s:'Your signed vote is on-chain.', show:'sig' },
    deposited:      { t:'Deposit confirmed',    s:'Funds added to the group vault.', show:'sig' },
    'expense-added':{ t:'Expense added',        s:'Split calculated. Everyone is notified.', show:null },
    'group-created':{ t:'Group created',        s:'Share the invite link to add members.', show:null },
  }[variant] || { t:'Done', s:'', show:null };

  useEffectOB(()=>{ const t=setTimeout(onNext, 2300); return ()=>clearTimeout(t); }, []);

  const sig = '5KqJrLAU7…3Mw8x';

  return (
    <div className="scr scr-success">
      <StatusBar dark />
      <div className="scr-pad" style={{alignItems:'center',justifyContent:'center'}}>
        <div className="success-mark">
          <svg viewBox="0 0 60 60" fill="none">
            <path className="check-path" d="M14 30l11 11L46 20" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="success-body">
          <h3>{v.t}</h3>
          <p>{v.s}</p>
          {v.show === 'pubkey' && <div className="pubkey-pill"><span className="dot"></span>{ME.addr}</div>}
          {v.show === 'sig' && (
            <>
              <div className="pubkey-pill"><span className="dot"></span>Confirmed · 0.4s · ~$0.00025</div>
              <div className="tx-sig">tx · {sig}…aH2pK7vNqRcXz8M3</div>
            </>
          )}
        </div>
      </div>
      <div className="gesture-pill" data-dark="1"></div>
    </div>
  );
}

function ScrInstructions({ onDone, haptic }) {
  const [i, setI] = useStateOB(0);
  const cards = [
    {
      key:'split',
      title:<>Log it once,<br/><em>we split the math.</em></>,
      body:'Snap a receipt, pick who paid, and FundWise calculates everyone\u2019s share in USDC.',
      illus:(
        <div className="illus-split">
          <div className="ticket">
            <div className="row1"><div className="amt">$184.20</div><div className="tag">Split</div></div>
            <div className="ln"><span>Wine dinner</span><b>4 people</b></div>
            <div className="ln"><span>Each pays</span><b>$46.05</b></div>
            <div className="ln"><span>Paid by</span><b>You</b></div>
          </div>
          <div className="people">
            <div className="ava" style={{background:'#0A4D2C'}}>K</div>
            <div className="ava" style={{background:'#0D6B3A'}}>A</div>
            <div className="ava" style={{background:'#1A9151'}}>M</div>
            <div className="ava" style={{background:'#4EC98A',color:'#0D1F14'}}>D</div>
          </div>
        </div>
      ),
    },
    {
      key:'pool',
      title:<>Pool funds,<br/><em>vote to spend.</em></>,
      body:'Create a treasury for trips, gifts, or rent. Spending needs a multisig vote — no single point of failure.',
      illus:(
        <div className="illus-pool">
          <div className="coin coin-1">$</div>
          <div className="coin coin-2">$</div>
          <div className="coin coin-3">$</div>
          <div className="jar"><div className="fill"></div><div className="label">$600<small>· 80% of goal</small></div></div>
        </div>
      ),
    },
    {
      key:'chain',
      title:<>Settle in seconds,<br/><em>final on Solana.</em></>,
      body:'One tap to settle. Sub-second confirmation, fractions of a cent in fees, no chargebacks.',
      illus:(
        <div className="illus-chain">
          <div className="receipt">
            <div className="receipt-top">
              <div className="check-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="receipt-meta">
                <div className="r-status">Settled · on-chain</div>
                <div className="r-where">Lisbon Trip</div>
              </div>
            </div>
            <div className="r-amt">$30.00</div>
            <div className="r-flow">
              <div className="ava" style={{background:'#0A4D2C'}}>K</div>
              <div className="nm">Kiran</div>
              <div className="arrow">
                <svg width="18" height="10" viewBox="0 0 22 14" fill="none"><path d="M1 7h20M15 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="nm" style={{textAlign:'right'}}>You</div>
              <div className="ava" style={{background:'#1A9151'}}>S</div>
            </div>
            <div className="r-stats">
              <span>Confirmed in <b>0.4s</b></span>
              <span>Fee <b>$0.00025</b></span>
            </div>
            <div className="r-tx">tx · 5KqJrLAU7…aH2pK7vNqRcXz8M3</div>
          </div>
          <div className="mini-blocks">
            <div className="mini-block"></div>
            <div className="mini-line"></div>
            <div className="mini-block"></div>
            <div className="mini-line"></div>
            <div className="mini-block lit"></div>
            <div className="mini-line"></div>
            <div className="mini-block"></div>
            <div className="mini-line"></div>
            <div className="mini-block"></div>
          </div>
        </div>
      ),
    },
  ];
  const card = cards[i];
  const next = () => { haptic('tap'); if (i < cards.length-1) setI(i+1); else onDone(); };
  const back = () => { haptic('tap'); setI(Math.max(0, i-1)); };
  return (
    <div className="scr scr-instr">
      <StatusBar />
      <div className="instr-pad">
        <div className="instr-top">
          <div className="step-dots">{cards.map((_,n)=>(<div key={n} className={`dot ${n===i?'on':''}`}></div>))}</div>
          <button className="skip-btn" onClick={onDone}>Skip</button>
        </div>
        <div className="instr-card" key={card.key}>
          <div className="instr-illus">{card.illus}</div>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </div>
      </div>
      <div className="scr-foot row">
        {i > 0 ? <button className="btn btn-ghost" style={{flex:1}} onClick={back}>Back</button> : <div style={{flex:1}}></div>}
        <button className="btn btn-primary grad" style={{flex:2}} onClick={next}>
          {i < cards.length-1 ? 'Next' : 'Enter FundWise'}
          <ArrowR/>
        </button>
      </div>
      <div className="gesture-pill"></div>
    </div>
  );
}

Object.assign(window, { ScrBoot, ScrWelcome, ScrAuth, ScrSuccess, ScrInstructions });
