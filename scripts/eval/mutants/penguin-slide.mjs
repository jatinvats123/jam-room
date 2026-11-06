// Planted-bug mutants for penguin-slide (applied to the latest version, v2/index.html).
// Format and kinds: see ../mutate.mjs.
import { replaceOnce } from '../mutate.mjs';

export default [
  {
    id: 'penguin-slide-collision-disabled',
    kind: 'collision-disabled',
    description: "The snowman branch of the hit test checks o.kind === 'snowmen' (plural typo; the kind is 'snowman'), so touching a snowman no longer ends the run while fish still score.",
    apply: html => replaceOnce(html,
      "} else {\n          burst(P.x, P.y",
      "} else if (o.kind === 'snowmen') {\n          burst(P.x, P.y"),
  },
  {
    id: 'penguin-slide-score-frozen',
    kind: 'score-frozen',
    description: "Both score calls now go through a new addPoints() helper whose guard checks scene === 'play' instead of 'playing', so neither the per-second tick nor fish pickups ever add score.",
    apply: html => {
      html = replaceOnce(html, 'const WALL_PAD = 50;\n',
        "const WALL_PAD = 50;\n// only award points mid-run (never after the splat)\nconst addPoints = n => { if (scene === 'play') addScore(n); };\n");
      html = replaceOnce(html, 'addScore(1); beep(660', 'addPoints(1); beep(660');
      return replaceOnce(html, 'addScore(10);', 'addPoints(10);');
    },
  },
  {
    id: 'penguin-slide-gameover-unreachable',
    kind: 'gameover-unreachable',
    description: "Snowmen and fish now spawn just below the bottom edge (reading the spec's 'scroll up from the bottom') but keep their downward velocity, so every one is culled at once and nothing can ever reach the penguin.",
    apply: html => replaceOnce(html, 'things.push({ x, y: -s, s,', 'things.push({ x, y: view.h + s, s,'),
  },
  {
    id: 'penguin-slide-control-ignored',
    kind: 'control-ignored',
    description: "The left-steer check uses the Unity-style key name keyDown('LeftArrow') instead of the KeyboardEvent.code 'ArrowLeft', so ArrowLeft (and the left touch button) does nothing; A still works.",
    apply: html => replaceOnce(html, "keyDown('ArrowLeft')", "keyDown('LeftArrow')"),
  },
  {
    id: 'penguin-slide-console-error',
    kind: 'console-error',
    description: "Game.init() now loads a saved penguin skin with JSON.parse(localStorage.getItem(...) || ''), which throws on the empty fallback when nothing is saved, so a console.error is logged at boot and every time a run starts.",
    apply: html => replaceOnce(html,
      'P = { x: view.w / 2, y: view.h - 110, w: 46, h: 54, vx: 0, tilt: 0, wob: 0 };\n',
      'P = { x: view.w / 2, y: view.h - 110, w: 46, h: 54, vx: 0, tilt: 0, wob: 0 };\n' +
      "    try { P.skin = JSON.parse(localStorage.getItem('penguin-slide:skin') || ''); }\n" +
      "    catch (e) { console.error('Penguin Slide: could not load saved skin', e); }\n"),
  },
  {
    id: 'penguin-slide-fps-killer',
    kind: 'fps-killer',
    description: 'Game.draw() now starts with a busy-wait "frame pacing" loop that holds every frame for 40 ms, so the frame rate drops to roughly 20-25 fps.',
    apply: html => replaceOnce(html,
      'draw(c) {\n    // icy gradient backdrop',
      'draw(c) {\n    // steady frame pacing on fast screens: hold each frame for ~40 ms\n' +
      '    const holdUntil = performance.now() + 40; while (performance.now() < holdUntil) {}\n' +
      '    // icy gradient backdrop'),
  },
  {
    id: 'penguin-slide-restart-broken',
    kind: 'restart-broken',
    description: "Engine-level (restart lives in the engine's step()): the start condition uses && instead of || (scene === 'title' && clock - overAt > 0.6), so Space/Enter/tap starts a run from the title but never from the game-over screen.",
    apply: html => replaceOnce(html,
      "if (scene === 'title' || clock - overAt > 0.6) { startRun();",
      "if (scene === 'title' && clock - overAt > 0.6) { startRun();"),
  },
];
