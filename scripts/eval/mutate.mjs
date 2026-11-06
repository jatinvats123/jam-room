// Planted-bug mutants for scripts/eval-playtest.mjs.
// Each game's file scripts/eval/mutants/<slug>.mjs exports default an array of:
//   { id: '<slug>-<kind>', kind, description, apply(html) -> mutatedHtml }
// kind is one of KINDS. apply must be deterministic and must throw if its anchor isn't found
// (use replaceOnce), so a mutant can never silently become a clean copy.
export const KINDS = [
  'collision-disabled',   // hazards no longer end the run
  'score-frozen',         // score never increases
  'gameover-unreachable', // the run can never end
  'control-ignored',      // one listed control key does nothing
  'console-error',        // an error is logged when the game starts
  'fps-killer',           // a busy loop per frame drops the frame rate
  'restart-broken',       // Space/Enter after game over doesn't start a new run
];

/** Replace exactly one occurrence of `find` (string or RegExp without /g); throws otherwise. */
export function replaceOnce(html, find, repl) {
  if (typeof find === 'string') {
    const n = html.split(find).length - 1;
    if (n !== 1) throw new Error(`anchor found ${n} times (need exactly 1): ${find.slice(0, 80)}`);
    return html.replace(find, () => repl);
  }
  const all = [...html.matchAll(new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g'))];
  if (all.length !== 1) throw new Error(`anchor found ${all.length} times (need exactly 1): ${find}`);
  return html.replace(find, repl);
}
