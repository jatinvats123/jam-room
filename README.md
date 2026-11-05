# Jam Room

Make tiny browser games with your friends by chatting in Discord. Three Switch agents
(designer, builder, playtester) turn the group's ideas into a playable link. Every approved
game gets its own room, friends iterate (v2, v3…), remix each other's games, and report bugs
that the agents reproduce and hotfix.

## Features

- **Design by chat:** the designer gathers everyone's ideas into a spec, a human replies
  `approve`, and the game gets its own `#game-<slug>` room.
- **Build, test, publish:** the builder writes one HTML file, the playtester plays it headlessly
  against the spec, and a human Allows the publish card. Links go to the arcade.
- **Cross-vendor playtesting:** the builder is Claude Code and the playtester runs on Codex (GPT)
  by default, so the model that builds never grades its own work.
- **Versions, remixes, bug hunts:** changes become v<N+1>; `bug: …` becomes a saved repro test
  and a hotfix crediting the reporter; remixes start from the original's code.
- **"How this game was made" pages:** a timeline per game, built only from files the agents
  already wrote.
- **Explain-it mode:** anyone can ask the builder how part of the game works.

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
   tests, and a human Allows the "Permission needed" card to publish. In the web client type
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
- `@builder explain how does the jump work?` → explain-it mode (below).

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

Anyone can ask `@builder explain how does the jump work?`. The builder reads the game's latest
version and answers in plain language in at most 8 lines (what the code does, then one idea to
try changing), with at most one code block of up to 8 lines copied from the game. It changes no
files. The builder's addressing is "anyone" so humans can reach it, but it only builds when the
designer, the playtester or the room owner asks; any other request from a human gets pointed to
the designer.
