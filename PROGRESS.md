# Progress log

Each phase appends 5 lines: done, deviations, open issues, next step.

## Phase 1 (2026-11-05): project base + studio kit — DONE
- Done: jam-room repo (README stub, LICENSE, DECISIONS, PROGRESS), studio-kit (STUDIO.md contract, polished starter with __jam hook + demo "Block Rain", tools new-version/check/build-arcade/serve/publish, zero deps), setup-studio.ps1/.sh (idempotent). Studio installed at C:\Users\jatin\jam-studio; demo v1 published locally; user playtested OK.
- Deviations: added tools/lib.mjs (shared helpers) and studio .gitattributes (LF, silences CRLF warnings); publish.mjs runs check.mjs first and aborts on failure; setup commits games/ too, so publish may say "Nothing new to commit".
- Open issues: Game.resize clamps but doesn't re-center if the page loaded at 0 width (hidden tabs only). The studio git repo has no remote yet (Phase 3 adds it).
- Next step: Phase 2. Confirm Discord is connected in Switch Console and #jam-room exists, then read the TEMPLATES.md sections and write templates/jam-room.template.yaml.
