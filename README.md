# Jam Room

[![verify](https://github.com/jatinvats123/jam-room/actions/workflows/verify.yml/badge.svg)](https://github.com/jatinvats123/jam-room/actions/workflows/verify.yml)
· **Check every claim yourself:** [JUDGING.md](JUDGING.md) (`npm run verify`, no Discord or Switch needed)
· **Playtester eval:** [docs/eval.md](docs/eval.md)
· **Remove Switch and this breaks:** [docs/SWITCH_FEATURES.md](docs/SWITCH_FEATURES.md)

Make tiny browser games with your friends by chatting in Discord. Three Switch agents
(designer, builder, playtester) turn the group's ideas into a playable link. Every approved
game gets its own room, friends iterate (v2, v3…), remix each other's games, and report bugs
that the agents reproduce and hotfix.

## Caught on camera

![Penguin Slide: a friend's wall-hugging bug on v1 (left) and the same moves on the v2 hotfix (right)](examples/games/penguin-slide/v2/fix-1.gif)

A friend reported in Discord that hugging the right wall dodges every snowman. This replays the playtester's saved repro on v1 (left: still alive after 30 s, the bug) and on the hotfix v2 (right: caught); the playtester posts clips like it in Discord through Switch.
Each clip is the same deterministic run as the test (seed 42, fake clock), made by [`studio-kit/tools/clip.mjs`](studio-kit/tools/clip.mjs) and checked by `npm run verify`.

## Features

- **Design by chat:** the designer gathers everyone's ideas into a spec, a human replies
  `approve`, and the game gets its own `#game-<slug>` room.
- **Build, test, publish:** the builder writes one HTML file, the playtester plays it headlessly
  against the spec, and a human Allows the publish card. Links go to the arcade.
- **Cross-vendor playtesting:** the builder is Claude Code and the playtester runs on Codex (GPT)
  by default, so the model that builds never grades its own work.
- **Versions, remixes, bug hunts:** changes become v<N+1>; `bug: …` becomes a saved repro test
  and a hotfix crediting the reporter; remixes start from the original's code.
- **Caught on camera:** after a PASS the playtester posts a GIF of its own test run in Discord; a
  reproduced bug gets a ❌ clip and the hotfix a side-by-side "same moves, v1 vs v2" clip.
- **"How this game was made" pages:** a timeline per game, built only from files the agents
  already wrote.
- **Explain-it mode:** anyone can ask the designer how part of the game works.
- **Switch enforces the rules:** only approvers can direct the builder or answer its publish
  card. Anyone else gets Switch's own refusal, not a prompt's polite no.

## Why Switch

Jam Room has no server of its own: every row below is Switch doing the work. **Enforced by
Switch** means the rule holds even if an agent's instructions are ignored or rewritten. The full
map (every feature → file:line → what breaks without it, plus what Switch *doesn't* do here) is
[docs/SWITCH_FEATURES.md](docs/SWITCH_FEATURES.md).

| What happens | Switch feature | Enforced by Switch? |
|---|---|---|
| Only approvers (the host + named friends) and the owner's agents can direct `@builder`; anyone else gets *"You're not permitted to direct messages to me in this room"* | Addressing policy, custom rule (Console) | ✅ Switch refuses before the agent sees it |
| Only approvers can answer the 🚀 publish card, so nothing goes public without one | Approval requests (who may answer = who may address) | ✅ Switch |
| A game goes public only after a human taps Allow | Claude Code permission → "Permission needed" card in Discord | ✅ Switch + the studio's `.claude/settings.json` ask rule |
| Credits and "bug hunter" names follow the person, not the name they type | Stable sender ids from `read_context` / `list_participants` → `people.json` | ✅ ids come from Switch; the name each id maps to is the designer's job |
| Each approved game gets its own channel, aliases and kickoff | Agent-run room templates (`create_room_from_yaml`) | ✅ Switch |
| Lobby ↔ game ↔ remix navigation | Room links | ✅ Switch |
| Designer → builder → playtester handoffs | @mention addressing between agents | ✅ Switch delivers; who hands off when is in the instructions |
| Claude Code builds, Codex (GPT) tests, on your own PC | Console-managed agents, two providers | ✅ Switch |
| Plans need a human `approve`; only agents may ask for a `test` | Instructions | ❌ prompt (Switch can't tell a message's intent apart) |

## Quick start

Tested with **Switch Console 0.40.1** (core 0.31.0), **Node 20+**, Git, **Codex CLI 0.166.0**,
**Playwright 1.64.1** (pinned in the studio's package.json), and a Discord connection set up in
Console (Home → Messaging apps).

1. **Studio folder** (where the agents work; published as the arcade):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\setup-studio.ps1   # Windows → %USERPROFILE%\jam-studio
   ```
   ```bash
   ./scripts/setup-studio.sh                                            # macOS / Linux → ~/jam-studio
   ```
   It copies `studio-kit/` and `templates/jam-game-room.template.yaml`, downloads headless
   Chromium (~700 MB) into `<studio>\.browsers` for the playtester, and makes the folder a git
   repo. Safe to re-run. Pick another folder with `-Target <dir>` (PowerShell) or the first
   argument (setup-studio.sh); the default is `%USERPROFILE%\jam-studio`.
2. **Codex CLI** (for the GPT playtester):
   ```powershell
   npm i -g @openai/codex
   codex login        # a ChatGPT login works, or use an API key
   ```
   Console should then show "Codex · Signed in". Without Codex the template's playtester falls
   back to Claude Code.
3. **Agents and the lobby room:** in Console, Templates → create from
   `templates/jam-room.template.yaml`, pick your Discord connection and the studio folder.
   - **Windows:** Console 0.40.1 can't create Claude Code agents from a template there, so first
     create the agents by hand (Your Agents → +, directory = the studio):
     `jam-designer` and `jam-builder` (Claude Code), and `jam-playtester-gpt` (provider Codex,
     Who can talk = Anyone). Generate the copy-paste instructions for that set:
     ```powershell
     node scripts/live-instructions.mjs --tester jam-playtester-gpt
     ```
     Paste each block from [docs/live-agent-instructions.md](docs/live-agent-instructions.md) and
     set its Addressing as shown. Then run the template and choose **Existing agent** for all
     three.
   - **Approvers (any OS):** the template gives the builder `owner-agents`. To let a friend
     publish too, open Your Agents → `jam-builder` → Who can talk to this agent → **Custom**,
     one rule: Rooms Any, Room groups Any, Users **Specific** = Me + the friend's chat
     username, Agents = My agents. Everyone else who @mentions the builder is refused by
     Switch and can't answer its publish card.
4. **Short names:** post one ordinary message in the new `#jam-room` channel, then:
   ```text
   !set-alias @jam-designer @designer
   !set-alias @jam-builder @builder
   !set-alias @jam-playtester-gpt @tester
   ```
   (Game rooms get these aliases automatically from their template; the designer passes the
   playtester's name, so `@tester` points to the GPT agent there too.)
5. **Play:** `@designer new game: a penguin sliding down an icy hill, dodging snowmen` → reply
   `approve` → the designer opens `#game-<slug>`, where the builder builds, the playtester
   tests, and an approver Allows the "Permission needed" card to publish. In the web client type
   the card's answer (e.g. `A1 1`) instead of clicking. A playtest passes only after the
   playtester writes `games/<slug>/v<N>/scenario.json` from the spec's Acceptance list; a cold
   first run can take up to ~150 s.
6. **Public links (optional):** add a GitHub remote to the studio and enable GitHub Pages
   (main, root). Without one, links are local: run `npm run serve` in the studio and open
   http://localhost:8080/.

After editing agent instructions, run `!reset-all-agents` in each room: a resumed session keeps
its old memory. After editing the template, `node scripts/live-instructions.mjs --check` confirms
`docs/live-agent-instructions.md` still matches it (on the Windows path, generate with
`--tester jam-playtester-gpt`). Gotchas and design choices: [DECISIONS.md](DECISIONS.md).

## In a game room

- `@designer make it faster` → change list, `approve`, v<N+1>.
- `@tester bug: the penguin went through a snowman` → reproduced as a saved test → hotfix
  v<N+1> → re-tested (every saved bug test runs again on later versions) → published, with the
  reporter credited as bug hunter.
- `@designer remix Penguin Slide into a lava surfing game` → a new game that starts from the
  original's code, with its own room linked to the original (`remix of` / `remixed as`).
- `@designer explain how does the jump work?` → explain-it mode (below).

## Cross-vendor playtesting

The template's `tester_provider` param defaults to `[codex, claude]`: the playtester runs on
Codex (GPT) and falls back to Claude Code where Codex isn't installed. The builder is always
Claude Code, so a second AI company's model checks every build. `playtest.json` records which
one ran it (`runner`: "GPT · Codex" or "Claude", detected from the environment each CLI sets).

**Moving an existing room to the GPT playtester** (Windows / hand-made agents): create
`jam-playtester-gpt` as in Quick start, regenerate and re-paste the instructions with
`--tester jam-playtester-gpt`, then in each room:

```text
!invite-agent @jam-playtester-gpt
!remove-alias @tester
!set-alias @jam-playtester-gpt @tester
!reset-all-agents
```

(`set-alias` refuses an alias that is already in use, hence `remove-alias` first.)

**Fallback:** run `node scripts/live-instructions.mjs` without `--tester`, re-paste the designer
and builder blocks, and point `@tester` back at `jam-playtester` (Claude).

**Gotcha:** Codex's Windows sandbox runs commands as a restricted user that can't read
`%LOCALAPPDATA%\ms-playwright`, so Chromium failed with `spawn EPERM`. Setup therefore installs
Chromium into the studio's `.browsers/` folder (gitignored), and `tools/playtest.mjs` uses it
automatically when it exists. Re-run setup if an older studio lacks `.browsers/`.

## "How this game was made" pages

`tools/build-arcade.mjs` writes `games/<slug>/index.html` for every game, and each arcade card
links to it ("📜 How this game was made"). The timeline is built only from files that already
exist, so no agent does extra work:

- the spec's front matter (credits, `approved_by`, `remix_of`) and its
  `## v<N> changes (asked by …)` blocks,
- `NOTES.md` per version, including the builder's `hotfix:` line,
- bug repro files (`repro-<k>.json`) and `playtest.json` (checks, fps, and its `runner`),
- screenshots and the studio's git `publish <slug> v<N>` commits.

A missing field just drops its line. Example:
https://jatinvats123.github.io/jam-studio-arcade/games/penguin-slide/

## Explain-it mode

Anyone can ask `@designer explain how does the jump work?`. The designer (addressing: anyone)
reads the game's latest version and answers in plain language in at most 8 lines (what the code
does, then one idea to try changing), with at most one code block of up to 8 lines copied from
the game. It changes no files. Explaining lives on the designer, not the builder, so the builder
can stay locked to approvers.
