# Red-Green-Refactor for Issue Resolution

When a bug or issue is discovered, follow the red-green-refactor cycle:

1. **Red** — Write a failing test that reproduces the issue. Confirm it fails for the expected reason before touching any implementation code.
2. **Green** — Write the minimal implementation change to make the failing test pass. Do not refactor yet.
3. **Refactor** — Clean up the implementation while keeping all tests green. Commit after each phase if the change is non-trivial.

Do not skip the red phase. A fix without a regression test is incomplete.
