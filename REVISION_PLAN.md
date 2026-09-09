# Revision plan — after HDLBits Attempt 2

**Want only the next step? Read [START_HERE.md](START_HERE.md).** It is the short
daily guide. Use this longer plan as a reference, not a checklist to finish today.

**Start here:** finish the current HDLBits pass, then keep it active with a
small amount of closed-book practice while rotating through the other subjects.
Use Revision Solved to choose the next task and record what happened. Give this
routine two weeks before spending more study time developing the app.

**Daily rule: one recall block, one main subject, one short record.** A missed
day moves the plan forward; it does not create a double workload tomorrow.

This plan assumes “finishing tomorrow in 10 days” means completing Attempt 2
after roughly ten days of work. **Day 0 is the day you actually finish.** If it
takes longer, move the start; the plan remains usable. Completion is a target,
not a result recorded by this document. The [Attempt 2 checkpoint](https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%202/README.md)
reports 155 Done and 23 Pending at its 7 September 2026 update.

## 1. Will the app help?

**It has enough features to support this routine. Whether it helps you retain
more needs a short trial with real study sessions.** The useful features already
present are available-time and energy inputs, focus sessions, R/H/M observations,
repair actions, source links, and editable review intervals.

Use those features first. Keep the dashboard open only long enough to choose a
task and save its outcome. The success measure is whether you can explain,
derive, code, or debug something later without the answer open.

The source was reviewed at app commit `dfb2970`. All **23 existing automated
tests passed** from `app-files/` with `node --test test/*.test.mjs`. That checks
the tested scheduling, question catalog, analytics, backup logic, and PWA rules.
It does not establish live database health, phone behavior, or your learning
outcomes; this review did not run the deployed app through an end-to-end session.

## 2. Day 0: close Attempt 2 without starting another marathon

1. Finish and record the remaining problems honestly. Leave anything unfinished
   visible; do not mark it done to meet the intended finish date.
2. From the questions that needed help, choose **at most ten current weak
   concepts**. Use the Attempt 2 discussions and your own recall, not only the
   older archive's attempt counts.
3. For each, write a short prompt and link the existing explanation. Example:
   “Trace when `start_shifting` first rises after 1101; include the old state
   and the updated state.” Do not copy the whole PDF into the app.
4. Choose the first main subject: **SystemVerilog/SVA**, because you already
   have recent work there. If a real interview or assignment requires another
   subject sooner, use that instead.
5. Stop after roughly 20 minutes of organization. The next study session can
   begin with the material you already have.

Good starting candidates from the current discussions are output-cycle timing,
serial capture across clock edges, PS/2 byte capture, reset behavior, latch
inference, old register values, and counter boundaries. These are candidates
to check, not a declaration that you still struggle with every one.

## 3. The daily routine

Choose the version that fits the day. These are flexible total budgets for
revision, including logging; they are not extra work added to another full plan.

| Day | Recall and repair | Main subject | Record and stop |
|---|---|---|---|
| Difficult day: about 20 minutes | One small due prompt for 10–15 minutes | Optional; skip if needed | One sentence and the next action |
| Normal day: about 60 minutes | About 20 minutes | About 35 minutes on one concept | About 5 minutes |
| More time: up to 90 minutes | About 25 minutes | About 55 minutes, including a break | Up to 10 minutes |

For the first two weeks, usually include HDLBits in the recall block. If another
important missed concept is due, use that instead. A full FSM may need the
whole session; reduce the main-subject work accordingly. Two small prompts and
one long implementation are different workloads, so avoid a fixed daily
question quota.

**Inside a recall attempt:** read the question, close the answer, produce your
explanation or code, then check it. If stuck, identify the exact gap, read only
the relevant part, close it again, and try a small variation. Record that the
first attempt needed help even if the repair succeeds immediately.

