# Revision Solved

Revision Solved is a personal revision command center for Kapil's real study
repositories. It turns a large syllabus into a realistic next session, records
proof instead of passive familiarity, and schedules the next recall from the
quality of the current one.

**Live app:** <https://revision-solved.kapiltripathi267.chatgpt.site>

## What makes it useful

The app combines four source ledgers in one persistent system:

| Repository                                                                                | What is tracked                                                   |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [RevisionAtlas](https://github.com/kapiltrip/RevisionAtlas)                               | Digital design, protocols, AMBA, timing, CMOS, and architecture   |
| [SystemVerilog from Beginning](https://github.com/kapiltrip/systemverilog-from-beginning) | SystemVerilog language, assertions, and functional coverage       |
| [C++ & Scripting Practice](https://github.com/kapiltrip/cpp-and-scripting-practice)       | Modern C++, Perl, shell, regular expressions, and EDA automation  |
| [HDLBits](https://github.com/kapiltrip/hdlBits)                                           | The complete RTL problem archive, revision plan, and weakness log |

The dashboard is a working surface rather than a static syllabus:

- builds a session from available minutes and current energy;
- ranks topics by due date, recall quality, priority, and manual urgency;
- shows repository, subject, topic, and subtopic coverage;
- records R/H/M recall quality, time, mood, proof, reflection, and the next
  repair, including a reusable mistake category and concrete repair action;
- runs a reload-safe focus session with a blind-recall evidence sequence and
  converts the elapsed work directly into a revision observation;
- measures daily-goal progress, current and best streaks, retention, 14-day
  activity, memory strength, and the next seven days of study load;
- turns hesitant and missed recalls into a prioritized repair queue;
- learns a topic's expected duration from completed sessions;
- maintains a recent revision trail and a “last time → now” recommendation;
- supports global scheduling rules and per-topic overrides;
- adds custom topics to any of the four ledgers;
- exports the complete database view as a portable JSON backup and safely
  restores a validated backup without deleting newer records.

## HDLBits command center

HDLBits is not represented by one generic checkbox. The seed data mirrors the
real revision structure in `kapiltrip/hdlBits`:

- **178/178 archived problems** with notes, screenshots, and saved `.sv`
  solutions;
- **17 recall batches** covering foundations through Conway's Game of Life;
- **24 documented weakness themes** split into two repair labs;
- **92 durable app checks** that expose the concepts and proof required inside
  each batch.

The dedicated HDLBits workflow enforces:

1. attempt without opening the saved solution;
2. compile or submit to produce evidence;
3. inspect the first wrong signal and cycle;
4. record the exact causal rule rather than “did not understand”;
5. mark the session R, H, or M so the next attempt is scheduled.

Deep links lead directly to the repository, 178-problem learning archive,
dated revision sheet, and 24-theme mistakes log.

## Memory scheduling

R/H/M means:

- **R — Recalled:** the solution or explanation was produced from memory;
- **H — Hesitant:** the design was understood but needed minor help;
- **M — Missed:** the learner could not produce the required proof.

The default ladder schedules M after 1 day, H after 3 days, then successful R
recalls after 7, 14, and 30 days. Every interval is editable in the app. Date
math is calendar-based and covered by automated boundary tests, including leap
years.

## Android and Windows

Revision Solved is a responsive Progressive Web App (PWA), so one deployed URL
serves both platforms and remains easy to update.

- **Android:** open the live URL in Chrome and choose **Install app**.
- **Windows:** open the live URL in Chrome and use the install button in the
  address bar or app header.

The installed version opens in a standalone window. The application shell and
last successful read-only dashboard snapshot are cached for resilient offline
review. All writes remain network-only, and the interface becomes explicitly
read-only while disconnected so stale data cannot overwrite the revision
database.

## Architecture

```text
Responsive React PWA
        │
        ├── adaptive planner + focus session + observation dashboard
        ├── memory analytics + load forecast + mistake repair queue
        ├── repository/subject/topic/subtopic views
        └── installable Android and Windows shell
        │
Vinext route handlers
        │
Cloudflare D1
        ├── topics
        ├── subtopics
        ├── revisions
        └── revision_settings

Versioned seed ledgers ──► idempotent database bootstrap
```

The UI is React 19 with reusable shadcn primitives and Lucide icons. Vinext
produces Cloudflare Worker-compatible output. D1 is initialized with prepared
statements, indexed for due-topic and revision-history queries, and optimized
after seed reconciliation. Existing user progress is preserved because seed
inserts are idempotent.

## Source layout

```text
app/                    routes, metadata, manifest, API, and shared theme
components/             dashboard, PWA installer, and UI primitives
data/                   versioned topic and subtopic ledgers
db/                     Drizzle schema
drizzle/                generated D1 migrations
lib/revision-engine.ts  tested calendar, urgency, and recall scheduling
lib/revision-analytics.ts tested streak, load, retention, and memory analysis
lib/revision-backup.ts  defensive backup validation and normalization
lib/revision-store.ts   D1 bootstrap and seed reconciliation
public/sw.js            install/offline shell and read-only data snapshot
test/                   engine, analytics, backup, seed, and PWA tests
```

## Local development

Requirements: Node.js 22.13 or newer and pnpm.

```powershell
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

## Verification

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
```

The automated suite verifies calendar boundaries, urgency precedence, the
complete R/H/M ladder, memory analytics and streaks, hostile backup rejection,
safe backup normalization, uniqueness of every seed identifier, the exact 17 +
2 HDLBits structure, all 92 HDLBits checks, and the PWA's offline/write-safety
rules. The final release is also reviewed interactively in Chrome at desktop
and mobile widths, including the reload-safe focus-to-revision workflow.

## Deployment

`.openai/hosting.json` binds the app to its existing private Sites project and
logical `DB` D1 database. A production build creates the deployable Worker
bundle in `dist/`; Sites owns the real database resource and deployment wiring.
