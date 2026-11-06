# Switch features: what Jam Room uses, and what breaks without it

Jam Room has no server, bot or database of its own. Each row below is a Switch feature the
project really uses, the exact place it is wired in, and what stops working if you take Switch
away. **Enforced by** says who makes the rule hold:
- **Switch:** the rule holds even if an agent's instructions are ignored or rewritten.
- **our code:** a script in this repo.
- **prompt:** agent instructions only.

Line numbers point at [`templates/jam-room.template.yaml`](../templates/jam-room.template.yaml)
(written `lobby:NN`) and [`templates/jam-game-room.template.yaml`](../templates/jam-game-room.template.yaml)
(written `game:NN`) unless a file is named. Demo timestamps are filled in after the Phase 5 recording.

| # | Switch feature | Where (file:line / template key) | What Jam Room does with it | What breaks without Switch | Enforced by | Demo |
|---|---|---|---|---|---|---|
| 1 | **Rooms bridged to a chat app** | `lobby:346-372` (`room:` with `bridge`, `users: ["{$creator}"]`, room `instructions`); `lobby:48-51` (`bridge` param) | The `#jam-room` lobby is one Switch room mirrored to a Discord channel, where friends and all three agents read the same thread | No shared space where humans and coding agents talk. You'd need your own Discord bot, message router and session store | Switch | TBD |
| 2 | **Agent-created rooms** (`create_room_from_yaml`) | `lobby:103-120` (designer step 6a); the whole of `jam-game-room.template.yaml`; copied into the studio by [`scripts/setup-studio.ps1:35-37`](../scripts/setup-studio.ps1) / [`setup-studio.sh:29-30`](../scripts/setup-studio.sh) | After a human approves, the designer runs the game-room template, and Switch creates `#game-<slug>` with its own Discord channel, agents, aliases, instructions, and a kickoff that starts the build (`game:74-78`) | Every game would share one channel, and the builder would have no per-game workshop or automatic kickoff. A human would create each channel and invite each agent by hand | Switch creates the room. *When* (only after a human approve) is the prompt | TBD |
| 3 | **Room links + cross-room posting** | `lobby:111-112` (lobby ↔ game), `lobby:137-139` (original ↔ remix), `lobby:252-257` (builder: `list_linked_rooms` → `connect_to_room(lobby)` → `post_message` → back) | Lobby ↔ game ↔ remix navigation (`game: <Title>` / `lobby` / `remix of` / `remixed as`) and the "▶ Now playing" note the builder posts back in the lobby | No navigation between the lobby, games and remixes, and the builder couldn't find the lobby to announce a release | Switch stores the links. Labels and when to post are the prompt | TBD |
| 4 | **Aliases** | `lobby:352-355`, `game:56-59` (`aliases:`); lobby set once with `!set-alias` ([README.md:86-91](../README.md)) | Friends type `@designer`, `@builder`, `@tester`. `@tester` was moved from the Claude playtester to the Codex one without renaming anything ([README.md:130-137](../README.md)) | People type `@jam-playtester-gpt`. Swapping the playtester's vendor means retraining everyone | Switch | TBD |
| 5 | **Multi-agent @mention handoff** | Builder → tester `lobby:215-216`, `lobby:225`, `lobby:229`; tester → builder `lobby:307-311` (PASS "ship it" / FAIL "fix"), `lobby:332-334` (hotfix); builder → designer `lobby:229-231`; room kickoff `game:75` | Designer → builder → playtester → builder runs with no human relaying: build, test, fix (max 2 rounds), ship, hotfix | Agents don't wake each other, so a human copies every message between three terminals | Switch delivers and wakes. *Who hands off when* is the prompt (mention first in the message, `lobby:307-308`) | TBD |
| 6 | **Console-managed coding agents, two vendors** | `provider: claude` at `lobby:59`, `lobby:183`; `provider: "{tester_provider}"` at `lobby:276` with param `lobby:35-42` (`[codex, claude]`); `directory: "{studio}"` at `lobby:61`, `lobby:185`, `lobby:278`; vendor recorded at [`studio-kit/tools/playtest.mjs:286`](../studio-kit/tools/playtest.mjs) (`runner`) | Real Claude Code (designer, builder) and Codex/GPT (playtester) sessions run on the owner's PC in the studio folder and edit real files. The model that builds never grades its own work | No coding agents reachable from chat at all, and no cross-vendor check. You'd have to run, sign in, restart and route two CLIs yourself | Switch | TBD |
| 7 | **Addressing policy + Switch's own refusals** | Builder `addressing: owner-agents` + Console custom rule at `lobby:177-182`; designer `anyone` at `lobby:58`; playtester `anyone` at `lobby:271-275`; the Console rule is printed into [`docs/live-agent-instructions.md:126`](live-agent-instructions.md) by [`scripts/live-instructions.mjs:32-36`](../scripts/live-instructions.mjs); the builder reads its own approvers with `get_agent_detail` (`lobby:236-240`) | Only the owner's agents and the named approvers can direct `@builder`. Anyone else gets *"You're not permitted to direct messages to me in this room…"* from Switch, before the agent sees the message. The designer explains the refusal (`lobby:163-167`) | Any friend types "@builder ship it" and it ships. The only guard would be a polite prompt, and prompts can be talked around | **Switch** (the builder rule). The playtester's "only agents may ask for `test`" (`lobby:282-284`) is the prompt, because addressing judges the sender, not the message | TBD (screenshot `docs/media/refusal.png` after the U1 smoke test) |
| 8 | **Native approval card** ("Permission needed") | [`studio-kit/.claude/settings.json:3`](../studio-kit/.claude/settings.json) (`ask` rule on `node tools/publish.mjs`), installed by [`setup-studio.ps1:28-29`](../scripts/setup-studio.ps1) / [`setup-studio.sh:24`](../scripts/setup-studio.sh); the card's title is the command description at `lobby:241-244` | Publishing pauses on a Discord card ("🚀 Publish <Title> v<N> to the public arcade"). Nothing goes public until an approver taps Allow (or types `A1 1` on web Discord) | Publishing would just run. An agent-written "approve?" in chat could be answered by anyone, or skipped | **Switch** + Claude Code's permission rule. Who may answer = who may address (row 7) | TBD |
| 9 | **Stable sender identity** | `read_context` → `sender` / `sender_name` at `lobby:73-83` and `lobby:332-336`; human-only approvals via `list_participants` at `lobby:97-98`; `people.json` created by [`setup-studio.ps1:41`](../scripts/setup-studio.ps1) / [`setup-studio.sh:33`](../scripts/setup-studio.sh) | Credits, `approved_by`, "asked by" and "bug hunter" follow the person's Switch id, mapped once to the name they choose. An agent's "approve" never counts | Credits follow whatever name someone types ("Jatin says approve"), and an agent could approve its own plan | Switch provides the ids and participant types. The id → name map is the prompt (designer only) | TBD |
| 10 | **Templates** (`params`, `allow_existing`, `kickoff`) | `lobby:21-51` (params: crew, studio, tester_provider, location, bridge); `allow_existing: true` at `lobby:55`, `lobby:174`, `lobby:269`; kickoff `lobby:374-379` | One file recreates the three agents, the lobby room, aliases and the welcome. `allow_existing` reuses hand-made agents on Windows, where Console can't create Claude Code agents from a template | Setup becomes a page of manual Console clicks per machine, with no reproducible definition to put in git | Switch | TBD |
| 11 | **`!reset-all-agents`** | The designer tells people to use it at `lobby:160-162`; setup note in [README.md:104-107](../README.md); header of the generated doc ([`scripts/live-instructions.mjs:52`](../scripts/live-instructions.mjs)) | Clears every agent's conversation in a room before a demo take or after instructions change. A resumed session otherwise keeps stale memory, e.g. it once skipped a re-publish as "already live" ([DECISIONS.md:13](../DECISIONS.md)) | No one-line way to reset three sessions. You'd kill and restart each CLI by hand | Switch (a human types it) | TBD |