For RTL, use a waveform, simulation, or HDLBits result as appropriate. Reading
code and recognizing it is not enough to count as independently recalled.
For a concept, a short spoken explanation plus one concrete example is enough;
every recall does not need a new document.

## 4. Keep HDLBits alive using the work already done

Treat each problem as a test of a reusable idea. Select a mixture of current
mistakes, hesitant topics, and occasional checks of apparently strong topics.
An easy problem that you can explain independently can wait longer.

Use three kinds of practice across a week:

- **Quick recall:** explain an operator choice, inferred hardware, reset
  priority, or output edge in a few minutes.
- **Implementation:** write one selected module from a blank editor, then
  check its behavior. One difficult FSM can be the main subject for that day.
- **Transfer:** change one requirement after solving it—reset priority,
  overlapping detection, invalid-frame recovery, pulse versus sticky output,
  or a counter boundary—and explain how the design changes.

Use your [Attempt 2 PDFs and discussions](https://github.com/kapiltrip/hdlBits/tree/main/HDLBits%20Attempt%202)
as the explanation source after an attempt. The older
[Attempt 1 mistake log](https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%201/study/Mistakes.md)
is a useful checklist, but an old mistake does not automatically remain a
current weakness.

**Keep one small active repair list.** Start with no more than ten concepts;
add a replacement when one becomes reliable. Stronger items remain eligible
for later spot checks. There is no need to turn all 178 problems into urgent
daily tasks or reread all the PDFs in order.

## 5. How to use Revision Solved today

Open the [existing app](https://revision-solved.kapiltripathi267.chatgpt.site).
The following actions use controls already present in the source:

1. Set a realistic **Daily study target** and **Default focus block**. The
   defaults are 60 and 30 minutes. A smaller target is valid on a busy day.
2. Choose the available minutes and current energy. Treat the proposed session
   as a suggestion. If it pulls you away from this week's main subject, search
   for and open the specific topic yourself.
3. For ordinary HDLBits maintenance, select **Give only one question**. Use
   **Give every related part** when you deliberately have time for the entire
   series. The series budget can exceed a normal recall block.
4. Attempt before opening the solution. Save the sprint outcome, then, when
   this work should drive the review queue, **also record a revision on the
   relevant topic** with its R/H/M mark, actual minutes, proof, and repair.
5. State the precise scope: “serial receiver stop-bit recovery,” for example.
   One successful question is evidence for that question; it does not establish
   mastery of every item in a large batch. Use a custom narrow topic for a
   persistent weakness that needs its own review date.
6. Keep daily admin to a few minutes. Use one app record as the revision record;
   the Attempt 2 tracker continues to represent completion of that pass.

**Why step 4 matters:** the
[practice endpoint](app-files/app/api/hdlbits-practice/route.ts) stores sprint
outcomes separately. Completing a sprint does not itself write a topic revision
or schedule its next recall. Avoid assuming the dashboard's review queue or
study-minute totals were updated by the sprint alone.

An example revision record:

> Topic: 1101 output timing. Mark: H. Proof: traced the accepting edge and
> checked the output waveform. Gap: used the old state as if it were the new
> state. Next repair: redraw the edge-by-edge trace without notes. Time: actual
> minutes spent.

## 6. Rate the attempt and let the next review move

The app's [scheduler](app-files/lib/revision-engine.ts) uses these default
intervals:

| Mark | Meaning for this plan | Next review |
|---|---|---|
| M — Missed | Could not produce the essential reasoning or needed the solution | 1 day after this attempt |
| H — Hesitant | Needed a hint or had an important reasoning/timing gap | 3 days after this attempt |
| R — Recalled | Produced and checked the required answer independently | 7 days after the first R; 14 after the second consecutive R; 30 after later consecutive R marks |

An H or M resets the consecutive-R streak. Intervals are counted from the
actual recorded attempt; this is **not** a fixed calendar of Day 1, 3, 7, 14,
and 30 for every item. Keep the defaults initially. If one item needs an earlier
check, put that task in the existing to-do list and review it manually. The
interval controls are global; the current topic-tuning form does not offer a
separate recall interval for each topic.

Do not log R just because a solution now looks familiar, or mark the same task
R several times in one sitting to advance its schedule. After a missed attempt,
repair it now and test it again on another day.

Review when due if it fits the available time. A due item is a candidate for
today's limited workload, not an obligation to finish the entire queue.

## 7. First two weeks after completion

Use these as session slots, not fixed dates. Continue from the next unfinished
slot after a missed day. Due recall fits inside the daily budget above.

| Slot | Main work | Something to produce without the notes |
|---|---|---|
| 1 | SV objects, handles, and copying | Trace two handles and explain what a shallow/deep copy must duplicate |
| 2 | SV processes, events, and mailboxes | Draw the generator-to-driver-to-interface path in your existing example |
| 3 | SVA sampling and implication | Draw one passing and one failing sampled trace |
| 4 | SVA repetition, delays, and reset | Translate two requirements and check their cycle boundaries |
| 5 | One current HDLBits weakness | Rebuild one FSM/datapath and check a changed requirement |
| 6 | Review and repair | Retry the week's two most important H/M items; explain one project block |
| 7 | Light day or rest | Optional short recall; choose next week's main topic |
| 8 | FIFO interface and occupancy | Explain accepted reads/writes, boundaries, and simultaneous operations |
| 9 | CDC and asynchronous FIFO | Draw the clock domains and explain the purpose of pointer synchronization |
| 10 | STA fundamentals | Derive a setup/hold check using explicitly stated clock assumptions |
| 11 | Frequency dividers | Trace a /2 or /3 example and explain the edges that set duty cycle |
| 12 | CMOS fundamentals | Sketch an inverter transition and explain delay and power qualitatively |
| 13 | Review and repair | Two delayed recalls from week 1 and one FIFO/project explanation |
| 14 | Light day and decision | Check whether the app reduced decisions and preserved recall |

This is a first rotation through selected concepts. It does not claim to
complete SV, SVA, FIFO, CDC, STA, or CMOS in one session each. If a concept needs
another slot, give it one and shift later work instead of stacking it on top.

Afterward, use **five main sessions, one repair/project session, and one light
day or rest day** per week. Start with protocols in the next rotation: one
transfer in UART/SPI/I2C, APB, AHB, then AXI/AXI-Lite handshake and channel
reasoning. Give AXI more sessions when needed; a large lecture archive is not
a one-day revision task.

Keep cycling through [RevisionAtlas](https://github.com/kapiltrip/RevisionAtlas)
and [SystemVerilog from Beginning](https://github.com/kapiltrip/systemverilog-from-beginning)
using actual H/M results to choose depth. Keep already studied digital design,
CMOS, STA, and protocols in the due-recall rotation. Architecture and your
existing CPU/UART/FIFO projects can use the weekly project slot. Add C++ or
scripting when a role requires it, or when the core routine is manageable;
their presence in the app does not make all four repositories daily work.

## 8. When the queue feels too large

- Pick one important M item, then an H item if there is time. Include a
  previously strong item occasionally to check that the rating still holds.
- Cap recall at the chosen budget. If an important repair needs longer, use
  the main-subject block for it and shift the planned subject.
- After one missed day, resume with a normal or difficult-day session.
  After several missed days, spend the first session selecting two useful
  repairs; continue the rotation afterward.
- If the backlog keeps growing for a week, reduce new topics and split broad
  tasks into smaller prompts. More urgent labels will not create more time.
- With an interview within a few days, replace the main-subject block with
  the role's likely questions and explanations of your own project decisions.
  Preserve a small recall block if practical.
- On a day when even the minimum is too much, rest and resume. Do not create
  a false completion record to protect a streak.

## 9. App findings and suggested improvements

These are recommendations from the inspected source, **not features implemented
by this document**. There is no need to finish this list before studying.

**First priority: connect practice to revision.** Add a finish action that records
the question or concept, R/H/M result, evidence, actual elapsed study time, and
next due date together. For a series, allow different outcomes per part.
Currently the sprint has one outcome and separate topic scheduling. A useful
acceptance check: finishing a missed single question creates one dated repair
and counts its minutes once, including after a reload or retry.

**First priority: include Attempt 2 evidence.** The links in
[the dashboard](app-files/components/revision-dashboard.tsx) and
[topic seeds](app-files/data/topic-seed.ts) still point to Attempt 1. Add Attempt 2 notes
and current weakness evidence while preserving the older archive. Map by the
HDLBits problem URL/slug: tracker entry order is not necessarily the catalog's
problem number. A completed second-pass entry should retain its actual status
and explanation link without being presented as a fresh recall test.

**Next: make the picker reflect current recall.** The
[question picker](app-files/lib/hdlbits-question-engine.ts) uses static historical
attempt/success statistics for “My historical weak spots” and draw history to
favor less-seen questions. It does not rank by the latest R/H/M outcome or a
per-question due date. Suggested order: due current misses, due hesitant items,
then spaced checks of stronger material. Drawing a series should not imply
that every part was attempted; the current history includes all drawn IDs.

**Next: make workload and active subjects explicit.** Add an active-subject
selection, a daily recall cap, and a defer action that preserves the record.
The current planner draws from all topics and may shorten its time allocation
without making a broad task smaller. Some seed target dates also predate this
plan. Old dates alone do not prove forgetting. Today, select the appropriate
topic manually and review stale targets gradually. Changing a target date
does not supersede an existing `next_due_at`; manual color overrides also
take precedence, so leave urgency on Automatic unless deliberately changing it.

**Later: make progress easier to interpret.** In
[the analytics](app-files/lib/revision-analytics.ts), “retention” is the percentage of
logged R results and “memory strength” is a score built from status, rating,
streak, and dates. Neither is a measured probability of remembering everything
or passing an interview. Label them accordingly and emphasize delayed recall
and repaired mistakes. Cosmetic changes can wait until a repeated usability
problem interferes with study.

## 10. Decide after two weeks

At the first relevant session, save a few baseline prompts: one HDLBits design,
one explanation, and one waveform or derivation. Revisit them after several
days and include a small variation. Compare help needed, reasoning errors,
and ability to explain the result, rather than just speed or a dashboard score.

Ask:

- Can I normally choose a task within two minutes?
- Is recording a session taking only a few minutes?
- Can I reproduce some earlier H/M answers after a delay with less help?
- Have I maintained HDLBits while revisiting other subjects?
- Do I resume after missed days without repeatedly rewriting the plan?

If yes, keep using the routine. If logging or navigation consumes the study
session, simplify usage to the topic list, focus timer, and revision record.
Record the specific friction before requesting an app change. This trial is
practical feedback, not a controlled experiment proving the app's effectiveness.

## Why this method is reasonable

Repeated retrieval improved delayed recall in Karpicke and Roediger's vocabulary
experiment. That supports trying an answer before rereading it; applying the
principle to RTL also requires actual design and behavior checks.
[Karpicke & Roediger, 2008 — The critical importance of retrieval for learning](https://profiles.wustl.edu/en/publications/the-critical-importance-of-retrieval-for-learning/).

Cepeda and colleagues found that useful spacing depends on how long knowledge
must be retained. This supports revisiting material across days, but does not
establish one universal review ladder for VLSI learning.
[Cepeda et al., 2008 — Spacing effects in learning](https://pubmed.ncbi.nlm.nih.gov/19076480/).

The time budgets, ten-concept starting limit, subject rotation, and two-week
trial are practical starting choices for this workload. Adjust them from
actual recall and available time; they are not research-prescribed quotas.
