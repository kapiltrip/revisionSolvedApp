# Use Maven Silicon Revision

From the app's top-level folder, double-click `Open-Maven-Silicon-Revision.cmd`. It starts the local server, synchronizes the working Markdown files and opens [the local app](http://localhost:3210/) in Google Chrome.

## A revision session

1. Keep Assignment 7 as your current Digital position. Capture current work and trainer doubts there until its original questions are imported.
2. Open **Revision** for a missed, hesitant, due or new question from the saved collection.
3. Choose **Concept**, **Application**, **Solve** or **Speak**. Attempt the question before revealing your handwriting and discussion.
4. Record proof, minutes and R/H/M. Add the concrete repair you need; the app schedules your next recall.
5. Open **Instructor reviews** for original review PDFs and page previews. Save actual feedback and corrections alongside them.

## Images and reviews

Use **Capture** to paste or attach an original image, screenshot or PDF. Review the preview before saving. The app does not resize or recompress supplied attachments. Use **Read attached PDF** or download the unchanged file.

Digital Review 03 is the existing three-page local PDF. Its original PDF, page previews and source manifest are maintained under `_internal/sources/reviews/Review-03/` and in the app's private database. The sent-email source remains unverified.

## Working files and backups

The top-level `Updates.md` and `To-Ask.md` follow saved local app data while the app is running. Add content through the app. Any manual changes to those generated files are preserved in `_internal/sources/file-inbox/` before a refresh.

**Download full backup** includes recall history, original uploads, review responses and the legacy archive. Keep it private. Restore checks original-file size, type and SHA-256; the supported restore limit is 64 MB.

The old source and plans are in `C:/Users/kapil/OneDrive/Desktop/To Review/Revision-Solved-before-Maven-2026-10-24`. No old study repository was deleted.

## Development

```powershell
cd _internal/app
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

From the repository root, refresh the private collection with:

```powershell
node _internal/tools/import-maven.mjs 'C:/Users/kapil/OneDrive/Desktop/mavensilicon assignments'
```

The source collector remains unchanged. A public checkout uses a source-needed catalog until private material is imported. The existing hosting identity is `_internal/app/.openai/hosting.json`; do not create a replacement Site to work around account-access limits.
