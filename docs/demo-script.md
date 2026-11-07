# Demo video: recording plan + script (2:30 max)

Goal: judges see in 30 s that Switch is essential, watch a game get made from a spoken pitch,
and know they can reproduce it (JUDGING.md, `npm run verify`).

**Rule that makes this predictable:** every take is its own recording and doesn't depend on any
other take. If a take breaks, redo only that one. Waiting parts (build, playtest, Pages) get
sped up 4–8x in the edit, so don't worry about how long the agents take while recording.

---

## 0. Pre-flight (10 min, once)

- [ ] Charger plugged in, notifications off (Win+N → Do not disturb), Discord font large
      (Settings → Appearance → Chat font scaling 18–20 px)
- [ ] **Switch Console open**, Home shows the server running, Your Agents shows
      `jam-designer`, `jam-builder`, `jam-playtester-gpt` all **online**
- [ ] Terminal: `claude auth status` says logged in (if not: `claude auth login`)
- [ ] **Discord desktop app** logged in as you; second account (billusanda5808) logged in on
      the phone or in a browser profile
- [ ] Recording works: **Win+Alt+R** (Xbox Game Bar), or OBS at 1080p. Do a 5 s test clip.
- [ ] Wispr Flow running (hold Caps Lock to talk)
- [ ] In **each** room used today, type `!reset-all-agents`:
      `#jam-room`, `#game-monsoon-dash` (and the new game's room is fresh, so it needs nothing)

If an agent says "Sign in…": `claude auth login`. If Console says "Cannot reach the server":
close and reopen Console. If the card button doesn't work: type `A<n> 1`.

---

## Takes (record in this order, shortest/surest first)

### Take 1: Switch refuses a non-approver (1 min)
Who: **second account**, in `#game-monsoon-dash`.
> `@builder ship it`

Expect: Switch's own refusal ("You're not permitted to direct messages to me in this room").
Screenshot → `docs/media/refusal.png`.

### Take 2: Bug → reproduced → hotfix → side-by-side clip (8–12 min)
Who: **second account** on the **phone**, in `#game-monsoon-dash`.
1. Open https://jatinvats123.github.io/jam-studio-arcade/play/monsoon-dash/ on the phone, hold
   ◀ until the scooter rides onto the dark sidewalk at the edge. Take a phone screenshot.
2. In Discord (phone), attach the screenshot and send:
   > `@tester bug: my scooter rides off the road onto the sidewalk, and potholes appear on the sidewalk too. I'm Billu`

Expect, in order: "📸 got your screenshot" → repro saved → ❌ clip GIF → builder builds
v2 (the road clamps the scooter + hazards) → PASS + side-by-side GIF (v1 vs v2) → Permission
card → **you** tap **Allow** (desktop app) → live link with "🐛→✅ bug hunter: Billu".
Screenshot the GIF messages → `docs/media/caught-on-camera.png`.

- Use the friend's real display name instead of "Billu" (agents only see the username otherwise).
- If `#game-monsoon-dash` doesn't exist, do this take in whichever room Monsoon Dash was built in.
- If the Codex tester can't see the image or can't post the GIF: in that room run
  `!remove-alias @tester`, then `!set-alias @jam-playtester @tester`, `!reset-all-agents`, and redo.

### Take 3: Voice pitch → a brand-new game (12–15 min) — the hero take
Who: **you**, in `#jam-room` (lobby). Hold Caps Lock and **say** (Wispr types it):
> "@designer new game: a Diwali rocket climbs into the night sky, dodging kites and grabbing
> diyas for points. I'm Jatin."

Then, after the designer's plan:
> `@designer approve`

Expect: plan → new room `#game-diwali-rocket` (lobby gets a link) → builder builds v1 →
playtester (GPT · Codex) PASS + clip GIF → Permission card → **Allow** → live link.
**Then open the link on the phone and play for 10 s with the phone's own screen recorder on**
(Android: Quick settings → Screen record; iPhone: Control Centre → Screen Recording). Send
the clip to the laptop for the edit. No second phone needed.

### Take 4: A friend's change → v2, both credited (8–10 min)
Who: **second account**, in the new game's room:
> `@designer make the kites swoop side to side and add a golden diya worth 50`

Then **you**: `@designer approve` → build → PASS → **Allow** → v2 live. The arcade card credits
both of you.

### Take 5: Explain-it (1 min)
Who: **second account**, same room:
> `@designer explain how do the kites move?`

### Take 6: B-roll (5 min, no agents needed)
- Switch Console: **Your Agents** (Claude builder + Codex playtester side by side), Rooms,
  Templates
- Arcade on the phone: https://jatinvats123.github.io/jam-studio-arcade/ → the Comet Dash card
  ("remix of Cat vs Cucumbers") → its **📜 How this game was made** page
- Penguin Slide making-of page (hotfix + bug hunter):
  https://jatinvats123.github.io/jam-studio-arcade/games/penguin-slide/
- GitHub: `docs/SWITCH_FEATURES.md` table, the green CI badge
- Terminal: `npm run verify` scrolling (show the start and the "VERIFY PASS 20/20" line)

**Fallback footage if a live take keeps failing:** scroll the Discord history that already
exists: `#game-penguin-slide` (bug → hotfix v2), `#game-comet-dash` (remix), the monsoon-dash
jam in `#jam-room`. Real runs, already recorded in chat.

---

## Edit (Clipchamp, built into Windows 11) — shot list + voice-over

Record the voice-over after the edit (Clipchamp → Record & create → Audio, or Sound Recorder).
Read slowly; each line fits its slot.

| Time | Picture | Voice-over |
|---|---|---|
| 0:00–0:12 | Take 3: you speaking, the pitch appears, then (cut) the game running on the phone | "I said one sentence out loud. Twelve minutes later my friends were playing it on their phones." |
| 0:12–0:25 | Discord lobby, friends chatting | "Making a game with friends usually dies in the group chat. Someone has an idea, nobody builds it. Jam Room fixes that inside Discord." |
| 0:25–1:15 | Take 3, sped up: plan → `approve` → new room appears → build → GPT PASS + GIF → Permission card → Allow → link → phone | "Three Switch agents. The designer turns the pitch into a spec, and only after a human approves does it open a room just for this game. Claude Code builds it on my PC. A Codex agent from a different AI company playtests it, so the model that builds never grades its own work. Nothing goes public until a human taps Allow on Switch's permission card." |
| 1:15–1:35 | Take 4: friend's change → v2 → arcade card with both credits | "A friend asks for a change. It becomes version two, and both of us are credited." |
| 1:35–1:55 | Take 2: phone screenshot → ❌ GIF → side-by-side GIF → bug hunter badge | "My friend found a bug and sent a screenshot. The playtester turned it into a saved test, reproduced it on camera, and after the fix posted the same moves on the old and new version side by side." |
| 1:55–2:05 | Take 1: refusal; Take 5: explain answer | "Rules are enforced by Switch itself: a non-approver can't make the builder ship. Anyone can still ask how the game works." |
| 2:05–2:20 | B-roll: Console agents, SWITCH_FEATURES table, arcade remix lineage, verify PASS | "Rooms, room templates, links, mention handoffs, approval cards, two AI vendors in one room. Remove Switch and none of this works. Every claim is checked by one command: npm run verify." |
| 2:20–2:30 | Arcade page + repo URL on screen | "Jam Room. Built with Switch, dictated with Wispr Flow. Play the arcade and run it yourself from the repo." |

Export 1080p, upload to YouTube (unlisted is OK), paste the link into README ("Watch the demo")
and the submission form.
