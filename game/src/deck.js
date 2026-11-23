// deck.js — the card pool for Lantern Duel: four original suits, their
// advantage cycle, and the deck builder. No card here copies any existing game.
export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', color: '#ff7a3d', dark: '#c2410c', beats: 'leaf' },
  leaf: { name: 'Leaf', glyph: '◆', color: '#4ade80', dark: '#15803d', beats: 'stone' },
  stone: { name: 'Stone', glyph: '■', color: '#c084fc', dark: '#7e22ce', beats: 'tide' },
  tide: { name: 'Tide', glyph: '●', color: '#38bdf8', dark: '#0369a1', beats: 'flame' },
};
export const SUIT_ORDER = ['flame', 'leaf', 'stone', 'tide'];

// kind: strike deals damage, mend heals you, ward blocks the next hit,
// surge draws cards. Every card carries a readable cost and power.
export const CARD_DEFS = [
  { name: 'Ember Spark', suit: 'flame', cost: 1, power: 3, kind: 'strike', text: 'Deal 3 damage.' },
  { name: 'Wildfire', suit: 'flame', cost: 3, power: 7, kind: 'strike', text: 'Deal 7 damage.' },
  { name: 'Bonfire', suit: 'flame', cost: 2, power: 4, kind: 'strike', text: 'Deal 4 damage.' },
  { name: 'Cinder Fox', suit: 'flame', cost: 2, power: 5, kind: 'strike', text: 'Deal 5 damage.' },
  { name: 'Hearth Song', suit: 'flame', cost: 2, power: 0, kind: 'mend', text: 'Restore 6 life.' },
  { name: 'Ash Phoenix', suit: 'flame', cost: 4, power: 8, kind: 'strike', text: 'Deal 8 damage.' },
  { name: 'Vine Snare', suit: 'leaf', cost: 1, power: 2, kind: 'strike', text: 'Deal 2 damage.' },
  { name: 'Thorn Whip', suit: 'leaf', cost: 2, power: 5, kind: 'strike', text: 'Deal 5 damage.' },
  { name: 'Fern Shelter', suit: 'leaf', cost: 2, power: 0, kind: 'ward', text: 'Block 6 damage.' },
  { name: 'Seedling', suit: 'leaf', cost: 1, power: 0, kind: 'mend', text: 'Restore 4 life.' },
  { name: 'Oak Sentinel', suit: 'leaf', cost: 3, power: 6, kind: 'strike', text: 'Deal 6 damage.' },
  { name: 'Bloom Burst', suit: 'leaf', cost: 3, power: 0, kind: 'surge', text: 'Draw 2 cards.' },
  { name: 'Pebble Toss', suit: 'stone', cost: 1, power: 3, kind: 'strike', text: 'Deal 3 damage.' },
  { name: 'Granite Fist', suit: 'stone', cost: 3, power: 7, kind: 'strike', text: 'Deal 7 damage.' },
  { name: 'Rock Wall', suit: 'stone', cost: 2, power: 0, kind: 'ward', text: 'Block 8 damage.' },
  { name: 'Crystal Eye', suit: 'stone', cost: 2, power: 0, kind: 'surge', text: 'Draw 2 cards.' },
  { name: 'Boulder Roll', suit: 'stone', cost: 4, power: 9, kind: 'strike', text: 'Deal 9 damage.' },
  { name: 'Moss Mend', suit: 'stone', cost: 1, power: 0, kind: 'mend', text: 'Restore 5 life.' },
  { name: 'Rain Dart', suit: 'tide', cost: 1, power: 3, kind: 'strike', text: 'Deal 3 damage.' },
  { name: 'Wave Crash', suit: 'tide', cost: 3, power: 7, kind: 'strike', text: 'Deal 7 damage.' },
  { name: 'Mist Veil', suit: 'tide', cost: 2, power: 0, kind: 'ward', text: 'Block 6 damage.' },
  { name: 'Spring Water', suit: 'tide', cost: 2, power: 0, kind: 'mend', text: 'Restore 6 life.' },
  { name: 'Coral Guard', suit: 'tide', cost: 2, power: 4, kind: 'strike', text: 'Deal 4 damage.' },
  { name: 'Deep Current', suit: 'tide', cost: 4, power: 8, kind: 'strike', text: 'Deal 8 damage.' },
];

let nextId = 1;
export function makeCard(def) {
  return { id: nextId++, name: def.name, suit: def.suit, cost: def.cost, power: def.power, kind: def.kind, text: def.text };
}

export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    deck.push(makeCard(def));
    deck.push(makeCard(def));
  }
  return deck;
}

export function shuffleDeck(deck, rand) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Deterministic seeded random so screenshot setups are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function suitAdvantage(attackerSuit, defenderSuit) {
  if (!defenderSuit) return 0;
  return SUITS[attackerSuit].beats === defenderSuit ? 2 : 0;
}
