# Maven Silicon Revision

A personal revision app organized around **Maven Silicon → Digital → assignment → question**. Your current course position is Assignment 7. The revision principle is unchanged: attempt from memory, record proof, mark recalled/hesitant/missed, and return on the scheduled day.

[Start the app](START_HERE.md) · [Requirements from the brief](docs/Requirements.md) · [Updates](Updates.md) · [To Ask](To-Ask.md) · [Earlier topics](docs/Earlier-Topics.md)

## Study areas

| Area | What it does |
|---|---|
| Revision | Prioritized recall queue, timer, R/H/M outcomes, evidence, repair actions and calendar-based scheduling |
| Assignments | Concept, application, solving and spoken-explanation practice; original question, handwriting and discussion together |
| Instructor reviews | Verified trainer feedback, definitions, spoken-answer practice, response and repair records |
| To Ask | Trainer doubts with assignment/question context, unchanged images, responses and a Markdown export |
| Notes & to-dos | Original screenshot/image/PDF capture and the next action surfaced at the top of the app |
| Updates | Saved activity, Markdown export, earlier-topic inventory and recoverable legacy data |

The local content import contains **98 questions and 248 original images across Assignments 1–5**. Assignments 6 and 7 remain source-needed until their actual material is available. Assignment 7 indicates Kapil's reported course position; it does not invent completion, submission, a score or recall confidence.

## Files

```text
README.md                 overview and navigation
START_HERE.md             launching and using the app
Updates.md                implementation progress
To-Ask.md                 local trainer-question handoff
docs/                     requirements, checks and earlier-topic inventory
tools/                    launch, content preparation and private-source import
sources/                  original brief and local-only inputs (not committed)
web/
  app/                    routes, APIs, app metadata and theme
  features/maven/         study workspace, question reader and capture form
  content/maven/          local course catalog, discussions and image hashes
  public/maven/digital/   original imported question and handwriting images
  data/                   Maven recall-topic and four-mode check seeds
  lib/maven/              archive migration, capture validation and backup logic
  lib/revision-*.ts       preserved scheduling, analytics and backup foundations
  db/                     database schema and worker binding
  test/                   scheduling, migration, original-content and backup tests
```

## Running locally

Double-click **Open-Maven-Silicon-Revision.cmd**. It starts the local app when necessary and opens it in Google Chrome. The old launcher remains a compatibility entry point.

For development, use Node.js 22.13 or later:

```powershell
cd web
pnpm install
pnpm dev
```

Import the private saved collection from the repository root:

```powershell
node tools/import-maven.mjs 'C:/Users/kapil/OneDrive/Desktop/mavensilicon assignments'
```

The importer checks that every question has an original question image, original solution image and discussion. It renders equations, retains all original image bytes and records SHA-256 hashes. The source assignment repository stays unchanged.

## Storage and recovery

Captures and original attachments live in the app's D1 database. Large originals are stored in chunks below the database row limit; downloading joins those exact bytes. Each file may be up to 8 MB, with three files per save. Images are not resized or recompressed.

Full JSON backups include recall history, settings, captures, responses, attachment bytes, updates and the legacy archive. Restoring checks original-file size, type and SHA-256. The restore size limit is 64 MB. Earlier Revision Solved backups are imported into the legacy archive.

The first Maven migration atomically archives the older curriculum and learner records before removing them from active study. Repeated initialization does not archive new work. The source files replaced during this update were cut into `C:/Users/kapil/OneDrive/Desktop/To Review/Revision-Solved-before-Maven-2026-10-24`, including a snapshot of the earlier local database.

The service worker caches read-only snapshots and previously opened material. Writes require a connection. The visible app refreshes saved activity every 15 seconds and immediately after a save.

## Source privacy and publication

The application GitHub repository is public. Course questions, personal handwriting, full notebook discussions, private inputs and correspondence are excluded from Git. A fresh public checkout builds with an empty source-needed catalog; run the importer locally to add the saved private collection.

The existing hosted app is [Revision Solved](https://revision-solved.kapiltripathi267.chatgpt.site). Its project identity is preserved. Local changes do not imply that this URL has been redeployed. The current Sites connection cannot access that project, and the connected Gmail account does not contain the requested Jansi conversation. The interface explicitly distinguishes missing review material from confirmed feedback.

## Checks

```powershell
cd web
pnpm typecheck
pnpm test
pnpm build
```

[Verification record](docs/Verification.md) reports actual checks and any limits.
