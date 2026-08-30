# Revision Solved app data

`topic-seed.ts` contains the versioned ledger extracted from Kapil's
`RevisionAtlas`, `systemverilog-from-beginning`,
`cpp-and-scripting-practice`, and `hdlBits` repositories. HDLBits mirrors the
real 17-batch revision sheet plus two 12-theme weakness labs.

`subtopic-seed.ts` defines the durable quick checks beneath every topic. The 19
HDLBits topics expand into 92 checks: four proof-oriented checks for each
revision batch and all 24 named weakness themes from the repository's mistakes
log.

The running app stores revision inputs in its D1 database so dates, marks,
proofs, mistake patterns, repair actions, and next-review calculations survive
reloads. Use **Export complete backup** to download the current records as JSON.
**Restore backup** validates and normalizes that file before merging it; it does
not delete records absent from the backup. Seed reconciliation is idempotent:
new versioned topics are added without overwriting existing coverage or
revision history.
