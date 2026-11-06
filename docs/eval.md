# Playtester eval: planted bugs

_Generated 2026-11-05 21:43 UTC by `npm run eval` (subset: --only comet-dash --mutants ../../../AppData/Local/Temp/claude/8d49dbd69061c094/1ee16d3b-fbef-4cff-a1d8-01d6519cbfc3/scratchpad/stub-mutants) in 0.9 min._

**Caught 1/1 planted bugs · 1 false FAIL on 1 clean game**

**Eval errors: 3 invalid mutant(s), 0 other error(s), see the end of this page.**

## How it works

Each sample game (`comet-dash`) gets planted bugs, "mutants", defined in `scripts/eval/mutants/<slug>.mjs`: small deterministic edits of the latest version's `index.html`, one per kind (`collision-disabled`, `score-frozen`, `gameover-unreachable`, `control-ignored`, `console-error`, `fps-killer`, `restart-broken`). For every mutant, and once for the unmodified game, the eval builds a throwaway studio with just that game, writes the mutated HTML over `games/<slug>/v<N>/index.html` and runs the real playtester (`studio-kit/tools/playtest.mjs`, headless Chromium, fake clock, seed 42) exactly as an agent would, with the game's own `scenario.json` and saved repros. A mutant is **caught** when the playtest FAILs; the clean games must PASS, a FAIL there is a **false FAIL**. Failed checks come from `playtest.json` (hard checks with `pass: false`, advisory replays ignored). A run that fails only the frame-rate check is re-run once, because parallel playtests compete for CPU (not for `fps-killer` mutants).

Reproduce: `npm install && npx playwright install chromium`, then `npm run eval` (3 playtests in parallel, about a minute each). Subsets: `npm run eval -- --only <slug>` or `--kind <kind>`; `--strict` also fails the exit code on misses.

## Clean games

| game | version | result | failed checks | time |
|---|---|---|---|---|
| comet-dash | v1 | ❌ false FAIL | A4 collecting a star gives +10 score | 53.9s |

## collision-disabled

_Planted: hazards no longer end the run._

_No valid mutants of this kind._

## score-frozen

_Planted: score never increases._

_No valid mutants of this kind._

## gameover-unreachable

_Planted: the run can never end._

_No valid mutants of this kind._

## control-ignored

_Planted: one listed control key does nothing._

_No valid mutants of this kind._

## console-error (1/1 caught)

_Planted: an error is logged when the game starts._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| comet-dash | `comet-dash-console-error` | stub: console.error on load | ✅ caught | loads without errors |

## fps-killer

_Planted: a busy loop per frame drops the frame rate._

_No valid mutants of this kind._

## restart-broken

_Planted: Space/Enter after game over does not start a new run._

_No valid mutants of this kind._

## Misses

None.

## Eval errors

- invalid mutant **comet-dash** `comet-dash-bad-anchor` (score-frozen): apply threw: anchor found 0 times
- invalid mutant **comet-dash** `comet-dash-noop` (restart-broken): apply returned the original unchanged
- invalid mutant **comet-dash** `comet-dash-badkind` (teleport): kind "teleport" is not one of: collision-disabled, score-frozen, gameover-unreachable, control-ignored, console-error, fps-killer, restart-broken
