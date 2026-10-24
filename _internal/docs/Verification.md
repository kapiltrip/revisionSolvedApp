# Verification — Maven Silicon Revision

## Source and directory integrity

- The visible outer folder contains only README.md, Updates.md, To-Ask.md, the Maven launcher and `_internal/`. Hidden Git metadata is retained.
- Before moving the app, saved a recoverable JSON workspace backup, a SQLite snapshot and logical hashes for every user table.
- All 13 database-table hashes matched after relocation into `_internal/app/`.
- The 98 imported questions retain original question → handwriting → discussion order. All 248 imported images match their original SHA-256 hashes.
- The existing Digital Review 03 source was inspected on all three pages. Its original PDF is preserved unchanged; rendered page images are clearly named previews. The matching email has not been verified.

## Functional checks

- The automated suite covers scheduling, archive rollback, repeat initialization, original-image integrity, backup validation and preservation of newer trainer responses.
- Interactive DOM tests exercise trainer-question capture through the form, failed-sync read-only behavior, retry recovery, stale-response ordering and review-PDF reading/download actions. These are DOM checks, not visual browser screenshots.
- All six view accents pass 4.5:1 contrast checks for button text and selected labels.
- Working-file checks confirm exact Markdown synchronization, preservation of manual edits and retention of existing files during a failed API read.
- A 4,822,504-byte image previously passed the full upload, chunked storage, unchanged download and full-backup round trip. Corrupted backups and unsupported SVG attachments were rejected.

## Final run

- Final typecheck passed.
- All 32 automated tests passed without skips in the private local build.
- Production build completed successfully.
- The 3,576,570-byte review PDF matched its source SHA-256 in both inline-reading and download responses; all three page previews are present.
- Re-importing the review retained one review record and four attachments, with no duplicates.
- The real API upload/download/backup round trip passed after the directory move. Temporary test records were removed.
- The final local workspace contains 98 source questions, current Assignment 7, one maintained review and no API-test captures.
- Top-level Updates.md and To-Ask.md match the current local API exports exactly.
- The outer-layout verifier passed: four working files and one `_internal/` folder, plus hidden Git metadata.
- The final source commit/push result is reported in chat. Private working Markdown, reviews, originals and runtime files are excluded.

## Access and visual limits

The Gmail connection remains the Thapar account and does not expose the requested Maven/Jansi correspondence. The maintained local review copy is not described as an email download. The Sites connector still returns `project_not_found` for the existing project under the current account, so the earlier hosted app is not claimed to be updated.

Chrome launches were previously rejected by automatic approval review with “blocked by policy.” No actual-browser visual verification is claimed. Source/PDF page inspection, DOM interaction tests, contrast checks and API/build verification are distinguished above.
