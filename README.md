# Revision Solved App

Revision Solved is a durable revision tracker built from the topic ledgers in
Kapil's `RevisionSolved` and `systemverilog-from-beginning` repositories.

**Live app:** <https://revision-solved.kapiltripathi267.chatgpt.site>

## What it tracks

- covered, in-progress, and not-covered topics;
- orange, yellow, and green urgency calculated from due dates and recall marks;
- the last revision date for every topic and for the whole tracker;
- R/H/M recall quality with the Day 1/3/7/14/30 review ladder;
- proof produced, weakest causal link, notes, and revision history;
- custom topics added to either repository ledger;
- portable JSON backups exported from the app.

## Product updates suggested by Kapil

Kapil asked for the tracker to become a complete observation and decision
system—not just a list of due topics. The following requests are documented
here so the product direction remains visible in Git history:

1. Show a complete dashboard-level picture of every topic, subject, coverage
   gap, urgent area, time investment, revision recency, and recent reflection.
2. Make urgency fully customizable, including global orange/yellow windows,
   R/H/M scheduling intervals, per-topic color overrides, target dates,
   priorities, and expected session time.
3. Ask how long each revision took, how it felt, what proof was produced, the
   learner's personal opinion, and what needs repair next.
4. Link topics back to their source GitHub repositories and link the app itself
   to its GitHub source.
5. Give a real-time “last time you did this; now do this” observation so the
   next action is obvious and mental load stays low.
6. Keep study planning engaging without overpacking it: ask for one of four
   current feelings and the available study time, then build a realistic topic
   plan with enough time, a break when useful, and a buffer.

These requests are implemented in the current dashboard, adaptive session
planner, topic tuning controls, observation map, revision trail, and persistent
session records.

The initial 50-topic source ledger is kept in `data/topic-seed.ts`. Runtime
records are stored in D1 and the schema/migration is versioned with the app.

## Local development

```powershell
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Production build

```powershell
pnpm build
```
