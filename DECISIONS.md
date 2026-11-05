# Decisions

One line each: problem, choice, why.

- Studio tools are zero-dependency Node ESM, so a clean clone needs only Node 20+ (Playwright is added in Phase 3 for the playtester).
- Phase 2: all three agents share one working directory (the studio). Switch Console runs every session in the agent's directory as-is, with no git worktrees (console/agents/architecture/data-model.md), so files hand off through the folder.
- Phase 2: on Windows, Console 0.40.1 won't create Claude Code agents from a template ("SDK sessions require a POSIX SSH execution host"), but its New agent dialog does. So the three agents were created by hand with the template's instructions. The template marks them `allow_existing: true`: on Windows you pick "Existing agent" and it creates only the room, Discord channel and kickoff; on Mac/Linux it creates everything.
