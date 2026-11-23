// rules.js — the duel rules: turns, ember, damage, healing, wards,
// the advantage bonus, and the rival AI that picks its own cards.
import { suitAdvantage } from './deck.js';

export const MAX_LIFE = 30;
export const MAX_HAND = 7;
export const MAX_EMBER = 10;

export function newFighter(name, isRival) {
  return { name, isRival, life: MAX_LIFE, ward: 0, ember: 3, emberMax: 3, deck: [], hand: [], played: [], stance: null };
}

export function drawCards(fighter, count) {
  for (let i = 0; i < count; i++) {
    if (fighter.hand.length >= MAX_HAND) break;
    if (fighter.deck.length === 0) break;
    fighter.hand.push(fighter.deck.pop());
  }
}

// Damage first eats the ward, then life. Returns the life actually lost.
export function dealDamage(fighter, amount) {
  let left = amount;
  if (fighter.ward > 0) {
    const blocked = Math.min(fighter.ward, left);
    fighter.ward -= blocked;
    left -= blocked;
  }
  fighter.life = Math.max(0, fighter.life - left);
  return left;
}

export function healFighter(fighter, amount) {
  fighter.life = Math.min(MAX_LIFE, fighter.life + amount);
}

// Resolve one card played by `attacker` against `defender`.
// Returns a short log line describing what happened.
export function playCard(state, attacker, defender, card) {
  const handIndex = attacker.hand.indexOf(card);
  if (handIndex === -1) return null;
  if (attacker.ember < card.cost) return null;
  attacker.hand.splice(handIndex, 1);
  attacker.ember -= card.cost;
  attacker.played.push(card);
  attacker.stance = card.suit;
  if (card.kind === 'strike') {
    const bonus = suitAdvantage(card.suit, defender.stance);
    const total = card.power + bonus;
    const lost = dealDamage(defender, total);
    const adv = bonus > 0 ? ` (+${bonus} advantage!)` : '';
    return `${attacker.name} plays ${card.name}: ${total} damage${adv} — ${defender.name} loses ${lost} life.`;
  }
  if (card.kind === 'mend') {
    const amount = card.cost === 1 ? 4 : 6;
    if (card.name === 'Moss Mend') healFighter(attacker, 5);
    else healFighter(attacker, amount);
    return `${attacker.name} plays ${card.name}: restores life.`;
  }
  if (card.kind === 'ward') {
    const amount = card.name === 'Rock Wall' ? 8 : 6;
    attacker.ward += amount;
    return `${attacker.name} plays ${card.name}: gains a ${amount} ward.`;
  }
  if (card.kind === 'surge') {
    drawCards(attacker, 2);
    return `${attacker.name} plays ${card.name}: draws 2 cards.`;
  }
  return null;
}

export function startTurn(fighter) {
  fighter.emberMax = Math.min(MAX_EMBER, fighter.emberMax + 1);
  fighter.ember = fighter.emberMax;
  fighter.played = [];
  drawCards(fighter, 1);
}

// The rival AI: play its best affordable strike (preferring advantage),
// then a ward when hurt, a mend when low, and a surge when its hand is thin.
export function rivalTakeTurn(state) {
  const rival = state.rival;
  const lines = [];
  // The rival plays with the ember it was dealt at the last round start
  // (startTurn is called for both fighters together in main.js), so both
  // sides grow their ember in lockstep.
  const affordable = () => rival.hand.filter((c) => c.cost <= rival.ember);
  let guard = 0;
  while (guard++ < 3) {
    const options = affordable();
    if (options.length === 0) break;
    let pick = null;
    const strikes = options.filter((c) => c.kind === 'strike');
    const withAdv = strikes.filter((c) => suitAdvantage(c.suit, state.player.stance) > 0);
    const pool = withAdv.length > 0 ? withAdv : strikes;
    if (pool.length > 0 && (rival.life < 14 || Math.random() < 0.75)) {
      pick = pool.reduce((best, c) => (c.power + suitAdvantage(c.suit, state.player.stance) > best.power + suitAdvantage(best.suit, state.player.stance) ? c : best));
    } else {
      const mend = options.find((c) => c.kind === 'mend' && rival.life <= 16);
      const ward = options.find((c) => c.kind === 'ward' && state.player.played.some((p) => p.kind === 'strike'));
      const surge = options.find((c) => c.kind === 'surge' && rival.hand.length <= 3);
      pick = mend || ward || surge || (pool.length > 0 ? pool[0] : null);
    }
    if (!pick) break;
    const line = playCard(state, rival, state.player, pick);
    if (line) lines.push(line);
    if (state.player.life <= 0 || state.rival.life <= 0) break;
  }
  if (lines.length === 0) lines.push(`${rival.name} holds its cards and passes.`);
  return lines;
}

export function checkWinner(state) {
  if (state.rival.life <= 0 && state.player.life <= 0) return 'draw';
  if (state.rival.life <= 0) return 'player';
  if (state.player.life <= 0) return 'rival';
  return null;
}
