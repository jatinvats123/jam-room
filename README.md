# Jam Room

Make tiny browser games with your friends by chatting in Discord. Three Switch agents
(designer, builder, playtester) turn the group's ideas into a playable link. Every approved
game gets its own room, friends iterate (v2, v3…), remix each other's games, and report bugs
that the agents reproduce and hotfix.

> Work in progress for the Flip the Switch hackathon. Full README lands in Phase 5.

## Quick start

Tested with **Switch Console 0.40.1** (core 0.31.0), **Node 20+**, Git, and a Discord
connection set up in Console (Home → Messaging apps).

1. **Studio folder** (where the agents work; published as the arcade):
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\setup-studio.ps1   # Windows → %USERPROFILE%\jam-studio
   ```
   ```bash
   ./scripts/setup-studio.sh                                            # macOS / Linux → ~/jam-studio
   ```
   It copies `studio-kit/` and `templates/jam-game-room.template.yaml`, installs Playwright's
   Chromium for the playtester, and makes the folder a git repo. Safe to re-run.
2. **Agents and the lobby room:** in Console, Templates → create from
   `templates/jam-room.template.yaml`, pick your Discord connection and the studio folder.
   - **Windows:** Console 0.40.1 can't create Claude Code agents from a template there, so first
     create `jam-designer`, `jam-builder` and `jam-playtester` by hand (Your Agents → +, Claude
     Code, directory = the studio). Paste each one's instructions from
     [docs/live-agent-instructions.md](docs/live-agent-instructions.md) and set its Addressing as
     shown. Then run the template and choose **Existing agent** for all three.
3. **Short names:** post one ordinary message in the new `#jam-room` channel, then:
   ```text
   !set-alias @jam-designer @designer
   !set-alias @jam-builder @builder
   !set-alias @jam-playtester @tester
   ```
   (Game rooms get these aliases automatically from their template.)
4. **Play:** `@designer new game: a penguin sliding down an icy hill, dodging snowmen` → reply
   `approve` → the designer opens `#game-<slug>`, where the builder builds, the playtester
   tests, and a human Allows the "Permission needed" card to publish. In the web client type
   the card's answer (e.g. `A1 1`) instead of clicking.
5. **Public links (optional):** add a GitHub remote to the studio and enable GitHub Pages
   (main, root). Without one, links are local: run `npm run serve` in the studio and open
   http://localhost:8080/.

After editing agent instructions, run `!reset-all-agents` in each room: a resumed session keeps
its old memory. Gotchas and design choices: [DECISIONS.md](DECISIONS.md).

## In a game room

- `@designer make it faster` → change list, `approve`, v<N+1>.
- `@tester bug: the penguin went through a snowman` → reproduced as a saved test → hotfix
  v<N+1> → re-tested (every saved bug test runs again on later versions) → published, with the
  reporter credited as bug hunter.
- `@designer remix Penguin Slide into a lava surfing game` → a new game that starts from the
  original's code, with its own room linked to the original (`remix of` / `remixed as`).
