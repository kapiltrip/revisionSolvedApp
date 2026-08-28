# Revision Solved App

Revision Solved is a durable revision tracker built from the topic ledgers in
Kapil's `RevisionSolved` and `systemverilog-from-beginning` repositories.

## What it tracks

- covered, in-progress, and not-covered topics;
- orange, yellow, and green urgency calculated from due dates and recall marks;
- the last revision date for every topic and for the whole tracker;
- R/H/M recall quality with the Day 1/3/7/14/30 review ladder;
- proof produced, weakest causal link, notes, and revision history;
- custom topics added to either repository ledger;
- portable JSON backups exported from the app.

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
