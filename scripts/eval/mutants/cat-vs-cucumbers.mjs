// Planted-bug mutants for examples/games/cat-vs-cucumbers/v1/index.html (see ../mutate.mjs).
import { replaceOnce } from '../mutate.mjs';

const HIT = "shake(14); beep(140, 380, 'sawtooth', 0.14, 40); gameOver(); return;";

export default [
  {
    id: 'cat-vs-cucumbers-collision-disabled',
    kind: 'collision-disabled',
    description: 'In the cucumber hit branch the early `return` was moved before `gameOver()`, so a hit plays the burst, shake and thud but the run never ends.',
    apply: html => replaceOnce(html, HIT, "shake(14); beep(140, 380, 'sawtooth', 0.14, 40); return; gameOver();"),
  },
  {
    id: 'cat-vs-cucumbers-gameover-unreachable',
    kind: 'gameover-unreachable',
    description: 'A hit now pops the cucumber and decrements a new CAT.lives counter that init() never sets, so --CAT.lives is NaN, never reaches 0, and gameOver() is never called.',
    apply: html => replaceOnce(html, HIT,
      "shake(14); beep(140, 380, 'sawtooth', 0.14, 40); cukes.splice(i, 1);\n" +
      "        if (--CAT.lives <= 0) { gameOver(); return; }   // 3 lives\n" +
      '        continue;'),
  },
  {
    id: 'cat-vs-cucumbers-score-frozen',
    kind: 'score-frozen',
    description: 'The per-second score timer is clamped at 0 with Math.max but then tested with `< 0`, so it never fires and the score stays 0.',
    apply: html => {
      html = replaceOnce(html, 'scoreTimer -= dt;', 'scoreTimer = Math.max(0, scoreTimer - dt);');
      return replaceOnce(html, 'if (scoreTimer <= 0)', 'if (scoreTimer < 0)');
    },
  },
  {
    id: 'cat-vs-cucumbers-control-ignored',
    kind: 'control-ignored',
    description: "The movement code checks keyDown('Arrowleft') (lower-case l), which never matches a KeyboardEvent.code, so ArrowLeft does nothing (A still works).",
    apply: html => replaceOnce(html, "keyDown('ArrowLeft')", "keyDown('Arrowleft')"),
  },
  {
    id: 'cat-vs-cucumbers-console-error',
    kind: 'console-error',
    description: "Game.init() restores saved cat settings with JSON.parse(localStorage.getItem('cvc-cat') || ''), which throws on a fresh browser and is logged with console.error at boot and on every run start.",
    apply: html => replaceOnce(html, 'cukes = []; spawnIn = 0.6; speed = 1; scoreTimer = 1;',
      'cukes = []; spawnIn = 0.6; speed = 1; scoreTimer = 1;\n' +
      "    try { Object.assign(CAT, JSON.parse(localStorage.getItem('cvc-cat') || '')); }\n" +
      "    catch (e) { console.error('Could not restore cat settings:', e.message); }"),
  },
  {
    id: 'cat-vs-cucumbers-fps-killer',
    kind: 'fps-killer',
    description: 'Game.update() computes a cosmetic fur-wobble value by summing 800,000 Math.sin samples every update (~40 ms of CPU per step), which tanks the frame rate.',
    apply: html => replaceOnce(html, 'speed = 1 + runTime * 0.08;',
      'speed = 1 + runTime * 0.08;\n' +
      '    let wob = 0; for (let k = 0; k < 8e5; k++) wob += Math.sin(runTime * 9 + k * 1e-4);   // fur wobble, finely sampled\n' +
      '    CAT.wob = wob / 8e5;'),
  },
  {
    id: 'cat-vs-cucumbers-restart-broken',
    kind: 'restart-broken',
    description: 'Engine-level (step(), where restart lives): the game-over cooldown test is written `overAt - clock > 0.6` (operands swapped), so Space/Enter/tap after game over never starts a new run; title start and __jam.start() still work.',
    apply: html => replaceOnce(html, "if (scene === 'title' || clock - overAt > 0.6) {", "if (scene === 'title' || overAt - clock > 0.6) {"),
  },
];
