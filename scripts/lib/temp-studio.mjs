// Shared by scripts/verify.mjs and scripts/eval-playtest.mjs. Zero Switch, Discord or credentials.
// makeStudio() builds a throwaway studio from studio-kit/ + examples/games/ inside jam-room/.verify/,
// so `import('playwright')` in its tools resolves to jam-room/node_modules (npm install once).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KIT = path.join(REPO, 'studio-kit');
export const EXAMPLES = path.join(REPO, 'examples', 'games');
export const SAMPLE_GAMES = ['cat-vs-cucumbers', 'penguin-slide', 'comet-dash'];

/** Chromium for Playwright: an explicit PLAYWRIGHT_BROWSERS_PATH, else a studio-local .browsers/ if one
 *  exists (repo or ~/jam-studio), else Playwright's default location (what CI installs into). */
export function browserEnv() {
  const env = { ...process.env, JAM_NO_SERVE: '1', JAM_LOCAL: '1' };
  if (!env.PLAYWRIGHT_BROWSERS_PATH) {
    for (const p of [path.join(REPO, '.browsers'), path.join(os.homedir(), 'jam-studio', '.browsers')])
      if (fs.existsSync(p)) { env.PLAYWRIGHT_BROWSERS_PATH = p; break; }
  }
  return env;
}

/** Fresh studio at jam-room/.verify/<name>-<pid>-<n>/ with the kit and the given sample games. */
let counter = 0;
export function makeStudio(name = 'studio', games = SAMPLE_GAMES) {
  const dir = path.join(REPO, '.verify', `${name}-${process.pid}-${counter++}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'games'), { recursive: true });
  for (const f of ['STUDIO.md', 'package.json']) fs.copyFileSync(path.join(KIT, f), path.join(dir, f));
  for (const d of ['tools', 'starter']) fs.cpSync(path.join(KIT, d), path.join(dir, d), { recursive: true });
  fs.mkdirSync(path.join(dir, 'templates'));
  fs.copyFileSync(path.join(REPO, 'templates', 'jam-game-room.template.yaml'), path.join(dir, 'templates', 'jam-game-room.template.yaml'));
  for (const g of games) fs.cpSync(path.join(EXAMPLES, g), path.join(dir, 'games', g), { recursive: true });
  return dir;
}

export const removeStudio = dir => fs.rmSync(dir, { recursive: true, force: true });

/** Latest version number of a game in a studio (or examples/games when studio is omitted). */
export function latest(slug, studio) {
  const d = studio ? path.join(studio, 'games', slug) : path.join(EXAMPLES, slug);
  return Math.max(...fs.readdirSync(d).filter(f => /^v\d+$/.test(f)).map(f => Number(f.slice(1))));
}

/** Runs `node tools/<tool>.mjs ...args` in a studio. Resolves {code, out, ms}; never rejects. */
export function runTool(studio, tool, args = [], { timeout = 150_000 } = {}) {
  return runNode(path.join(studio, 'tools', `${tool}.mjs`), args, { cwd: studio, timeout });
}

/** Runs a node script. Resolves {code, out, ms}; never rejects. code is null on timeout. */
export function runNode(script, args = [], { cwd = REPO, timeout = 150_000 } = {}) {
  const t0 = Date.now();
  return new Promise(resolve => {
    const child = spawn(process.execPath, [script, ...args], { cwd, env: browserEnv() });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    const timer = setTimeout(() => { child.kill(); out += `\n[timed out after ${timeout} ms]`; }, timeout);
    child.on('close', code => { clearTimeout(timer); resolve({ code, out: out.trim(), ms: Date.now() - t0 }); });
  });
}

/** Run async jobs with at most `limit` at once (playtests are CPU-heavy; 3 is a good default). */
export async function pool(items, limit, fn) {
  const results = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; results[k] = await fn(items[k], k); }
  }));
  return results;
}
