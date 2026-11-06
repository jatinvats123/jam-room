# Playtester eval: planted bugs

_Generated 2026-11-06 12:50 UTC by `npm run eval` in 8.1 min._

**Caught 20/21 planted bugs · 0 false FAILs on 3 clean games**

## How it works

Each sample game (`cat-vs-cucumbers`, `penguin-slide`, `comet-dash`) gets planted bugs, "mutants", defined in `scripts/eval/mutants/<slug>.mjs`: small deterministic edits of the latest version's `index.html`, one per kind (`collision-disabled`, `score-frozen`, `gameover-unreachable`, `control-ignored`, `console-error`, `fps-killer`, `restart-broken`). For every mutant, and once for the unmodified game, the eval builds a throwaway studio with just that game, writes the mutated HTML over `games/<slug>/v<N>/index.html` and runs the real playtester (`studio-kit/tools/playtest.mjs`, headless Chromium, fake clock, seed 42) exactly as an agent would, with the game's own `scenario.json` and saved repros. A mutant is **caught** when the playtest FAILs; the clean games must PASS, a FAIL there is a **false FAIL**. Failed checks come from `playtest.json` (hard checks with `pass: false`, advisory replays ignored). A run that fails only the frame-rate check is re-run once, because parallel playtests compete for CPU (not for `fps-killer` mutants).

Reproduce: `npm install && npx playwright install chromium`, then `npm run eval` (3 playtests in parallel, about a minute each). Subsets: `npm run eval -- --only <slug>` or `--kind <kind>`; `--strict` also fails the exit code on misses.

## Clean games

| game | version | result | failed checks | time |
|---|---|---|---|---|
| cat-vs-cucumbers | v1 | ✅ PASS | - | 59.6s |
| penguin-slide | v2 | ✅ PASS | - | 69.3s |
| comet-dash | v1 | ✅ PASS | - | 42.4s |

## collision-disabled (3/3 caught)

_Planted: hazards no longer end the run._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-collision-disabled` | In the cucumber hit branch the early `return` was moved before `gameOver()`, so a hit plays the burst, shake and thud but the run never ends. | ✅ caught | A3 cucumber overlap ends the run |
| penguin-slide | `penguin-slide-collision-disabled` | The snowman branch of the hit test checks o.kind === 'snowmen' (plural typo; the kind is 'snowman'), so touching a snowman no longer ends the run while fish still score. | ✅ caught | A3 touching a snowman ends the run; [v1 repro-1] BUG 1: hugging the right wall should not let the pengu... |
| comet-dash | `comet-dash-collision-disabled` | The comet hitbox width uses minus instead of plus (q.s * 0.36 - CAT.w * 0.32), so it is always negative and comets pass straight through the cat. | ✅ caught | A3 comet overlapping the cat ends the run |

## score-frozen (3/3 caught)

_Planted: score never increases._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-score-frozen` | The per-second score timer is clamped at 0 with Math.max but then tested with `< 0`, so it never fires and the score stays 0. | ✅ caught | A1 score increases while playing |
| penguin-slide | `penguin-slide-score-frozen` | Both score calls now go through a new addPoints() helper whose guard checks scene === 'play' instead of 'playing', so neither the per-second tick nor fish pickups ever add score. | ✅ caught | A1 score increases while playing; A4 grabbing a fish adds +10 score and removes it |
| comet-dash | `comet-dash-score-frozen` | The once-a-second score timer counts up instead of down (scoreTimer += dt), so survival points never fire and only star pickups can still add score. | ✅ caught | A1 score increases while playing |

## gameover-unreachable (3/3 caught)

