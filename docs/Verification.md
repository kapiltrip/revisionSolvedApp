# Verification — Maven Silicon Revision

## Verified so far

- Imported 98 source questions from the saved Assignments 1–5 collection.
- Verified the original question → handwriting → discussion sequence for every imported question.
- Checked the SHA-256 of all 248 imported original images against the source manifest.
- Tested lossless legacy migration, repeat initialization and rollback on an injected archive failure.
- Checked capture validation for unsupported executable content, unsafe source links, missing assignment context and invalid review dates.
- Retained the existing scheduling, calendar, analytics, defensive backup and service-worker checks.
- Confirmed the app page and the topics, Maven workspace and Assignment 5 material APIs return HTTP 200 locally.
- Confirmed the app repository is public and excluded private course content and inputs from Git.

## Final checks passed

- Typecheck passed after restructuring and the upload-limit fix.
- All 25 automated tests passed, with no skips in the private local content build.
- The final production build completed successfully.
- A 4,822,504-byte original image passed capture, chunked storage, SHA-256 comparison and exact-byte download through the running APIs.
- Trainer-response editing, answered status, To-Ask Markdown export, full backup restore and next-day scheduling after a missed recall passed through the actual APIs.
- A deliberately corrupted backup and an unsupported SVG attachment were rejected.
- The local math-font endpoint returned HTTP 200, and all 98 imported discussions rendered without KaTeX error markers.
- Removed the exact temporary API-test entry, topic and event IDs. The local active curriculum contains 98 Maven questions and no test capture titles.
- Git source changes exclude generated course content, handwriting, runtime state, the original brief and private working files. The final commit/push result is reported in chat.

## Verification limits

- Visual browser QA is unverified. Automatic approval review rejected the headless Chrome launch as “blocked by policy” without another reason. No screenshots or browser rendering are claimed as checked.
- Jansi's live email review could not be read through the connected Thapar Gmail account. The app contains no invented trainer feedback or scores.
- Assignment 6–7 originals are absent from the saved collection and have not been inferred from other assignments.
- The Sites connector returns `project_not_found` for the existing project under the current connection. No new Site or replacement URL has been created, and no production deployment is claimed.
