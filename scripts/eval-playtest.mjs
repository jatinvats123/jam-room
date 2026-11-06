// npm run eval [-- --only <slug>[,<slug>]] [--kind <kind>] [--strict] [--jobs N] [--mutants <dir>] [--doc]
// Measures the playtester (studio-kit/tools/playtest.mjs) against planted bugs. For each sample game:
// one clean run of its latest version plus one run per mutant from scripts/eval/mutants/<slug>.mjs
// (format: scripts/eval/mutate.mjs). Every run gets its own throwaway studio with just that game,
// the mutated index.html written over games/<slug>/v<N>/, and a real `node tools/playtest.mjs`.
//   caught     = playtest FAIL on a mutant        missed = playtest PASS on a mutant (a finding)
//   false FAIL = playtest FAIL on a clean game    (exit 1)
// A run failing only "frame rate" is re-run once (CPU contention), except fps-killer mutants.
// Writes docs/eval.md (full runs; subset runs only with --doc) and prints a summary.
// Exit 1: a clean game FAILs, a mutant is invalid, a run errors, or (--strict) a mutant is missed.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO, EXAMPLES, SAMPLE_GAMES, makeStudio, runTool, pool, latest } from './lib/temp-studio.mjs';
import { KINDS } from './eval/mutate.mjs';

const KIND_TEXT = {
  'collision-disabled': 'hazards no longer end the run',
  'score-frozen': 'score never increases',
  'gameover-unreachable': 'the run can never end',
  'control-ignored': 'one listed control key does nothing',
  'console-error': 'an error is logged when the game starts',
  'fps-killer': 'a busy loop per frame drops the frame rate',
  'restart-broken': 'Space/Enter after game over does not start a new run',
};

// ---- arguments
const USAGE = 'Usage: npm run eval -- [--only <slug>[,<slug>]] [--kind <kind>] [--strict] [--jobs N] [--mutants <dir>] [--doc]';
const argv = process.argv.slice(2);
const VALUED = ['--only', '--kind', '--jobs', '--mutants'], BOOL = ['--strict', '--doc'];
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (BOOL.includes(a)) opts[a] = true;
  else if (VALUED.includes(a)) {
    const v = argv[++i];
    if (!v || v.startsWith('--')) usage(`${a} needs a value`);
    opts[a] = v;
  } else usage(`unknown argument "${a}"`);
}
function usage(msg) { console.error(`${msg}\n${USAGE}\nKinds: ${KINDS.join(', ')}`); process.exit(2); }

const games = opts['--only'] ? opts['--only'].split(',').map(s => s.trim()).filter(Boolean) : SAMPLE_GAMES;
for (const g of games) if (!fs.existsSync(path.join(EXAMPLES, g))) usage(`no sample game "${g}" in examples/games/`);
const kindFilter = opts['--kind'] || null;
if (kindFilter && !KINDS.includes(kindFilter)) usage(`unknown kind "${kindFilter}"`);
const jobsLimit = opts['--jobs'] ? Number(opts['--jobs']) : 3;
if (!Number.isInteger(jobsLimit) || jobsLimit < 1) usage('--jobs takes a positive integer');
const MUT_DIR = opts['--mutants'] ? path.resolve(opts['--mutants']) : path.join(REPO, 'scripts', 'eval', 'mutants');
const strict = !!opts['--strict'];
const subset = !!(opts['--only'] || kindFilter || opts['--mutants']);
const writeDoc = !subset || !!opts['--doc'];
const rel = p => path.relative(REPO, p).replace(/\\/g, '/') || '.';

