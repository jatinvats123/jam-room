// npm run verify: end-to-end check of the studio kit on the sample games, offline.
// No Discord, Switch, credentials, network or git pushes. Each claim prints `PASS <claim>` or
// `FAIL <claim>: <why>`; exits 1 on any FAIL. Playtests run in parallel (pool of 3) alongside the
// fast checks, each group in its own throwaway studio under .verify/ (removed at the end).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { REPO, SAMPLE_GAMES, makeStudio, removeStudio, runTool, runNode, pool, latest } from './lib/temp-studio.mjs';

const T0 = Date.now();
const results = []; // [order, line]
const studios = [];
const studio = (name, games) => { const d = makeStudio(name, games); studios.push(d); return d; };
const report = (order, claim, ok, why = '') => results.push([order, ok ? `PASS ${claim}` : `FAIL ${claim}: ${why || 'failed'}`.slice(0, 400)]);
const short = out => (out || '').split('\n').filter(l => l.trim()).slice(-2).join(' | ').slice(0, 200);
const failLines = out => {
  const f = (out || '').split('\n').filter(l => /^FAIL |timed out/.test(l.trim()));
  return (f.length ? f.join(' | ') : short(out)).slice(0, 300);
};
const onlyFps = out => { const f = (out || '').split('\n').filter(l => /^FAIL /.test(l)); return f.length > 0 && f.every(l => /frame rate/.test(l)); };
const title = slug => fs.readFileSync(path.join(REPO, 'examples', 'games', slug, 'GAME_SPEC.md'), 'utf8')
  .match(/^---\r?\n[\s\S]*?^title:\s*["']?(.+?)["']?\s*$/m)?.[1];

// ---- 2. playtests on each sample game's latest version (studio A), pool of 3.
async function playtests() {
  const A = studio('playtest');
  for (const slug of SAMPLE_GAMES) { // 1. static check on the same studio (read-only)
    const n = latest(slug, A);
    const r = await runTool(A, 'check', [slug, String(n)], { timeout: 30_000 });
    report(10 + SAMPLE_GAMES.indexOf(slug), `check.mjs ${slug} v${n}`, r.code === 0 && r.out.includes('CHECK PASS'), short(r.out));
  }
  await pool(SAMPLE_GAMES, 3, async (slug, i) => {
    const n = latest(slug, A);
    let r = await runTool(A, 'playtest', [slug, String(n)], { timeout: 140_000 }), note = '';
    // Busy CPU (other Chromiums) can fail fps, or leak real time into the fake clock (playtest.mjs
    // never pauses it), shifting scenario timing. One retry if there is time; a real bug fails twice.
    if (r.code !== 0 && Date.now() - T0 < 100_000) {
      note = `, flaky: passed on retry; first run: ${onlyFps(r.out) ? 'fps only' : failLines(r.out).slice(0, 120)}`;
      r = await runTool(A, 'playtest', [slug, String(n)], { timeout: 140_000 });
    }
    const ok = r.code === 0 && r.out.includes('PLAYTEST PASS');
    report(20 + i, `playtest.mjs ${slug} v${n} (${(r.ms / 1000).toFixed(0)}s${ok ? note : ''})`, ok, failLines(r.out));
    if (slug === 'penguin-slide') { // the v1 bug repro is replayed as a hard check on the hotfix
      let checks = [];
      try { checks = JSON.parse(fs.readFileSync(path.join(A, 'games', slug, `v${n}`, 'playtest.json'), 'utf8')).checks || []; } catch {}
      const rc = checks.filter(c => c.name.startsWith('[v1 repro-1]') && !c.advisory);
      report(32, `playtest ${slug} v${n} replays [v1 repro-1] as a hard check and it passes`,
        rc.length > 0 && rc.every(c => c.pass), rc.length ? rc.filter(c => !c.pass).map(c => `${c.name}: ${c.detail}`).join(' | ') : 'no [v1 repro-1] check in playtest.json');
    }
  });
}

// ---- 3. bug repro: v1 --only repro-1.json FAILS (bug present); same repro on v2 PASSES (studio B).
async function repro() {
  const B = studio('repro', ['penguin-slide']);
  const v1 = await runTool(B, 'playtest', ['penguin-slide', '1', '--only', 'repro-1.json'], { timeout: 90_000 });
  report(30, 'bug repro: penguin-slide v1 --only repro-1.json FAILS (bug reproduced)',
    v1.code === 1 && v1.out.includes('PLAYTEST FAIL') && /^FAIL .*BUG 1:/m.test(v1.out), v1.code === 0 ? 'repro passed on v1: bug not reproduced' : short(v1.out));
  fs.copyFileSync(path.join(B, 'games', 'penguin-slide', 'v1', 'repro-1.json'), path.join(B, 'games', 'penguin-slide', 'v2', 'repro-1.json'));
  const v2 = await runTool(B, 'playtest', ['penguin-slide', '2', '--only', 'repro-1.json'], { timeout: 90_000 });
  report(31, 'bug repro: penguin-slide v2 --only repro-1.json PASSES (hotfix works)', v2.code === 0 && v2.out.includes('PLAYTEST PASS'), failLines(v2.out));
}

// ---- 4. remix + next version (studio C); 5. arcade + making-of pages (studio D); 6./7. templates.
async function fastChecks() {
  const C = studio('remix');
  const slug = 'comet-remix';
  const nv = await runTool(C, 'new-version', [slug, '--from', 'comet-dash'], { timeout: 30_000 });
  const src = path.join(C, 'games', 'comet-dash', `v${latest('comet-dash', C)}`, 'index.html');
  const dst = path.join(C, 'games', slug, 'v1', 'index.html');
  const same = fs.existsSync(dst) && fs.readFileSync(dst).equals(fs.readFileSync(src));
  const ck = same ? await runTool(C, 'check', [slug, '1'], { timeout: 30_000 }) : { code: 1, out: '' };
  report(40, `remix: new-version ${slug} --from comet-dash makes v1 identical to comet-dash latest, check.mjs passes`,
    nv.code === 0 && same && ck.code === 0, nv.code ? short(nv.out) : !same ? 'v1/index.html missing or differs' : short(ck.out));
  const before = latest('penguin-slide', C);
  const nx = await runTool(C, 'new-version', ['penguin-slide'], { timeout: 30_000 });
  const want = path.join(C, 'games', 'penguin-slide', `v${before + 1}`, 'index.html');
  report(41, `new-version penguin-slide creates v${before + 1}`,
    nx.code === 0 && fs.existsSync(want) && nx.out.includes(`NEW VERSION ${before + 1}`), short(nx.out) || `${want} missing`);

  const D = studio('arcade');
  const ba = await runTool(D, 'build-arcade', [], { timeout: 30_000 });
  const arcade = fs.existsSync(path.join(D, 'index.html')) ? fs.readFileSync(path.join(D, 'index.html'), 'utf8') : '';
  const missing = SAMPLE_GAMES.filter(s => !title(s) || !arcade.includes(title(s)));
  report(50, `build-arcade lists all ${SAMPLE_GAMES.length} titles (${SAMPLE_GAMES.map(title).join(', ')})`,
    ba.code === 0 && !missing.length, ba.code ? short(ba.out) : `missing: ${missing.join(', ')}`);
  const noPage = SAMPLE_GAMES.filter(s => {
    const f = path.join(D, 'games', s, 'index.html');
    return !fs.existsSync(f) || !fs.readFileSync(f, 'utf8').includes(`How ${title(s)} was made`) || !arcade.includes(`href="games/${s}/"`);
  });
  report(51, 'build-arcade writes a "How this game was made" page games/<slug>/index.html per game (no git repo)',
    ba.code === 0 && !noPage.length, ba.code ? short(ba.out) : `missing or wrong: ${noPage.join(', ')}`);

  const tdir = path.join(REPO, 'templates');
  for (const [i, f] of ['jam-room.template.yaml', 'jam-game-room.template.yaml'].entries()) {
    try { YAML.parse(fs.readFileSync(path.join(tdir, f), 'utf8')); report(60 + i, `${f} parses as YAML`, true); }
    catch (e) { report(60 + i, `${f} parses as YAML`, false, e.message.split('\n')[0]); }
  }
  try {
    const agents = YAML.parse(fs.readFileSync(path.join(tdir, 'jam-room.template.yaml'), 'utf8'))?.agents || [];
    const ok = agents.length === 3 && agents.every(a => typeof a?.instructions === 'string' && a.instructions.trim().length > 50);
    report(62, 'lobby template has 3 agents, each with instructions', ok, `${agents.length} agents; with instructions: ${agents.filter(a => a?.instructions?.trim()).length}`);
  } catch (e) { report(62, 'lobby template has 3 agents, each with instructions', false, e.message.split('\n')[0]); }

  let li = await runNode(path.join(REPO, 'scripts', 'live-instructions.mjs'), ['--check'], { timeout: 30_000 });
  if (li.code !== 0) li = await runNode(path.join(REPO, 'scripts', 'live-instructions.mjs'), ['--check'], { timeout: 30_000 }); // template may be mid-edit
  report(70, 'live-instructions.mjs --check exits 0', li.code === 0, short(li.out));
}

const guard = (order, name, p) => p.catch(e => report(order, name, false, `crashed: ${e.message}`));
let code = 1;
try {
  console.log('verify: 3 playtests in parallel (~1-2 min) + fast checks, in temp studios under .verify/');
  await Promise.all([guard(29, 'playtests', playtests()), guard(39, 'bug repro', repro()), guard(69, 'fast checks', fastChecks())]);
  results.sort((a, b) => a[0] - b[0]);
  for (const [, line] of results) console.log(line);
  const failed = results.filter(([, l]) => l.startsWith('FAIL')).length;
  code = failed ? 1 : 0;
  console.log(`${failed ? 'VERIFY FAIL' : 'VERIFY PASS'}: ${results.length - failed}/${results.length} claims passed in ${((Date.now() - T0) / 1000).toFixed(1)}s`);
} finally {
  for (const d of studios) try { removeStudio(d); } catch {}
}
process.exit(code);
