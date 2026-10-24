# Maven Silicon Revision — updates

## 24 October 2026

- Read both pages of the supplied handwritten app brief.
- Located the active application in `apps/revisionSolvedApp` and the separate Maven Silicon assignment collection.
- Defined Revision, Assignments and Instructor Reviews as the three main study areas. Retain evidence-based R/H/M recall and spaced revision.
- Current course position: end of Digital, Assignment 7, as reported by Kapil. This does not assert submission, review completion, or recall proficiency.
- Moved superseded plans, old curriculum and HDLBits-specific components into `C:/Users/kapil/OneDrive/Desktop/To Review/Revision-Solved-before-Maven-2026-10-24`. Verified the original locations are empty.
- Preparing the question → original handwriting → discussion reader from the existing Assignments 1–5 collection, plus To Ask, screenshot capture, review records, and activity exports.
- Live source access: the connected Gmail account is the Thapar account. The Sites connector cannot access the existing Revision Solved project. Do not describe email feedback as collected or the live app as updated until verified.

The app's Updates area records subsequent saved activity and exports it as Markdown. This file records implementation progress.

### Local implementation and checks

- Reorganized application source under `web/`, with Maven study features, locally generated course content, import/launch tools, documentation and local-only inputs kept in their own locations.
- Renamed the app, manifest and launchers to **Maven Silicon Revision**. The old launcher calls the new one.
- Added the three study areas plus To Ask, screenshot/image/PDF capture, trainer responses, next actions and update exports.
- Imported all 98 questions from Assignments 1–5 and preserved all 248 original images. Equation rendering reports no KaTeX errors across the 98 discussions.
- Added a 79-topic inventory of the earlier curriculum for inspection. Kept the prior scheduling and analytics foundations.
- Added atomic database archiving, original-file chunk storage, SHA-256 validation and full backup/restore support.
- Verified a 4,822,504-byte original image through capture, chunk storage, download, trainer response, status, Markdown export and a full backup restore. The downloaded bytes matched exactly. Damaged backups and unsupported attachment types were rejected.
- Removed only the temporary API-test fixtures after verification; the active local curriculum contains 98 Maven questions.
- Confirmed that this GitHub source repository is public. Original course content, handwriting, full discussions, the supplied brief, runtime data and private working files are excluded from Git.
- The local app uses `http://localhost:3210/`. Publishing to the existing project and importing the Jansi correspondence still require access to their original accounts. No replacement Site was created.
- Application code was committed and pushed to the existing GitHub main branch. Private course material and runtime data were excluded. Automatic approval review blocked opening Chrome, so visual browser checks remain unverified.


## Follow-up — directory, color, synchronization and review maintenance

- Kept exactly README.md, Updates.md, To-Ask.md and the Maven launcher visible outside `_internal/`. Git metadata remains hidden. Application code, tools, guides, originals, tests, runtime data and supporting files now live inside `_internal/`.
- Saved a recoverable workspace export, a SQLite backup and per-table hashes before relocation. Verified all 13 table hashes after the move.
- Added distinct purple, orange, teal, rose, sky and indigo accents for the six app areas. Button and selected-label contrast passes 4.5:1 checks.
- Fixed initial sync status, failed-refresh handling and out-of-order responses. The app labels the local workspace and no longer implies it has synchronized with the earlier hosted database.
- Added automatic top-level working Markdown synchronization. Manual edits are preserved privately before generated files are refreshed. Root working Markdown is excluded from the public repository.
- Preserved the existing three-page Digital Review 03 PDF, imported it and three page previews into the app, and verified both inline and download responses against the original PDF hash. Its matching sent email remains unverified; the connected Gmail account is still the Thapar account.
- Expanded verification to 32 passing tests, including interactive DOM checks for form submission, failed-sync recovery, response ordering, PDF actions and cached offline behavior. DOM checks are not browser visual verification.
- Repeated the real API round trip with a 4,822,504-byte original image, trainer response, Markdown export, full backup restore, damaged-backup rejection and recall scheduling. The review PDF is 3,576,570 bytes and is unchanged.
- The existing Sites project remains inaccessible under the current connection; no replacement Site was created and no hosted update is claimed.

Final follow-up checks passed: typecheck, all 32 tests, production build, original PDF inline/download hashes, idempotent review import, exact working-file mirrors and the outer-layout verifier. The final workspace has 98 source questions, current Assignment 7, one maintained review, four review attachments and no temporary API-test entries.
