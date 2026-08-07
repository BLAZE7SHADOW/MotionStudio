// The help copy is the product's voice, and the failure mode is not a crash —
// it is drift back into prose. The tour this replaced was 21 steps of correct,
// complete, unread paragraphs, and it got that way one reasonable sentence at a
// time. These limits are the guard rail: they cannot tell you the words are
// good, but they can refuse the shape that made the last version unreadable.
//
// The limits themselves are documented at the top of src/content/help.ts.

const H = await import('./help.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const ids = Object.keys(H.HELP);
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

check('there is copy for every control', ids.length === 21);

/* Two surfaces read these ids: the quick start anchors steps by them, and the
   helper dots build one beacon per id. Both do `[data-tour="<id>"]`, so a key
   that can't survive an attribute selector silently matches nothing. */
check(
  'every id is a usable data-tour value',
  ids.every((id) => /^[a-z][a-z0-9-]*$/.test(id)),
);

const offenders = (predicate) => ids.filter((id) => predicate(H.HELP[id], id));

const noEmoji = offenders((e) => !e.emoji || e.emoji.trim().length === 0);
check(`every entry has an emoji${noEmoji.length ? ` — ${noEmoji}` : ''}`, noEmoji.length === 0);

const longTitles = offenders((e) => words(e.title) > 5);
check(`titles are 5 words or fewer${longTitles.length ? ` — ${longTitles}` : ''}`, longTitles.length === 0);

const longLines = offenders((e) => words(e.line) > 15);
check(`lines are 15 words or fewer${longLines.length ? ` — ${longLines}` : ''}`, longLines.length === 0);

/* One idea per card. Two sentences means the second one is the detail, and the
   detail belongs in `more` where someone has asked for it. Abbreviations that
   end in a full stop would false-positive here; there are none, and adding one
   should be a conscious decision rather than a silent test failure. */
const multiSentence = offenders((e) => (e.line.match(/[.!?](\s|$)/g) ?? []).length > 1);
check(`lines are a single sentence${multiSentence.length ? ` — ${multiSentence}` : ''}`, multiSentence.length === 0);

const tooManyChips = offenders((e) => (e.chips?.length ?? 0) > 2);
check(`no entry has more than 2 chips${tooManyChips.length ? ` — ${tooManyChips}` : ''}`, tooManyChips.length === 0);

const fatChips = offenders((e) => (e.chips ?? []).some((c) => words(c.text) > 4 || !c.emoji));
check(`chips are 4 words or fewer with an emoji${fatChips.length ? ` — ${fatChips}` : ''}`, fatChips.length === 0);

const longMore = offenders((e) => e.more && words(e.more) > 60);
check(`the long answer stays under 60 words${longMore.length ? ` — ${longMore}` : ''}`, longMore.length === 0);

/* Placement is passed straight to driver.js. A typo here doesn't throw — the
   popover just lands somewhere unhelpful, which is the kind of bug that ships. */
const SIDES = ['top', 'right', 'bottom', 'left'];
const ALIGNS = ['start', 'center', 'end'];
const badPlacement = offenders((e) => !SIDES.includes(e.side) || !ALIGNS.includes(e.align));
check(`placement is valid${badPlacement.length ? ` — ${badPlacement}` : ''}`, badPlacement.length === 0);

/* The helper dots are the only home for the detail the old tour used to force
   on everyone up front. An entry with no `more` is a control you can point at
   but not actually ask about, so the panels that carry real depth must have it. */
const NEEDS_DEPTH = ['export', 'canvas', 'properties', 'timeline', 'tracks', 'beat', 'shots'];
const shallow = NEEDS_DEPTH.filter((id) => !H.HELP[id]?.more);
check(`the deep panels carry a long answer${shallow.length ? ` — ${shallow}` : ''}`, shallow.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
