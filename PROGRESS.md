# Progress log

Each phase appends 5 lines: done, deviations, open issues, next step.

## Phase 1 (2026-11-05): project base + studio kit — DONE
- Done: jam-room repo (README stub, LICENSE, DECISIONS, PROGRESS), studio-kit (STUDIO.md contract, polished starter with __jam hook + demo "Block Rain", tools new-version/check/build-arcade/serve/publish, zero deps), setup-studio.ps1/.sh (idempotent). Studio installed at C:\Users\jatin\jam-studio; demo v1 published locally; user playtested OK.
- Deviations: added tools/lib.mjs (shared helpers) and studio .gitattributes (LF, silences CRLF warnings); publish.mjs runs check.mjs first and aborts on failure; setup commits games/ too, so publish may say "Nothing new to commit".
- Open issues: Game.resize clamps but doesn't re-center if the page loaded at 0 width (hidden tabs only). The studio git repo has no remote yet (Phase 3 adds it).
- Next step: Phase 2. Confirm Discord is connected in Switch Console and #jam-room exists, then read the TEMPLATES.md sections and write templates/jam-room.template.yaml.

## Phase 2 (2026-11-05): three agents + first full loop in Discord: DONE (second human pending)
- Done: templates/jam-room.template.yaml; agents jam-designer (anyone), jam-builder and jam-playtester (owner-agents), all Claude Code in C:\Users\jatin\jam-studio; room jam-room (Discord channel) from the template. Live run: pitch, plan, approve, build, PASS, published: "Cat vs Cucumbers v1", http://localhost:8080/games/cat-vs-cucumbers/v1/ (plays; playtest.mjs 13/14, only scenario.json missing).
- Deviations: on Windows, Console can't create template agents ("SDK sessions require a POSIX SSH execution host"), so the agents were made in the New agent dialog and the template uses allow_existing + provider: claude. Phase 3's playtest.mjs and Playwright are already done and committed.
- Open issues: the playtester's "ship it" sat mid-message and didn't wake the builder, so the owner posted "@jam-builder ship it" once. The template now says handoff mentions go FIRST in the message. The designer credited the @username (billusanda5808), and the template now says to use display names. Neither fix is in the live agents yet. The second-human test (step 6) is not done.
- Next step: Phase 3. Paste the updated designer/builder/playtester instructions (playtester: write scenario.json and run tools/playtest.mjs) into the 3 agents in Console (Agent, settings), restart their sessions (#1095), do the second-human test, then public Pages.

## Phase 3 (2026-11-05): public links + Switch-native moments: MOSTLY DONE (v2 run pending)
- Done: public repo jatinvats123/jam-studio-arcade with GitHub Pages (https://jatinvats123.github.io/jam-studio-arcade/); publish.mjs pushes, waits max 90 s for a 200, prints the LIVE, Short (play/<slug>/) and Screenshot links. Native approval: the studio's .claude/settings.json asks before `node tools/publish.mjs`, so Switch posts a "Permission needed" card in Discord (verified; the typed answer "A1 1" works). Live instructions synced in Console = templates/jam-room.template.yaml (docs/live-agent-instructions.md). v1 got a real PLAYTEST PASS 19/19 in Discord and is live on Pages.
- Deviations: screenshot is posted as a Pages link (no attachment op for agents). Pages wait is 90 s, not 120 s (agent tool timeout). Recording moved to the end of the project, by user choice.
- Open issues: resumed sessions keep old memory, so run `!reset-all-agents` before any take. Clicking a card button in the Discord web client didn't register (typed answer works; try the desktop app). The v1 → v2 run with a second human is not done, so Phase 2's second-human test is still pending too.
- Next step: run the v2 jam (friend: "@jam-designer make the cat faster and add a high score", owner: "@jam-designer approve", Allow the card), check that v2 is live on Pages, then start Phase 4.

## Phase 4 (2026-11-05): game rooms, remix, hotfix: IN PROGRESS (usage limit hit)
- Done: templates/jam-game-room.template.yaml; new instructions for all 3 agents, synced in Console (playtester addressing = anyone); aliases @designer/@builder/@tester in #jam-room; new-version --from, playtest --only + repro/advisory regression, arcade lineage/hotfix/bug-hunter/footer, scripts/live-instructions.mjs (--check). Clean-clone test PASS (setup, new-version, --from, check, repro, hotfix regression, local publish, arcade lineage, both templates parse, live doc matches). README quick start pinned.
- Live: Feature 1 works (approve in lobby -> create_room_from_yaml -> #game-penguin-slide, lobby post with clickable channel link, kickoff woke builder). Remix: Comet Dash (remix_of cat-vs-cucumbers) got #game-comet-dash; no remix links because cat-vs-cucumbers has no room of its own (expected for pre-Phase-4 games).
- Deviations: no room group (see DECISIONS); feature 4 (challenge) not started. Designer still credits the username unless the human gives their display name.
- Open: Penguin Slide v1 playtest/publish pending (user taps Allow on the Permission card); Comet Dash v1 build pending; hotfix smoke test not run; lobby "now playing" note unverified.
- Next step: check both builds published, then in #game-penguin-slide: "@tester bug: <real bug>" -> expect repro + hotfix v2 + publish; verify lobby notes and arcade lineage; commit; then Phase 5.
