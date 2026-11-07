# Blog draft: outline + facts (dictate each section with Wispr, Claude polishes)

Judged on how much it helps a **first-time Switch user**. Keep it practical; every fact below
is true of the repo.

**Title idea:** "I built a Discord game studio with three Switch agents (and what tripped me up)"

## 1. What I built (3–4 sentences)
Jam Room: friends pitch a tiny browser game in Discord; a designer agent writes the spec, a
Claude Code builder writes one HTML file, a Codex (GPT) playtester plays it headlessly, and a
human taps Allow to publish it to GitHub Pages. Every approved game gets its own room.
Link the video + arcade.

## 2. Why Switch (the part a newcomer should copy)
- Rooms bridged to Discord channels; agents can create rooms from a YAML template
  (`create_room_from_yaml`) with aliases and a kickoff message.
- Agents hand off by @mention; Switch delivers the message and wakes the agent.
- Agents from two AI vendors (Claude Code + Codex) in one room, running on your own PC.
- Claude Code's permission prompts become a "Permission needed" card in Discord.
- Addressing rules are enforced by Switch: a non-approver is refused before the agent sees it.

## 3. Setup, step by step (copy from README Quick start)
Console 0.40.1, Node 20+, `setup-studio.ps1`, Codex CLI, template, aliases, first pitch.

## 4. Gotchas I hit (the most useful section)
- **Windows:** Console 0.40.1 can't create Claude Code agents from a template ("SDK sessions
  require a POSIX SSH execution host"). Create them in the New agent dialog, then choose
  **Existing agent** in the template.
- **Stale memory:** saving new instructions resumes the old session, so the agent acts on
  old rules. Run `!reset-all-agents` in each room after any instructions change.
- **Mentions wake agents:** a chatty "@designer" in a status line made the designer start an
  unrequested v2. Only put @mentions in deliberate handoff lines, first in the message.
- **Approval card in the Discord web client:** clicking the button didn't register; type the
  answer (e.g. `A1 1`) or use the desktop app.
- **`set-alias` refuses a used alias:** `!remove-alias @tester` first.
- **Codex sandbox on Windows** can't read `%LOCALAPPDATA%\ms-playwright` → `spawn EPERM`;
  keep Chromium in the project folder.
- **Signed-out CLIs:** agents said "Sign in on the execution machine" overnight →
  `claude auth login`.
- **Usernames vs display names:** agents see usernames; say your display name in the pitch.

## 5. Making it trustworthy
Deterministic playtests (seed 42, paused fake clock), saved bug repros replayed on every later
version, GIF clips of the same runs, `npm run verify` 20/20 and a mutation eval on CI.

## 6. Built by voice
Prompts, agent instructions and game pitches were dictated with Wispr Flow. Add your Insights
numbers here.

## 7. Try it
Repo link, arcade link, "star Switch".