// ---- load + validate mutants (an invalid mutant is reported and fails the eval, never dropped)
const invalid = [];   // { game, id, kind, reason }
const evalErrors = []; // strings
const mutants = [];   // { game, id, kind, description, html }
for (const game of games) {
  const file = path.join(MUT_DIR, `${game}.mjs`);
  if (!fs.existsSync(file)) { evalErrors.push(`${game}: no mutants file ${rel(file)}`); continue; }
  const version = latest(game);
  const original = fs.readFileSync(path.join(EXAMPLES, game, `v${version}`, 'index.html'), 'utf8');
  let list;
  try { list = (await import(pathToFileURL(file).href)).default; }
  catch (e) { invalid.push({ game, id: path.basename(file), reason: `import failed: ${e.message}` }); continue; }
  if (!Array.isArray(list)) { invalid.push({ game, id: path.basename(file), reason: 'default export is not an array' }); continue; }
  const seen = new Set();
  list.forEach((m, i) => {
    const id = m && typeof m.id === 'string' && m.id ? m.id : `${game} mutant #${i + 1}`;
    const bad = reason => { invalid.push({ game, id, kind: m?.kind, reason }); };
    if (!m || typeof m !== 'object') return bad('not an object');
    if (!m.id || typeof m.id !== 'string') return bad('missing id');
    if (seen.has(id)) return bad('duplicate id');
    seen.add(id);
    if (!KINDS.includes(m.kind)) return bad(`kind "${m.kind}" is not one of: ${KINDS.join(', ')}`);
    if (typeof m.apply !== 'function') return bad('apply is not a function');
    let html, again;
    try { html = m.apply(original); again = m.apply(original); }
    catch (e) { return bad(`apply threw: ${e.message}`); }
    if (typeof html !== 'string') return bad('apply did not return a string');
    if (html === original) return bad('apply returned the original unchanged');
    if (again !== html) return bad('apply is not deterministic (two calls gave different html)');
    if (kindFilter && m.kind !== kindFilter) return;
    mutants.push({ game, version, id, kind: m.kind, description: String(m.description || ''), html });
  });
}

// ---- runs
const live = new Set();
const cleanup = dir => {
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); }
  catch (e) { console.error(`warning: could not remove ${rel(dir)}: ${e.message}`); }
  live.delete(dir);
};
process.on('SIGINT', () => { for (const d of [...live]) cleanup(d); process.exit(130); });

const lastLine = s => (s.trim().split('\n').pop() || '').slice(0, 160);

/** One playtest in a fresh studio. Resolves { status: pass|fail|error, failed[], total, seconds, detail }. */
async function playtest(game, html) {
  const studio = makeStudio(`eval-${game}`, [game]); live.add(studio);
  try {
    const n = latest(game, studio);
    const vdir = path.join(studio, 'games', game, `v${n}`);
    fs.rmSync(path.join(vdir, 'playtest.json'), { force: true }); // copied from examples: never read a stale one
    if (html != null) fs.writeFileSync(path.join(vdir, 'index.html'), html);
    const { code, out, ms } = await runTool(studio, 'playtest', [game, String(n)], { timeout: 240_000 });
    const seconds = Math.round(ms / 100) / 10;
    let report = null;
    try { report = JSON.parse(fs.readFileSync(path.join(vdir, 'playtest.json'), 'utf8')); } catch { /* fall back to stdout */ }
    if (report && Array.isArray(report.checks)) {
      const hard = report.checks.filter(c => !c.advisory), failed = hard.filter(c => !c.pass);
      return { status: report.pass ? 'pass' : 'fail', failed: failed.map(c => c.name), failedDetail: failed.map(c => c.detail || ''), total: hard.length, seconds, version: n };
    }
    const failed = [...out.matchAll(/^FAIL (.+?): /gm)].map(m => m[1]);
    if (/^PLAYTEST FAIL\s*$/m.test(out)) return { status: 'fail', failed, failedDetail: [], total: null, seconds, version: n };
    if (/^PLAYTEST PASS\s*$/m.test(out)) return { status: 'pass', failed: [], failedDetail: [], total: null, seconds, version: n };
    return { status: 'error', failed: [], failedDetail: [], total: null, seconds, version: n,
      detail: `playtest ${code === null ? 'timed out' : `exited ${code}`} without a result: ${lastLine(out)}` };
  } finally { cleanup(studio); }
}

const fpsOnly = r => r.status === 'fail' && r.failed.length > 0 && r.failed.every(n => /^frame rate/.test(n));

