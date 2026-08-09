const P = await import('./placement.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const compW = 1920, compH = 1080;
const w = 1000, h = 160;
const defaultX = Math.round((compW - w) / 2); // 460
const defaultY = Math.round((compH - h) / 2); // 460

const inBounds = (pos) =>
  pos.x >= 0 && pos.y >= 0 && pos.x + w <= compW && pos.y + h <= compH;

check(
  'an empty canvas gets the default centered position',
  (() => {
    const pos = P.cascadePosition([], defaultX, defaultY, w, h, compW, compH);
    return pos.x === defaultX && pos.y === defaultY;
  })(),
);

check(
  'a second insert offsets away from an element already at the default spot',
  (() => {
    const existing = [{ x: defaultX, y: defaultY, width: w, height: h }];
    const pos = P.cascadePosition(existing, defaultX, defaultY, w, h, compW, compH);
    return (pos.x !== defaultX || pos.y !== defaultY) && inBounds(pos);
  })(),
);

check(
  'an element at a different size does not block the default spot',
  (() => {
    const existing = [{ x: defaultX, y: defaultY, width: w + 1, height: h }];
    const pos = P.cascadePosition(existing, defaultX, defaultY, w, h, compW, compH);
    return pos.x === defaultX && pos.y === defaultY;
  })(),
);

// Repeatedly insert, each time feeding the previous result back in as an
// "existing" element — this mirrors how the real store accumulates elements
// one add() call at a time.
{
  let existing = [];
  let everyPositionInBounds = true;
  let sawDistinctPositions = 0;
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const pos = P.cascadePosition(existing, defaultX, defaultY, w, h, compW, compH);
    if (!inBounds(pos)) everyPositionInBounds = false;
    const key = `${pos.x},${pos.y}`;
    if (!seen.has(key)) { seen.add(key); sawDistinctPositions++; }
    existing = [...existing, { x: pos.x, y: pos.y, width: w, height: h }];
  }
  check('200 successive inserts never leave the canvas', everyPositionInBounds);
  // The cascade has finite room before it clamps at the edge and starts
  // reusing the same spot — with a 32px step this is well under 200.
  check('the cascade eventually reuses a clamped edge position rather than growing forever', sawDistinctPositions < 200);
}

check(
  'an element too large to offset at all still stays fully on canvas',
  (() => {
    // width/height equal to the full canvas: compW - w === 0, so every
    // candidate clamps to (0, 0) immediately.
    const existing = [{ x: 0, y: 0, width: compW, height: compH }];
    const pos = P.cascadePosition(existing, 0, 0, compW, compH, compW, compH);
    return pos.x === 0 && pos.y === 0;
  })(),
);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
