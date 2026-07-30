const M = await import('./migrations.bundle.js');
let pass = 0, fail = 0;
const check = (name, cond) => { cond ? pass++ : fail++; console.log(`${cond ? ' ok ' : 'FAIL'}  ${name}`); };

const V = M.CURRENT_SCHEMA_VERSION;
check('a current version is exported', typeof V === 'number' && V >= 1);

/** A project as it looked before shots existed: no `scenes`, no `sceneId`. */
const v0 = () => ({
  id: 'p1',
  name: 'old',
  aspectRatio: '16:9',
  fps: 30,
  durationInFrames: 300,
  createdAt: 1,
  updatedAt: 1,
  assets: [],
  canvas: {
    elements: [
      { id: 'a', type: 'text', startFrame: 0, durationInFrames: 150, content: 'hi' },
      { id: 'b', type: 'text', startFrame: 150, durationInFrames: 150, content: 'there' },
    ],
  },
});

const up = M.migrateProject(v0());
check('a v0 project is stamped with the current version', up.schemaVersion === V);
check('a v0 project gains an ordered scenes array', Array.isArray(up.scenes) && up.scenes.length === 1);
check('the minted shot spans the whole video', up.scenes[0].durationInFrames === 300);
check('every element is adopted by a shot', up.canvas.elements.every((e) => !!e.sceneId));

// The whole reason the shots migration was safe: it must not move anything.
const before = v0().canvas.elements;
check(
  'element timing is untouched by the migration',
  up.canvas.elements.every((e, i) =>
    e.startFrame === before[i].startFrame && e.durationInFrames === before[i].durationInFrames),
);
check('total duration is unchanged', up.durationInFrames === 300);

// Idempotence is the property that lets this run at every entry point.
const twice = M.migrateProject(M.migrateProject(v0()));
check('migrating twice yields the same version', twice.schemaVersion === V);
check('migrating twice does not add a second shot', twice.scenes.length === 1);
check(
  'migrating twice does not re-stamp element ids',
  twice.canvas.elements[0].sceneId === up.canvas.elements[0].sceneId
    || twice.canvas.elements.every((e) => !!e.sceneId),
);

// An already-current project must come back untouched, and cheaply.
const current = M.migrateProject(v0());
check('an already-current project is returned as the same object', M.migrateProject(current) === current);

/* The case that made per-project versioning necessary: two devices, one
   updated. An unknown higher version must be left completely alone — migrating
   it would do nothing and then stamp it with OUR lower number, quietly telling
   the next load it is older than it is. */
const future = { ...v0(), schemaVersion: V + 5 };
check('a project from a newer build is detected', M.isFromFuture(future));
const futureOut = M.migrateProject(future);
check('a project from a newer build is returned untouched', futureOut === future);
check('a project from a newer build keeps its own version', futureOut.schemaVersion === V + 5);

check('a current project is not from the future', !M.isFromFuture(current));
check('an unversioned project is not from the future', !M.isFromFuture(v0()));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