const jobs = [
  ...games.filter(g => fs.existsSync(path.join(EXAMPLES, g))).map(game => ({ game, mutant: null })),
  ...mutants.map(m => ({ game: m.game, mutant: m })),
];
const T0 = Date.now();
let done = 0;
console.log(`eval: ${games.length} game(s), ${mutants.length} mutant(s)${kindFilter ? ` of kind ${kindFilter}` : ''}, ${jobs.length} playtests, ${jobsLimit} at a time` +
  (invalid.length ? `; ${invalid.length} INVALID mutant(s)` : ''));
const results = await pool(jobs, jobsLimit, async job => {
  let r = await playtest(job.game, job.mutant ? job.mutant.html : null);
  if (fpsOnly(r) && job.mutant?.kind !== 'fps-killer') {
    const first = r;
    r = await playtest(job.game, job.mutant ? job.mutant.html : null);
    r.rerun = `first run failed only frame rate (${first.failedDetail[0] || '?'}); re-ran once`;
  }
  const res = { ...job, ...r };
  const label = job.mutant ? job.mutant.id : `${job.game} (clean)`;
  const verdict = res.status === 'error' ? 'ERROR' : job.mutant ? (res.status === 'fail' ? 'caught' : 'MISSED') : (res.status === 'pass' ? 'pass' : 'FALSE FAIL');
  const why = res.status === 'error' ? res.detail : res.failed.length ? res.failed.join('; ') : '';
  console.log(`[${String(++done).padStart(2)}/${jobs.length}] ${label.padEnd(36)} ${verdict.padEnd(10)} ${res.seconds}s${res.rerun ? ' (rerun)' : ''}${why ? `  ${why}`.slice(0, 160) : ''}`);
  return res;
});

// ---- tally
const clean = results.filter(r => !r.mutant), muts = results.filter(r => r.mutant);
const falseFails = clean.filter(r => r.status === 'fail');
const caught = muts.filter(r => r.status === 'fail'), missed = muts.filter(r => r.status === 'pass');
for (const r of results.filter(r => r.status === 'error')) evalErrors.push(`${r.mutant ? r.mutant.id : `${r.game} (clean)`}: ${r.detail}`);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const headline = `Caught ${caught.length}/${muts.length} planted bugs · ${plural(falseFails.length, 'false FAIL')} on ${plural(clean.length, 'clean game')}`;
const minutes = ((Date.now() - T0) / 60000).toFixed(1);

