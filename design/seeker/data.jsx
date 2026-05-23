/* Sample data + people helpers */

const PEOPLE = {
  you:   { name:'You',   initial:'S', color:'#0A4D2C' },
  kiran: { name:'Kiran', initial:'K', color:'#0D6B3A' },
  asha:  { name:'Asha',  initial:'A', color:'#1A9151' },
  dev:   { name:'Dev',   initial:'D', color:'#4EC98A' },
  mia:   { name:'Mia',   initial:'M', color:'#2A4FA8' },
  raj:   { name:'Raj',   initial:'R', color:'#A07816' },
  priya: { name:'Priya', initial:'P', color:'#C73B3B' },
};
const personOf = (id) => PEOPLE[id] || { name:id, initial:(id||'?')[0].toUpperCase(), color:'#5A6B60' };

const GROUPS = [
  {
    id:'lisbon', name:'Lisbon Trip', emoji:'🏖️', mode:'split', currency:'USDC',
    members:['you','kiran','asha','dev'],
    myBalance:+84.50,
    expenses:[
      { id:'e1', name:'Wine dinner',      icon:'🍷', payer:'asha',  total:120, myShare:-30, date:'Today',     day:'Today' },
      { id:'e2', name:'Airport taxi',     icon:'🚕', payer:'you',   total:48,  myShare:+36, date:'Today',     day:'Today' },
      { id:'e3', name:'Hotel (2 nights)', icon:'🏨', payer:'kiran', total:320, myShare:-80, date:'Yesterday', day:'Yesterday' },
      { id:'e4', name:'Lunch · LX Market',icon:'🥗', payer:'you',   total:72,  myShare:+54, date:'Yesterday', day:'Yesterday' },
      { id:'e5', name:'Museum tickets',   icon:'🎨', payer:'dev',   total:80,  myShare:-20, date:'Apr 22',    day:'Apr 22' },
    ],
    balances:[
      { who:'you',   v:+84.50 },
      { who:'kiran', v:-30.00 },
      { who:'asha',  v:-24.50 },
      { who:'dev',   v:-30.00 },
    ],
    settlements:[
      { from:'kiran', to:'you',   amt:30.00 },
      { from:'dev',   to:'you',   amt:30.00 },
      { from:'asha',  to:'kiran', amt:24.50 },
    ],
  },
  {
    id:'priya', name:"Priya's Gift", emoji:'🎁', mode:'fund', currency:'USDC',
    members:['you','asha','kiran','dev','mia','raj'],
    total:600, goal:750, myContrib:100,
    proposals:[
      { id:'p1', title:'Gift card order',    memo:'Amazon · $450',     amt:450, status:'pending',  yes:3, no:0, total:6, myVote:null },
      { id:'p2', title:'Delivery flowers',   memo:'FTD bouquet',       amt:80,  status:'approved', yes:5, no:0, total:6, myVote:'yes' },
      { id:'p3', title:'Dinner reservation', memo:'Deposit at Nobu',   amt:120, status:'executed', yes:6, no:0, total:6, myVote:'yes' },
    ],
  },
  {
    id:'flat', name:'Flatmates', emoji:'🏠', mode:'split', currency:'USDC',
    members:['you','kiran','asha'],
    myBalance:-45,
    expenses:[
      { id:'e1', name:'Internet bill', icon:'📡', payer:'kiran', total:60, myShare:-20, date:'Apr 21', day:'This week' },
      { id:'e2', name:'Groceries',     icon:'🛒', payer:'you',   total:90, myShare:+60, date:'Apr 19', day:'This week' },
      { id:'e3', name:'Cleaning',      icon:'🧹', payer:'asha',  total:45, myShare:-15, date:'Apr 18', day:'This week' },
    ],
    balances:[
      { who:'you',   v:-45.00 },
      { who:'kiran', v:+30.00 },
      { who:'asha',  v:+15.00 },
    ],
    settlements:[
      { from:'you', to:'kiran', amt:30.00 },
      { from:'you', to:'asha',  amt:15.00 },
    ],
  },
];

const ACTIVITY = [
  { id:'a1', icon:'🍷', title:'Wine dinner · Lisbon',     sub:'You paid · 4 ways · Today',    v:'+$138', kind:'pos' },
  { id:'a2', icon:'🚕', title:'Airport taxi',             sub:'Asha paid · 3 ways · Today',   v:'−$16',  kind:'neg' },
  { id:'a3', icon:'✓',  title:'Kiran settled $30',        sub:'USDC · 0.4s · 2 hrs ago',      v:'+$30',  kind:'pos' },
  { id:'a4', icon:'🏦', title:"Deposited to Priya's Gift",sub:'$100 USDC · yesterday',        v:'−$100', kind:'neutral' },
  { id:'a5', icon:'🗳️', title:'Voted yes · Gift card',    sub:"Priya's Gift · 2 days ago",    v:'',      kind:'neutral' },
];

const ME = { name:'Sarthi', initial:'S', addr:'7xKp4cVnH2qFwMz…mN4q' };

const fmtUSD = (v) => {
  const sign = v < 0 ? '−' : (v > 0 ? '+' : '');
  return `${sign}$${Math.abs(v).toFixed(2)}`;
};
const fmtUSDNoSign = (v) => `$${Math.abs(v).toFixed(2)}`;

Object.assign(window, { PEOPLE, personOf, GROUPS, ACTIVITY, ME, fmtUSD, fmtUSDNoSign });
