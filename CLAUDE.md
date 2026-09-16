# Jesse — Project Instructions

## Project Context

This repo (`ona/`) contains the Jesse autonomous patient-support LLM
agent. It sits alongside reference material that is not part of this
repo: two docs directly beside it, and the active plan inside a
sibling folder called `nimbalyst-local/`:

- `../Jesse_Architecture_Analysis_and_Rebuild.md` — system architecture
- `../Jesse_Full_Technical_Breakdown_v2.md` — full technical breakdown
- `../nimbalyst-local/plans/switched-to-plan-mode-glimmering-lynx.md` — the active plan (spec steps, task list)

Read these when you need context on the overall plan, spec steps, or
architecture before starting a task. Do not duplicate their content
into this file — reference them.

## Task Completion Protocol

Document all work in `docs/progress-log.md` — a single running file
that only grows. Never overwrite or delete prior entries.

As soon as you finish a task, immediately — in that same session,
before starting the next task — update `docs/progress-log.md`:
1. Update the Spec Step Status table to reflect the task just finished.
2. Append a new task entry for it.

Do not batch documentation across multiple tasks. Each task gets its
write-up immediately after completion.

### File structure of docs/progress-log.md

**Part 1: Spec Step Status** (top of file, rows updated in place as
status changes, never duplicated):

| Spec step | Spec step name | Plan task(s) | Status |
|---|---|---|---|
| 0 | Project scaffolding | Task 1 | ✅ Done, committed (`6be0fa2`) |
| 1 | Core contracts, stage derivation, router | Task 2 | ✅ Done, committed (`1e2f64e`) |
| — | (Config wasn't a numbered spec step, but the plan pulled it in early) | Task 3 | ✅ Done, committed (`1e2f64e`) |
| 2 | LLM adapter (Anthropic + OpenAI, tool/schema translation) | Task 4 (translation) + Task 5 (adapters) | 🟡 Task 4 done, uncommitted. Task 5 not started. |

Status values: `Not started`, `🟡 In progress` (state what's done vs.
pending), `✅ Done, committed (<hash>)`.

**Part 2: Task entries** (appended below the table, one per task, in
the order completed):

### Task <N>: <short name> — <date>

#### Summary (Plain Language)
What was done, written for a non-technical reader — no jargon, no code
references. Explain it the way you'd explain it to a stakeholder or
product manager.

#### Summary (Technical)
The technical account: approach taken, key design decisions, tradeoffs,
and any notable edge cases.

#### Commits
| Commit Hash | Message | Description |
|---|---|---|
| `abc1234` | `fix: ...` | What this commit changed |

#### Changes Made
List everything added or changed in each file — not just functions.
This includes new functions, classes, constants, config entries,
types/interfaces, routes, schema fields, or any other addition.
Group by file, under **Created** and **Modified** headers. For each
item, give:
- **Name** (function, class, constant, etc.)
- **What it does**
- **Why it exists / what problem it solves**

### Rules
- Tasks 1–5 are already complete. Backfill them in `docs/progress-log.md`
  using past tense ("you completed Task 1...") the first time this file
  is used.
- Task 6 onward: write documentation immediately after finishing each
  task, not in a batch.
- Keep the Spec Step Status table in sync with the latest task entry
  at all times.
- If a task only partially completes a spec step, reflect that in the
  status column rather than marking the step fully done.
- If a task touches multiple files, list all of them under Changes
  Made, not just the primary one.