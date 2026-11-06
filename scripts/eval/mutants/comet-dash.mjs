// Planted-bug mutants for comet-dash (latest v1). See ../mutate.mjs for the format.
import { replaceOnce } from '../mutate.mjs';

export default [
  {
    id: 'comet-dash-collision-disabled',
    kind: 'collision-disabled',
    description: 'The comet hitbox width uses minus instead of plus (q.s * 0.36 - CAT.w * 0.32), so it is always negative and comets pass straight through the cat.',
    apply: html => replaceOnce(html, 'hx = q.s * 0.36 + CAT.w * 0.32', 'hx = q.s * 0.36 - CAT.w * 0.32'),
  },
  {
    id: 'comet-dash-score-frozen',
    kind: 'score-frozen',
    description: 'The once-a-second score timer counts up instead of down (scoreTimer += dt), so survival points never fire and only star pickups can still add score.',
    apply: html => replaceOnce(html, 'scoreTimer -= dt;', 'scoreTimer += dt;'),
  },
  {
    id: 'comet-dash-gameover-unreachable',
    kind: 'gameover-unreachable',
    description: 'The comet hit handler writes gameOver; without parentheses, so the hit bursts and shakes but the run never ends.',
    apply: html => replaceOnce(html, 'gameOver(); return;', 'gameOver; return;'),
  },
  {
    id: 'comet-dash-control-ignored',
    kind: 'control-ignored',
    description: "Left movement checks the legacy key name 'Left' instead of the code 'ArrowLeft', so ArrowLeft (and the left touch button) does nothing.",
    apply: html => replaceOnce(html, "keyDown('ArrowLeft')", "keyDown('Left')"),
  },
  {
    id: 'comet-dash-console-error',
    kind: 'console-error',
    description: 'Game.init() gained a floor sanity check with its comparison inverted (CAT.y > view.h / 2), so it console.error()s on every init: boot, start and reset.',
    apply: html => replaceOnce(html, 'speed = 1; scoreTimer = 1;',
      "speed = 1; scoreTimer = 1;\n    if (CAT.y > view.h / 2) console.error('Comet Dash: cat spawned off the floor', CAT.y);"),
  },
  {
    id: 'comet-dash-fps-killer',
    kind: 'fps-killer',
    description: 'Game.update() re-rolls the twinkle table once per screen RGBA byte (view.w * view.h * 4 iterations, about 40 ms) instead of once per twinkle, every update.',
    apply: html => replaceOnce(html, 'speed = 1 + runTime * 0.07;',
      'speed = 1 + runTime * 0.07;\n    for (let k = 0; k < view.w * view.h * 4; k++) twinkles[k % 96] = Math.random();   // re-roll twinkle brightness'),
  },
  {
    id: 'comet-dash-restart-broken',
    kind: 'restart-broken',
    description: 'Engine-level (restart lives in the engine step()): the game-over restart delay has its operands swapped (overAt - clock > 0.6), so Space/Enter/tap never starts a new run after game over.',
    apply: html => replaceOnce(html, "scene === 'title' || clock - overAt > 0.6", "scene === 'title' || overAt - clock > 0.6"),
  },
];
