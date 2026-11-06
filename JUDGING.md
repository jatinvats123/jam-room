# Judging guide: check every claim yourself

Everything in part 1 runs on a clean clone with **no Discord, no Switch and no credentials**.
You need Node 20+ and about 300 MB of disk for headless Chromium.

```bash
git clone https://github.com/jatinvats123/jam-room && cd jam-room
npm ci
npx playwright install chromium
npm run verify      # about 2-3 min: one PASS/FAIL line per claim, exit code 0 = all pass
npm run eval        # about 5-10 min: the playtester against planted bugs, writes docs/eval.md
```

CI runs both on every push: [.github/workflows/verify.yml](.github/workflows/verify.yml).

## 1. Claims you can check offline

The sample games in [examples/games/](examples/games/) were copied unedited from the live
studio. Agents wrote them in Discord: the spec, the code, the playtest scenario and the bug repro.

| README claim | Command that proves it | Expected output |
|---|---|---|
| Every game is one self-contained HTML file with no network requests and the `__jam` test hook | `npm run verify` (claim: check) | `PASS check …` for all 3 sample games |
| The playtester really plays the game headlessly against the spec, it doesn't just read the code | `npm run verify` (claim: playtest) | `PASS playtest …` ×3 (19-20 checks each, about 60 fps) |
| A player's `bug:` becomes a saved test that fails on the buggy version and passes on the hotfix, and every later version replays it | `npm run verify` (claim: repro) | `PASS repro …` (penguin-slide v1 fails `repro-1`, v2 passes it) |
| A remix starts from the original's code | `npm run verify` (claim: remix) | `PASS remix …` (`new-version --from` copies the original's latest version, and it passes `check`) |
| Versions: a change becomes v<N+1> | `npm run verify` (claim: new version) | `PASS … new version` |
| The arcade and the "How this game was made" pages are built only from files the agents wrote | `npm run verify` (claim: arcade / making-of) | `PASS arcade …` and `PASS making-of …` |
| The setup is reproducible from the Switch templates | `npm run verify` (claim: templates) | `PASS templates parse …` |
| The Console instructions match the template | `node scripts/live-instructions.mjs --check` | `LIVE INSTRUCTIONS MATCH TEMPLATE` |
| The playtester catches real bugs and doesn't cry wolf | `npm run eval` | headline `Caught X/Y planted bugs · Z false FAILs` in [docs/eval.md](docs/eval.md) |

## 2. Claims that need live Discord + Switch

These need the agents running, so here is where to see them.

| Claim | Evidence |
|---|---|
| Switch itself refuses a non-approver who @mentions the builder ("You're not permitted to direct messages to me in this room…") | [docs/media/refusal.png](docs/media/refusal.png) · video TBD |
| Only approvers can answer the 🚀 "Permission needed" publish card, and nothing goes public without it | screenshot TBD · video TBD |
| An approved plan opens its own `#game-<slug>` room, from a template the designer runs (`create_room_from_yaml`) | video TBD |
| Designer → builder → playtester hand off by @mention, and FAIL goes back to the builder with the failed checks | video TBD |
| A friend's `@tester bug: …` becomes a repro → hotfix → publish with "bug hunter" credit | video TBD · result on the live arcade: https://jatinvats123.github.io/jam-studio-arcade/games/penguin-slide/ |
| Credits follow the Switch sender id, not the typed name (`people.json`) | video TBD |
| Cross-vendor: the Codex (GPT) playtester tests what Claude Code built (`playtest.json` records `runner`; the bundled samples predate that field) | video TBD |
| Live public arcade, playable on a phone | https://jatinvats123.github.io/jam-studio-arcade/ |

## What isn't covered

- `npm run verify` doesn't exercise Switch itself: rooms, addressing and approval cards need a
  Switch server and a Discord connection (see README Quick start).
- Playtests use Playwright's fake clock with seed 42, so they're deterministic. Only the fps check
  runs on real time, so a very slow or overloaded machine can fail "frame rate >= 30 fps".
