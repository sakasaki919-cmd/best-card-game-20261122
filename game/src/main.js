// main.js — game state, input and the render loop for Lantern Duel.
// Screens: title, play, win, lose. Query ?shot=title|play|win|loss stages
// a fixed scene (with ?seed=N) so screenshots are reproducible renders.
import { buildDeck, shuffleDeck, mulberry32, CARD_DEFS, makeCard } from './deck.js';
import { newFighter, drawCards, playCard, rivalTakeTurn, checkWinner, startTurn } from './rules.js';
import { render, playerHandRects, VIEW_W, VIEW_H } from './render.js';
import { makeAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const audio = makeAudio();
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}

function freshState() {
  const rand = mulberry32(seed + Date.now() % 97);
  const player = newFighter('You', false);
  const rival = newFighter('Brine', true);
  player.deck = shuffleDeck(buildDeck(), rand);
  rival.deck = shuffleDeck(buildDeck(), rand);
  drawCards(player, 5);
  drawCards(rival, 5);
  return {
    screen: 'title',
    phase: 'player',
    round: 1,
    score: 0,
    wins: 0,
    losses: 0,
    player,
    rival,
    log: ['The duel begins. Your turn — play a card!'],
    hoverCard: null,
    selectedCard: null,
    hoverEnd: false,
    sampleCards: [CARD_DEFS[1], CARD_DEFS[10], CARD_DEFS[14], CARD_DEFS[19]].map(makeCard),
  };
}

let state = freshState();

function announce(text) { statusEl.textContent = text; }

function finishDuel(winner) {
  if (winner === 'player') {
    state.wins += 1;
    state.score += 100 + state.player.life * 2;
    state.screen = 'win';
    audio.win();
    announce('You win the duel!');
  } else if (winner === 'rival') {
    state.losses += 1;
    state.screen = 'lose';
    audio.lose();
    announce('You lose the duel.');
  }
  state.log.push(winner === 'player' ? '🏆 You win the duel!' : '💔 Brine wins the duel.');
}

function tryPlayCard(card) {
  if (state.screen !== 'play' || state.phase !== 'player') return;
  if (card.cost > state.player.ember) {
    state.log.push(`Not enough ember for ${card.name} (${card.cost}).`);
    return;
  }
  const line = playCard(state, state.player, state.rival, card);
  if (!line) return;
  state.log.push(line);
  state.score += card.kind === 'strike' ? 5 : 3;
  if (card.kind === 'strike') audio.hit();
  else if (card.kind === 'mend') audio.heal();
  else if (card.kind === 'ward') audio.ward();
  else audio.playCard();
  const winner = checkWinner(state);
  if (winner) finishDuel(winner);
}

function endTurn() {
  if (state.screen !== 'play' || state.phase !== 'player') return;
  state.phase = 'rival';
  audio.turn();
  state.log.push('— Brine takes a turn —');
  setTimeout(() => {
    const lines = rivalTakeTurn(state);
    lines.forEach((l) => state.log.push(l));
    const winner = checkWinner(state);
    if (winner) { finishDuel(winner); return; }
    state.round += 1;
    state.phase = 'player';
    startTurn(state.player);
    startTurn(state.rival);
    state.log.push(`Round ${state.round}: your turn. Ember refilled to ${state.player.ember}.`);
    audio.turn();
  }, 650);
}

function startDuel() {
  const keep = { wins: state.wins, losses: state.losses, score: state.score };
  state = freshState();
  state.wins = keep.wins;
  state.losses = keep.losses;
  state.score = keep.score;
  state.screen = 'play';
  audio.click();
  announce('Duel started. Your turn.');
}

// Stage a fixed scene for screenshots: title / mid-game / win / loss.
function stageShot(kind) {
  if (kind === 'title') { state.screen = 'title'; return; }
  state.screen = 'play';
  const rand = mulberry32(seed);
  state.player.deck = shuffleDeck(buildDeck(), rand);
  state.rival.deck = shuffleDeck(buildDeck(), rand);
  state.player.hand = [];
  state.rival.hand = [];
  drawCards(state.player, 5);
  drawCards(state.rival, 5);
  state.player.ember = 4;
  state.player.emberMax = 4;
  state.rival.ember = 3;
  state.round = 3;
  state.score = 145;
  if (kind === 'play') {
    state.player.life = 22;
    state.rival.life = 17;
    state.player.ward = 6;
    state.player.played = [state.player.hand[0]];
    state.player.hand.splice(0, 1);
    state.rival.played = [state.rival.hand[0]];
    state.rival.hand.splice(0, 1);
    state.player.stance = 'flame';
    state.rival.stance = 'tide';
    state.log = [
      'You play Bonfire: 4 damage — Brine loses 4 life.',
      'Brine plays Wave Crash: 7 damage (+2 advantage!) — You lose 7 life.',
      'You play Fern Shelter: gains a 6 ward.',
      'Round 3: your turn. Ember refilled to 4.',
    ];
    return;
  }
  if (kind === 'win') {
    state.player.life = 18;
    state.rival.life = 0;
    state.wins = 1;
    state.score = 236;
    state.screen = 'win';
    return;
  }
  if (kind === 'loss') {
    state.player.life = 0;
    state.rival.life = 12;
    state.losses = 1;
    state.score = 145;
    state.screen = 'lose';
  }
}

function toGameCoords(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (VIEW_W / rect.width),
    y: (event.clientY - rect.top) * (VIEW_H / rect.height),
  };
}

canvas.addEventListener('mousemove', (event) => {
  const p = toGameCoords(event);
  state.hoverEnd = p.x >= 1080 && p.x <= 1244 && p.y >= VIEW_H - 262 && p.y <= VIEW_H - 210;
  const rects = playerHandRects(state);
  const hit = rects.find((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  state.hoverCard = hit ? hit.card.id : null;
});

canvas.addEventListener('click', (event) => {
  const p = toGameCoords(event);
  if (state.screen === 'title') {
    if (p.x >= 520 && p.x <= 760 && p.y >= 660 && p.y <= 718) startDuel();
    return;
  }
  if (state.screen === 'win' || state.screen === 'lose') {
    if (p.x >= 500 && p.x <= 780 && p.y >= 480 && p.y <= 538) startDuel();
    return;
  }
  if (state.hoverEnd || (p.x >= 1080 && p.x <= 1244 && p.y >= VIEW_H - 262 && p.y <= VIEW_H - 210)) {
    endTurn();
    return;
  }
  const rects = playerHandRects(state);
  const hit = rects.find((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit) tryPlayCard(hit.card);
});

window.addEventListener('keydown', (event) => {
  if (state.screen === 'title' && (event.key === 'Enter' || event.key === ' ')) { startDuel(); return; }
  if ((state.screen === 'win' || state.screen === 'lose') && (event.key === 'r' || event.key === 'R' || event.key === 'Enter')) { startDuel(); return; }
  if (event.key === 'm' || event.key === 'M') { audio.toggleMute(); return; }
  if (state.screen !== 'play') return;
  if (event.key === 'Enter') { endTurn(); return; }
  const n = Number(event.key);
  if (n >= 1 && n <= state.player.hand.length) tryPlayCard(state.player.hand[n - 1]);
});

function loop() {
  render(ctx, state);
  requestAnimationFrame(loop);
}

resize();
window.addEventListener('resize', resize);
if (shot) stageShot(shot);
loop();
