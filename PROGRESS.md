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
