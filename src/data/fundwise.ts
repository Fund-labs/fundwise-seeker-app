export type PersonId = "you" | "kiran" | "asha" | "dev" | "mia" | "raj" | "priya";

export type Person = {
  color: string;
  initial: string;
  name: string;
};

export type GroupMode = "split" | "fund";
export type Stablecoin = "USDC" | "USDT" | "PYUSD";

export type Expense = {
  date: string;
  day: string;
  icon: string;
  id: string;
  myShare: number;
  name: string;
  payer: PersonId;
  total: number;
};

export type SplitGroup = {
  balances: { v: number; who: PersonId }[];
  currency: Stablecoin;
  emoji: string;
  expenses: Expense[];
  id: string;
  members: PersonId[];
  mode: "split";
  myBalance: number;
  name: string;
  settlements: { amt: number; from: PersonId; to: PersonId }[];
};

export type Proposal = {
  amt: number;
  id: string;
  memo: string;
  myVote: "yes" | "no" | null;
  no: number;
  status: "pending" | "approved" | "executed";
  title: string;
  total: number;
  yes: number;
};

export type FundGroup = {
  currency: Stablecoin;
  emoji: string;
  goal: number;
  id: string;
  members: PersonId[];
  mode: "fund";
  myContrib: number;
  name: string;
  proposals: Proposal[];
  total: number;
};

export type FundWiseGroup = SplitGroup | FundGroup;

export type ActivityItem = {
  icon: string;
  id: string;
  kind: "pos" | "neg" | "neutral";
  sub: string;
  title: string;
  value: string;
};

export const PEOPLE: Record<PersonId, Person> = {
  you: { color: "#16170F", initial: "S", name: "You" },
  kiran: { color: "#2DB870", initial: "K", name: "Kiran" },
  asha: { color: "#E8983B", initial: "A", name: "Asha" },
  dev: { color: "#4671D8", initial: "D", name: "Dev" },
  mia: { color: "#A05AE0", initial: "M", name: "Mia" },
  raj: { color: "#B07D2A", initial: "R", name: "Raj" },
  priya: { color: "#E0594F", initial: "P", name: "Priya" },
};

export const ME = {
  initial: "S",
  name: "You",
};

export const GROUPS: FundWiseGroup[] = [
  {
    balances: [
      { v: 84.5, who: "you" },
      { v: -30, who: "kiran" },
      { v: -24.5, who: "asha" },
      { v: -30, who: "dev" },
    ],
    currency: "USDC",
    emoji: "🏖️",
    expenses: [
      { date: "Today", day: "Today", icon: "🍷", id: "e1", myShare: -30, name: "Wine dinner", payer: "asha", total: 120 },
      { date: "Today", day: "Today", icon: "🚕", id: "e2", myShare: 36, name: "Airport taxi", payer: "you", total: 48 },
      { date: "Yesterday", day: "Yesterday", icon: "🏨", id: "e3", myShare: -80, name: "Hotel (2 nights)", payer: "kiran", total: 320 },
      { date: "Yesterday", day: "Yesterday", icon: "🥗", id: "e4", myShare: 54, name: "Lunch · LX Market", payer: "you", total: 72 },
      { date: "Apr 22", day: "Apr 22", icon: "🎨", id: "e5", myShare: -20, name: "Museum tickets", payer: "dev", total: 80 },
    ],
    id: "lisbon",
    members: ["you", "kiran", "asha", "dev"],
    mode: "split",
    myBalance: 84.5,
    name: "Lisbon Trip",
    settlements: [
      { amt: 30, from: "kiran", to: "you" },
      { amt: 30, from: "dev", to: "you" },
      { amt: 24.5, from: "asha", to: "kiran" },
    ],
  },
  {
    currency: "USDC",
    emoji: "🎁",
    goal: 750,
    id: "priya",
    members: ["you", "asha", "kiran", "dev", "mia", "raj"],
    mode: "fund",
    myContrib: 100,
    name: "Priya's Gift",
    proposals: [
      { amt: 450, id: "p1", memo: "Amazon · $450", myVote: null, no: 0, status: "pending", title: "Gift card order", total: 6, yes: 3 },
      { amt: 80, id: "p2", memo: "FTD bouquet", myVote: "yes", no: 0, status: "approved", title: "Delivery flowers", total: 6, yes: 5 },
      { amt: 120, id: "p3", memo: "Deposit at Nobu", myVote: "yes", no: 0, status: "executed", title: "Dinner reservation", total: 6, yes: 6 },
    ],
    total: 600,
  },
  {
    balances: [
      { v: -45, who: "you" },
      { v: 30, who: "kiran" },
      { v: 15, who: "asha" },
    ],
    currency: "USDC",
    emoji: "🏠",
    expenses: [
      { date: "Apr 21", day: "This week", icon: "📡", id: "e6", myShare: -20, name: "Internet bill", payer: "kiran", total: 60 },
      { date: "Apr 19", day: "This week", icon: "🛒", id: "e7", myShare: 60, name: "Groceries", payer: "you", total: 90 },
      { date: "Apr 18", day: "This week", icon: "🧹", id: "e8", myShare: -15, name: "Cleaning", payer: "asha", total: 45 },
    ],
    id: "flat",
    members: ["you", "kiran", "asha"],
    mode: "split",
    myBalance: -45,
    name: "Flatmates",
    settlements: [
      { amt: 30, from: "you", to: "kiran" },
      { amt: 15, from: "you", to: "asha" },
    ],
  },
];

export const ACTIVITY: ActivityItem[] = [
  { icon: "🍷", id: "a1", kind: "pos", sub: "You paid · 4 ways · Today", title: "Wine dinner · Lisbon", value: "+$138" },
  { icon: "🚕", id: "a2", kind: "neg", sub: "Asha paid · 3 ways · Today", title: "Airport taxi", value: "-$16" },
  { icon: "✓", id: "a3", kind: "pos", sub: "USDC · 0.4s · 2 hrs ago", title: "Kiran settled $30", value: "+$30" },
  { icon: "🏦", id: "a4", kind: "neutral", sub: "$100 USDC · yesterday", title: "Deposited to Priya's Gift", value: "-$100" },
  { icon: "🗳️", id: "a5", kind: "neutral", sub: "Priya's Gift · 2 days ago", title: "Voted yes · Gift card", value: "" },
];

export function personOf(id: PersonId) {
  return PEOPLE[id];
}

export function formatUsd(value: number, signed = true) {
  const sign = !signed || value === 0 ? "" : value > 0 ? "+" : "-";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}
