// render.js — all canvas drawing: the felt table, both hands, the played
// cards, life and ember meters, the log, and the title / win / loss screens.
import { SUITS } from './deck.js';
import { MAX_LIFE } from './rules.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
const CARD_W = 132;
const CARD_H = 186;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const suit = SUITS[card.suit];
  const affordable = opts.affordable !== false;
  ctx.save();
  if (opts.lift) { ctx.translate(0, -14); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; }
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = affordable ? '#fff8e7' : '#d8d2c4';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = suit.dark;
  ctx.stroke();
  // Suit banner across the top.
  roundRect(ctx, x + 5, y + 5, w - 10, 34, 8);
  ctx.fillStyle = suit.color;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(suit.name.toUpperCase(), x + 12, y + 28);
  // Cost gem, top right.
  ctx.beginPath();
  ctx.arc(x + w - 26, y + 52, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 19px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + w - 26, y + 59);
  // Big suit glyph in the middle.
  const small = w < 110;
  ctx.font = `${Math.round(h * 0.30)}px Georgia, serif`;
  ctx.fillStyle = suit.color;
  ctx.textAlign = 'center';
  ctx.fillText(suit.glyph, x + w / 2, y + h * (small ? 0.46 : 0.52));
  // Power badge (strike) or kind label.
  if (card.kind === 'strike') {
    ctx.beginPath();
    ctx.arc(x + 24, y + h - 26, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#7f1d1d';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 19px Georgia, serif';
    ctx.fillText(String(card.power), x + 24, y + h - 19);
  } else {
    roundRect(ctx, x + 10, y + h - 36, w - 20, 20, 7);
    ctx.fillStyle = suit.dark;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText(card.kind.toUpperCase(), x + w / 2, y + h - 22);
  }
  // Name and rules text.
  ctx.fillStyle = '#1f2937';
  ctx.font = `bold ${small ? 11 : 14}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText(card.name, x + w / 2, y + h * (small ? 0.68 : 0.62), w - 10);
  if (!small) {
    ctx.font = '11.5px Georgia, serif';
    ctx.fillStyle = '#4b5563';
    if (card.kind === 'strike') {
      ctx.textAlign = 'left';
      wrapText(ctx, card.text, x + 48, y + h * 0.74, w - 56, 14);
    } else {
      ctx.textAlign = 'center';
      wrapText(ctx, card.text, x + w / 2, y + h * 0.72, w - 18, 12);
    }
  }
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, cx, y + i * lineH));
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = '#7c2d12';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
  ctx.strokeStyle = 'rgba(251,191,36,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fbbf24';
  ctx.font = `${Math.round(h * 0.3)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('🏮', x + w / 2, y + h * 0.55);
}

function lifeBar(ctx, x, y, w, life, label, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x - 8, y - 26, w + 16, 52, 10);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 6);
  ctx.textAlign = 'right';
  ctx.fillText(`${life} / ${MAX_LIFE}`, x + w, y - 6);
  roundRect(ctx, x, y, w, 14, 7);
  ctx.fillStyle = '#3f3f46';
  ctx.fill();
  const frac = Math.max(0, life / MAX_LIFE);
  if (frac > 0) {
    roundRect(ctx, x, y, w * frac, 14, 7);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function emberRow(ctx, x, y, ember, max) {
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Ember', x, y + 5);
  for (let i = 0; i < max; i++) {
    ctx.beginPath();
    ctx.arc(x + 62 + i * 22, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < ember ? '#f59e0b' : '#3f3f46';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#92400e';
    ctx.stroke();
  }
}

function drawTable(ctx) {
  const g = ctx.createRadialGradient(640, 380, 80, 640, 400, 760);
  g.addColorStop(0, '#166534');
  g.addColorStop(0.6, '#14532d');
  g.addColorStop(1, '#052e16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = 'rgba(251,191,36,0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(640, 400, 560, 300, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(640, 400, 500, 252, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Lantern glow corners (bottom, clear of the HUD).
  ctx.font = '36px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏮', 52, 786);
  ctx.fillText('🏮', 1228, 786);
}

export function playerHandRects(state) {
  const n = state.player.hand.length;
  const total = n * (CARD_W + 10) - 10;
  const startX = (VIEW_W - total) / 2;
  return state.player.hand.map((card, i) => ({
    card, x: startX + i * (CARD_W + 10), y: VIEW_H - CARD_H - 18, w: CARD_W, h: CARD_H, index: i,
  }));
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawTable(ctx);
  if (state.screen === 'title') { renderTitle(ctx, state); return; }
  renderTable(ctx, state);
  if (state.screen === 'win') renderEnd(ctx, state, true);
  if (state.screen === 'lose') renderEnd(ctx, state, false);
}

function renderTitle(ctx, state) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = '64px Georgia, serif';
  ctx.fillText('🏮', 640, 150);
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('LANTERN DUEL', 640, 240);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText('of the Ember Isles', 640, 282);
  ctx.fillStyle = '#fff';
  ctx.font = '19px Georgia, serif';
  ctx.fillText('A turn-based card duel against the rival keeper, Brine.', 640, 340);
  ctx.fillText('Play cards with ember. Flame beats Leaf, Leaf beats Stone,', 640, 372);
  ctx.fillText('Stone beats Tide, Tide beats Flame — advantage deals +2 damage.', 640, 400);
  ctx.fillText('Reduce Brine to 0 life before yours runs out. First to fall loses.', 640, 428);
  // Sample fan of cards.
  const sample = state.sampleCards;
  sample.forEach((card, i) => {
    const x = 640 - (sample.length * 110) / 2 + i * 110 - 55;
    ctx.save();
    ctx.translate(x + 66, 460 + 93);
    ctx.rotate((i - 1.5) * 0.09);
    ctx.translate(-66, -93);
    drawCardFace(ctx, card, 0, 0, CARD_W, CARD_H, {});
    ctx.restore();
  });
  // Start button.
  roundRect(ctx, 520, 660, 240, 58, 14);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();
  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('▶  BEGIN DUEL', 640, 697);
  ctx.fillStyle = '#d1fae5';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Click a card to play it  •  Keys 1–5 play cards  •  Enter ends turn  •  M mutes', 640, 762);
}

function renderTable(ctx, state) {
  const { player, rival } = state;
  // Rival area (top).
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`⚓ ${rival.name} — Rival Keeper`, 36, 28);
  lifeBar(ctx, 36, 58, 300, rival.life, 'Rival life', '#f87171');
  if (rival.ward > 0) {
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(`🛡 Ward ${rival.ward}`, 350, 72);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e7e5e4';
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`Deck ${rival.deck.length}  •  Round ${state.round}  •  Score ${state.score}`, 1244, 30);
  ctx.fillText(`Wins ${state.wins}  •  Losses ${state.losses}`, 1244, 54);
  // Rival hand, face down.
  const rn = rival.hand.length;
  const rTotal = rn * 62 - 8;
  for (let i = 0; i < rn; i++) {
    drawCardBack(ctx, (VIEW_W - rTotal) / 2 + i * 62, 86, 54, 76);
  }
  // Rival stance badge.
  if (rival.stance) {
    const s = SUITS[rival.stance];
    ctx.fillStyle = s.color;
    roundRect(ctx, 560, 170, 160, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${s.glyph} ${s.name} stance`, 640, 190);
  }
  // Played cards in the middle.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— cards played this round —', 640, 212);
  player.played.forEach((card, i) => drawCardFace(ctx, card, 470 + i * 100, 224, 92, 130, {}));
  rival.played.forEach((card, i) => drawCardFace(ctx, card, 640 + 40 + i * 100 - 92, 224, 92, 130, {}));
  // Log panel (right).
  roundRect(ctx, 1010, 220, 236, 250, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('📜 Duel log', 1026, 244);
  ctx.fillStyle = '#e7e5e4';
  ctx.font = '12.5px Georgia, serif';
  let logY = 266;
  for (const line of state.log.slice(-4)) {
    logY = wrapLogLines(ctx, line, 1026, logY, 206, 15);
    logY += 6;
  }
  // Advantage wheel (left).
  roundRect(ctx, 34, 220, 210, 250, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('⚔ Advantage', 50, 244);
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#fff';
  const wheel = [['▲ Flame', 'beats ◆ Leaf'], ['◆ Leaf', 'beats ■ Stone'], ['■ Stone', 'beats ● Tide'], ['● Tide', 'beats ▲ Flame']];
  wheel.forEach(([a, b], i) => {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(a, 50, 276 + i * 44);
    ctx.fillStyle = '#e7e5e4';
    ctx.font = '13px Georgia, serif';
    ctx.fillText(b, 50, 294 + i * 44);
    ctx.font = '14px Georgia, serif';
  });
  ctx.fillStyle = '#fde68a';
  ctx.font = 'italic 13px Georgia, serif';
  ctx.fillText('Advantage: +2 damage', 50, 452);
  // Player area (bottom).
  lifeBar(ctx, 36, VIEW_H - 268, 300, player.life, 'Your life', '#4ade80');
  if (player.ward > 0) {
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🛡 Ward ${player.ward}`, 350, VIEW_H - 254);
  }
  emberRow(ctx, 36, VIEW_H - 228, player.ember, player.emberMax);
  ctx.fillStyle = '#e7e5e4';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Your deck: ${player.deck.length} cards`, 36, VIEW_H - 206);
  // End Turn button.
  const hover = state.hoverEnd;
  roundRect(ctx, 1080, VIEW_H - 262, 164, 52, 12);
  ctx.fillStyle = state.phase === 'player' ? (hover ? '#fbbf24' : '#f59e0b') : '#57534e';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();
  ctx.fillStyle = state.phase === 'player' ? '#451a03' : '#d6d3d1';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.phase === 'player' ? 'END TURN ⏎' : 'BRINE…', 1162, VIEW_H - 229);
  // Player hand.
  const rects = playerHandRects(state);
  rects.forEach((r) => {
    const affordable = r.card.cost <= player.ember && state.phase === 'player';
    drawCardFace(ctx, r.card, r.x, r.y, r.w, r.h, {
      affordable,
      lift: state.hoverCard === r.card.id || state.selectedCard === r.card.id,
    });
  });
  if (state.phase === 'player') {
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Your turn — click a card to play it, then End Turn.', 640, VIEW_H - 214);
  }
}

function wrapLogLines(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((l) => { ctx.fillText(l, x, y); y += lineH; });
  return y;
}

function renderEnd(ctx, state, won) {
  ctx.fillStyle = won ? 'rgba(6,60,20,0.92)' : 'rgba(60,6,6,0.92)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fbbf24';
  ctx.font = '72px Georgia, serif';
  ctx.fillText(won ? '🏆' : '💔', 640, 250);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? 'YOU WIN!' : 'YOU LOSE', 640, 340);
  ctx.fillStyle = '#fef3c7';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(
    won ? `Brine's lantern is out — you win the duel in ${state.round} round${state.round === 1 ? '' : 's'}!`
      : `Brine keeps the isles — your lantern fades in round ${state.round}.`,
    640, 392,
  );
  ctx.fillStyle = '#e7e5e4';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(`Final life — You ${state.player.life}  •  Brine ${state.rival.life}      Score ${state.score}      Wins ${state.wins} • Losses ${state.losses}`, 640, 432);
  roundRect(ctx, 500, 480, 280, 58, 14);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();
  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('↻  PLAY AGAIN  (R)', 640, 517);
  ctx.fillStyle = '#d1fae5';
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Click Play Again or press R for a fresh duel.', 640, 580);
}