_Planted: the run can never end._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-gameover-unreachable` | A hit now pops the cucumber and decrements a new CAT.lives counter that init() never sets, so --CAT.lives is NaN, never reaches 0, and gameOver() is never called. | ✅ caught | A3 cucumber overlap ends the run |
| penguin-slide | `penguin-slide-gameover-unreachable` | Snowmen and fish now spawn just below the bottom edge (reading the spec's 'scroll up from the bottom') but keep their downward velocity, so every one is culled at once and nothing can ever reach the penguin. | ✅ caught | A4 grabbing a fish adds +10 score and removes it; A3 touching a snowman ends the run; [v1 repro-1] BUG 1: hugging the right wall should not let the pengu... |
| comet-dash | `comet-dash-gameover-unreachable` | The comet hit handler writes gameOver; without parentheses, so the hit bursts and shakes but the run never ends. | ✅ caught | A3 comet overlapping the cat ends the run |

## control-ignored (3/3 caught)

_Planted: one listed control key does nothing._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-control-ignored` | The movement code checks keyDown('Arrowleft') (lower-case l), which never matches a KeyboardEvent.code, so ArrowLeft does nothing (A still works). | ✅ caught | key ArrowLeft has an effect |
| penguin-slide | `penguin-slide-control-ignored` | The left-steer check uses the Unity-style key name keyDown('LeftArrow') instead of the KeyboardEvent.code 'ArrowLeft', so ArrowLeft (and the left touch button) does nothing; A still works. | ✅ caught | key ArrowLeft has an effect |
| comet-dash | `comet-dash-control-ignored` | Left movement checks the legacy key name 'Left' instead of the code 'ArrowLeft', so ArrowLeft (and the left touch button) does nothing. | ✅ caught | key ArrowLeft has an effect |

## console-error (3/3 caught)

_Planted: an error is logged when the game starts._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-console-error` | Game.init() restores saved cat settings with JSON.parse(localStorage.getItem('cvc-cat') \|\| ''), which throws on a fresh browser and is logged with console.error at boot and on every run start. | ✅ caught | loads without errors; 20 s random input, no exceptions |
| penguin-slide | `penguin-slide-console-error` | Game.init() now loads a saved penguin skin with JSON.parse(localStorage.getItem(...) \|\| ''), which throws on the empty fallback when nothing is saved, so a console.error is logged at boot and every time a run starts. | ✅ caught | loads without errors; 20 s random input, no exceptions |
| comet-dash | `comet-dash-console-error` | Game.init() gained a floor sanity check with its comparison inverted (CAT.y > view.h / 2), so it console.error()s on every init: boot, start and reset. | ✅ caught | loads without errors; 20 s random input, no exceptions |

## fps-killer (2/3 caught)

_Planted: a busy loop per frame drops the frame rate._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-fps-killer` | Game.update() computes a cosmetic fur-wobble value by summing 800,000 Math.sin samples every update (~40 ms of CPU per step), which tanks the frame rate. | ✅ caught | frame rate >= 30 fps |
| penguin-slide | `penguin-slide-fps-killer` | Game.draw() now starts with a busy-wait "frame pacing" loop that holds every frame for 40 ms, so the frame rate drops to roughly 20-25 fps. | ✅ caught | frame rate >= 30 fps; playtest ran to the end |
| comet-dash | `comet-dash-fps-killer` | Game.update() re-rolls the twinkle table once per screen RGBA byte (view.w * view.h * 4 iterations, about 40 ms) instead of once per twinkle, every update. | ❌ missed | - (PASS, 19/19 checks) |

## restart-broken (3/3 caught)

_Planted: Space/Enter after game over does not start a new run._

| game | mutant | what was planted | result | which checks caught it |
|---|---|---|---|---|
| cat-vs-cucumbers | `cat-vs-cucumbers-restart-broken` | Engine-level (step(), where restart lives): the game-over cooldown test is written `overAt - clock > 0.6` (operands swapped), so Space/Enter/tap after game over never starts a new run; title start and __jam.start() still work. | ✅ caught | restart from game over |
| penguin-slide | `penguin-slide-restart-broken` | Engine-level (restart lives in the engine's step()): the start condition uses && instead of \|\| (scene === 'title' && clock - overAt > 0.6), so Space/Enter/tap starts a run from the title but never from the game-over screen. | ✅ caught | restart from game over |
| comet-dash | `comet-dash-restart-broken` | Engine-level (restart lives in the engine step()): the game-over restart delay has its operands swapped (overAt - clock > 0.6), so Space/Enter/tap never starts a new run after game over. | ✅ caught | restart from game over |

## Misses

- **comet-dash** `comet-dash-fps-killer` (fps-killer): Game.update() re-rolls the twinkle table once per screen RGBA byte (view.w * view.h * 4 iterations, about 40 ms) instead of once per twinkle, every update.. The playtest passed all 19 hard checks.