// ---- docs/eval.md
if (writeDoc) {
  const cell = s => String(s ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
  const short = s => (s.length > 70 ? s.slice(0, 67) + '...' : s);
  const checksCell = r => r.status === 'error' ? cell(r.detail) : cell(r.failed.map(short).join('; ')) + (r.rerun ? ' (after a frame-rate rerun)' : '');
  const L = [];
  L.push('# Playtester eval: planted bugs', '');
  L.push(`_Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by \`npm run eval\`` +
    (subset ? ` (subset: ${[opts['--only'] && `--only ${opts['--only']}`, kindFilter && `--kind ${kindFilter}`, opts['--mutants'] && `--mutants ${rel(MUT_DIR)}`].filter(Boolean).join(' ')})` : '') +
    ` in ${minutes} min._`, '');
  L.push(`**${headline}**`, '');
  if (invalid.length || evalErrors.length) L.push(`**Eval errors: ${invalid.length} invalid mutant(s), ${evalErrors.length} other error(s), see the end of this page.**`, '');
  L.push('## How it works', '');
  L.push(`Each sample game (${games.map(g => `\`${g}\``).join(', ')}) gets planted bugs, "mutants", defined in ` +
    '`scripts/eval/mutants/<slug>.mjs`: small deterministic edits of the latest version\'s `index.html`, one per kind ' +
    `(${KINDS.map(k => `\`${k}\``).join(', ')}). For every mutant, and once for the unmodified game, the eval builds a throwaway ` +
    'studio with just that game, writes the mutated HTML over `games/<slug>/v<N>/index.html` and runs the real playtester ' +
    '(`studio-kit/tools/playtest.mjs`, headless Chromium, fake clock, seed 42) exactly as an agent would, with the game\'s own ' +
    '`scenario.json` and saved repros. A mutant is **caught** when the playtest FAILs; the clean games must PASS, a FAIL there ' +
    'is a **false FAIL**. Failed checks come from `playtest.json` (hard checks with `pass: false`, advisory replays ignored). ' +
    'A run that fails only the frame-rate check is re-run once, because parallel playtests compete for CPU (not for `fps-killer` mutants).', '');
  L.push('Reproduce: `npm install && npx playwright install chromium`, then `npm run eval` (3 playtests in parallel, about a minute each). ' +
    'Subsets: `npm run eval -- --only <slug>` or `--kind <kind>`; `--strict` also fails the exit code on misses.', '');
  L.push('## Clean games', '', '| game | version | result | failed checks | time |', '|---|---|---|---|---|');
  for (const r of clean) L.push(`| ${r.game} | v${r.version} | ${r.status === 'pass' ? '✅ PASS' : r.status === 'fail' ? '❌ false FAIL' : '⚠️ error'} | ${checksCell(r) || '-'}${r.rerun && r.status === 'pass' ? ' (passed on a frame-rate rerun)' : ''} | ${r.seconds}s |`);
  L.push('');
  for (const kind of KINDS) {
    if (kindFilter && kind !== kindFilter) continue;
    const rows = muts.filter(r => r.mutant.kind === kind);
    const k = rows.filter(r => r.status === 'fail').length;
    L.push(`## ${kind}${rows.length ? ` (${k}/${rows.length} caught)` : ''}`, '', `_Planted: ${KIND_TEXT[kind] || kind}._`, '');
    if (!rows.length) { L.push('_No valid mutants of this kind._', ''); continue; }
    L.push('| game | mutant | what was planted | result | which checks caught it |', '|---|---|---|---|---|');
    for (const r of rows) {
      const res = r.status === 'fail' ? '✅ caught' : r.status === 'pass' ? '❌ missed' : '⚠️ error';
      L.push(`| ${r.game} | \`${cell(r.mutant.id)}\` | ${cell(r.mutant.description)} | ${res} | ${r.status === 'pass' ? `- (PASS${r.total ? `, ${r.total}/${r.total} checks` : ''})` : checksCell(r)} |`);
    }
    L.push('');
  }
  L.push('## Misses', '');
  if (!missed.length) L.push('None.');
  else for (const r of missed) L.push(`- **${r.game}** \`${r.mutant.id}\` (${r.mutant.kind}): ${r.mutant.description || 'no description'}. The playtest passed${r.total ? ` all ${r.total} hard checks` : ''}.`);
  L.push('');
  if (invalid.length || evalErrors.length) {
    L.push('## Eval errors', '');
    for (const m of invalid) L.push(`- invalid mutant **${m.game}** \`${m.id}\`${m.kind ? ` (${m.kind})` : ''}: ${m.reason}`);
    for (const e of evalErrors) L.push(`- ${e}`);
    L.push('');
  }
  fs.mkdirSync(path.join(REPO, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(REPO, 'docs', 'eval.md'), L.join('\n'));
}

// ---- summary
console.log('');
console.log(headline);
for (const r of falseFails) console.log(`  false FAIL ${r.game} v${r.version}: ${r.failed.join('; ')}`);
for (const r of missed) console.log(`  missed ${r.mutant.id} (${r.mutant.kind}): ${r.mutant.description}`);
for (const m of invalid) console.log(`  INVALID ${m.game} ${m.id}: ${m.reason}`);
for (const e of evalErrors) console.log(`  ERROR ${e}`);
console.log(`${minutes} min${writeDoc ? '; wrote docs/eval.md' : ' (subset run: docs/eval.md not written, add --doc)'}`);
const exitBad = falseFails.length || invalid.length || evalErrors.length || (strict && missed.length);
process.exit(exitBad ? 1 : 0);