Room documents (`create_room_document`) are **not used**: upgrade U5 hasn't shipped. If it ships,
it becomes row 12.

## What Switch doesn't do here (and what we did instead)

- **One bridge per room.** Each room mirrors to exactly one Discord channel, and a session works
  in one room at a time. So the builder hops rooms (`connect_to_room` → post → back) to post its
  lobby note (`lobby:252-257`).
- **No scheduling.** Agents can't wake on a timer, so there are no timed jams or daily challenges
  (the score challenge was skipped). Every action starts from a chat message.
- **Reactions don't reach agents** (#1131). Plan approval is a typed `approve` reply, and on web
  Discord the card is answered by typing `A<n> 1`, because the button click didn't register there.
- **No room group for existing rooms.** Only `create_room(group_name=…)` files a room into a group,
  and using it would lose the template's kickoff. Room links (row 3) and the run tree in Console
  organise the games instead ([DECISIONS.md:16](../DECISIONS.md)).
- **Addressing can't see what a message says.** "Only agents may ask for `test`" and "only
  humans approve plans" stay in the instructions (rows 7 and 9).
- **Templates can't name individual people.** The approvers list lives in a Console custom rule,
  not in git (`lobby:177-182`).
- **No attachment op for agents.** The screenshot is posted as a GitHub Pages link that Discord
  unfurls ([DECISIONS.md:11](../DECISIONS.md)).
- **Instruction edits don't reach live sessions** (#1095). After a change, re-paste in Console and
  run `!reset-all-agents` (row 11).
- **Task delegation isn't ready.** `delegate_task` is present but unfinished, so every handoff is an
  @mention (row 5).
