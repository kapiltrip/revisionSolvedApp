# Suggestions after HDLBits Attempt 2

**For Kapil · 9 September 2026**

**My recommendation: make SystemVerilog your main subject for the next two weeks, keep HDLBits in a small recall rotation, and prepare the ten-part series from the work you actually complete.** Start the SV revision tomorrow. Give the public series a small preparation buffer.

Your next step does not require another complete HDLBits pass. It requires a routine that lets you return to older material while continuing one main subject.

## What to do first

**Today, 9 September — spend at most 20 minutes closing the pass.** Pick three questions from Attempt 2 that you still could not explain comfortably with the answer closed. Save their existing links and one precise prompt each. Leave the other questions in the archive. Then stop organizing.

**Tomorrow, 10 September — use one study block.** Spend 20 minutes on one of those questions, then return to SV with the first session below. Finish with a short record of what needed help and where to resume. If tomorrow is busy, use the 60-minute version of the block.

**For these two weeks, use this file as the current decision guide.** Keep [START_HERE.md](START_HERE.md), [REVISION_PLAN.md](REVISION_PLAN.md), and the older SV plan as references. Their calendars are not additional assignments. The earlier instruction to finish Attempt 2 has now been satisfied.

## What I could verify

| Evidence reviewed | What it means for this plan |
|---|---|
| Your [Attempt 2 completion record](https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%202/README.md) records 178 Done and 0 Pending at the final 9 September checkpoint. | Completion is established by the repository record and your confirmation. It does not establish independent delayed recall of every answer. |
| Your [SystemVerilog index](https://github.com/kapiltrip/systemverilog-from-beginning/blob/main/QUESTION_TO_CODE_INDEX.md) already maps basics, assertions, and functional coverage, with code and answered questions. | You have substantial material to return to. Begin with short recall checks and reopen the explanations that those checks show you need. |
| Recent commits include [SV coverage projects on 26 August](https://github.com/kapiltrip/systemverilog-from-beginning/commit/ffb4e5b07c24d1c0b4511b9a255ffb2baf1d10fe), [HDLBits completion on 9 September](https://github.com/kapiltrip/hdlBits/commit/bc5bc09ea1894ccaa02a1674a67c31dbdd8e09cc), and [consolidation into ten daily PDFs](https://github.com/kapiltrip/hdlBits/commit/a05986137258bf2e64c5a5aaf54b974547e15205). | The visible work includes learning records, repairs, and substantial presentation work. Put a time limit on further packaging so it leaves room for recall and application. |
| The app's [topic ledger](app-files/data/topic-seed.ts) spans SV, HDLBits, core subjects, and C++/scripting. Several entries contain whole lesson groups. | A dashboard topic can be much larger than one study session. Choose a question inside it before starting. |

Your report that the second cycle felt faster is encouraging. I cannot calculate the improvement reliably from these commits: they do not measure study time, help received, or comparable difficulty, and their timestamps are not a verified daily schedule. The latest SV commit I found also does not prove that you stopped studying SV afterward.

I could inspect the app's repository and scheduling code, but could not access its live revision database. I therefore do not know your current due count, recall scores, or time logs. Earlier conversational schedule details were unavailable. The times below use your stated 8–9 a.m. wake time and the morning/afternoon options preserved in your [earlier SV plan](https://github.com/kapiltrip/systemverilog-from-beginning/blob/main/WORKING_REVISION_PLAN.md); they remain proposed slots, not verified free time.

**My assessment:** the difficulty you describe is consistent with too much material competing for each day's attention. Faster solving helps, but you also need to decide what receives a turn and what can wait.

## A daily block that can fit an ordinary day

Keep your 8–9 a.m. wake time. Try **10:00–11:40 a.m.** when the morning is available. If it is occupied, move the same block to **3:00–4:40 p.m.** Use your local clock. Choose one of these windows.

| Time | Work | Finish condition |
|---|---|---|
| 10:00–10:20 | One older recall or repair | Produce an answer, check it, and identify any gap. |
| 10:20–10:55 | Main SV session, first half | Predict behavior or write one small example before consulting the saved answer. |
| 10:55–11:00 | Break | Step away briefly. |
| 11:00–11:35 | Continue that same SV task | Check behavior, repair the gap, and try one changed case if time permits. |
| 11:35–11:40 | Record and stop | Save the result and the exact next action. |

This is **100 minutes elapsed: 20 recall + 70 main work + 5 break + 5 logging**. It is the study plan for that block, not an extra revision obligation added to another full course schedule. If you prepare a series note that day, use the final 10–15 minutes of the main-work allocation.

Use a smaller version when necessary:

- **60 minutes:** 15 recall + 40 main work + 5 record.
- **25 minutes:** 10 recall + 10 on the next small SV step + 5 record. A ten-minute step may be only an object diagram or one waveform prediction.
- **No useful capacity:** stop and resume next time. A missed day does not double the next day's work.

Protect this one block before filling the rest of your day. Keep classes, work, meals, other obligations, and rest in their existing places. There is no evening catch-up requirement. If the block works consistently and you have more time, continue the same example or repair a prerequisite before adding another subject.

## How to manage revision inside the app

Use **one live revision record**. Revision Solved can hold the next dates and actual outcomes; the GitHub repositories remain the explanation and code archive. There is no need to copy each session into the app, the old four-week tracker, a spreadsheet, and a new document.

1. **Choose today's main subject first.** For this trial it is SV. If the planner proposes unrelated material, open the intended topic directly.
2. **Choose one older prompt for the recall block.** Start with a due, useful M or H item. On two of the five main-study days, use an older SV/core prompt instead of HDLBits. Include an apparently strong item occasionally so you check whether it still holds up.
3. **Make the task narrow.** “Trace the final serial bit and the `done` edge” is a session task. “Revise all serial communication” is too broad.
4. **Attempt with the answer closed.** Write code, draw a trace, derive a relation, or explain a mechanism. Then check against the existing example, simulation, or note.
5. **Record the first independent attempt honestly.** If you needed the solution, an immediate successful repair does not turn the original attempt into R. Retest later.

Use the app's current interval settings. The documented defaults, implemented through the [scheduler](app-files/lib/revision-engine.ts), are:

| Mark | What to record | Default next review |
|---|---|---|
| M — Missed | Could not produce the essential reasoning, or needed the solution. | 1 day after the actual attempt. |
| H — Hesitant | Needed a hint or had a meaningful reasoning gap. | 3 days after the actual attempt. |
| R — Recalled | Produced and checked the required answer independently. | 7 days after the first consecutive R, 14 after the second, then 30. |

An H or M resets the consecutive-R streak. These are intervals after each actual attempt, not dates on which every question must be reviewed together. Your saved settings may differ from the defaults.

**Keep only five unresolved prompts in your immediate repair list, beginning with today's three.** This is a limit on what you actively work through, not a reason to delete older mistakes. Return a prompt to ordinary spaced review once you can answer it independently on a later day. Bring another useful prompt forward as space opens.

**Cap ordinary recall at 20 minutes.** If an important repair needs longer, it can take that day's main block; shift the SV session forward. Do not squeeze both full tasks into the same time. If the queue keeps outrunning this budget for several sessions, spend the next main block repairing existing material and pause new additions. An overdue date is a selection signal, not proof that the entire archive must be cleared today.

Two details matter in this particular app:

- For short HDLBits maintenance, use **Give only one question**. A complete related series can exceed the recall budget. Open a known weak question directly when the picker does not give you what you need.
- The [HDLBits practice endpoint](app-files/app/api/hdlbits-practice/route.ts) saves the sprint outcome separately from topic revisions. To schedule the next topic recall, also record the relevant topic revision. Describe the exact concept tested; one solved question does not establish recall of its whole batch. Record actual topic-study minutes once.

One record is enough:

> Serial receiver stop-bit recovery | H | Checked the final-bit and `done` trace; needed a hint about the old count | Next: redraw the invalid-stop case without notes | 18 min

Use your [Attempt 2 question index](https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%202/DOCUMENT_INDEX.md) to open the relevant answer after attempting it. The ten PDFs are a reference collection; finishing the pass does not create a requirement to reread all ten.

## The SystemVerilog series: ten practical revision sessions

**Yes, the series is a useful next project if the daily explanation comes from that day's checked work.** I would frame it as **“SystemVerilog Revision in 10 Days”**, with a clear description that these are ten selected lessons from your existing study. The scope is a focused revision series.

Plan the learning as **ten main sessions across about two weeks**: five SV sessions, one repair/core session, one light or rest day; then repeat. If you start on 10 September with no interruptions, that places the tenth SV session on 21 September and the second review/rest pair on 22–23 September. These are movable session slots.

Use the [existing question-to-code index](https://github.com/kapiltrip/systemverilog-from-beginning/blob/main/QUESTION_TO_CODE_INDEX.md) as the entry point. Select one representative example from each row; do not try to reread every lesson named by a group.

| Session | Focus and existing source | One concrete result to produce |
|---|---|---|
| 1 | Simulation, data types, and time — Basics 01–04 | Predict one small testbench's initial values and event/output order; run it and explain the first mismatch. |
| 2 | Objects, handles, and copying — Basics 09 and 15–17 | Draw two handles and a nested object. Predict what changes after assignment versus copying, then check one example. |
| 3 | Tasks/functions and argument passing — Basics 10–12 | Change one value argument to `ref`, predict what the caller sees, and check it. Use a queue example from Basics 08 only if time remains. |
| 4 | Constrained random stimulus — Basics 22–29 | Write a small legal-value constraint, check randomization success, and test one conflicting case. |
| 5 | Processes and communication — Basics 30–39 | Trace a small producer/consumer mailbox example; explain when each process can continue. |
| 6 | Layered DUT communication — Basics 40–44 | Trace one transaction through the existing testbench, including the sampled result and where it is checked. |
| 7 | Assertion sampling and implication — SVA foundation and 06–07 | Draw a passing and failing sampled trace for one requirement; check the expected assertion result. |
| 8 | Assertion boundaries — SVA 12–17 or your FSM/counter project | Test one reset or repetition boundary. Change the stimulus so the chosen property should fail, and confirm that it does. |
| 9 | Functional coverage — use your existing coverage examples | For a short known stimulus, predict the relevant bin hits, compare with the report, and explain what the reported percentage does and does not establish. |
| 10 | Integration — use one existing synchronous-FIFO example | Check one accepted-operation rule with a directed test, an assertion, and a coverage observation where supported. Explain how the three relate. |

These are selected recall and application goals, not a promise to cover all SV, SVA, functional coverage, UVM, and verification architecture in ten sessions. Keep the FIFO exercise small: reuse the existing design and check one clearly stated rule. Building a full environment would need its own time budget.

If Session 1 is already comfortable, demonstrate that quickly and move into the next weak concept. If a session exposes a prerequisite gap, give it the next available block. The series number advances when you have a checked lesson to explain.

**Before committing to public dates, finish three small examples and draft their explanations.** Then choose a sustainable release rhythm. If you want ten consecutive publication days, preparing all ten first gives the most dependable schedule; a three-post buffer still carries a risk that a difficult lesson delays a later post. Keep “Day N” as lesson numbering when the publication dates are flexible.

Use the same short format each time:

1. The exact question or confusion.
2. One small example, object diagram, or waveform.
3. Your prediction and the checked result.
4. One limitation or changed case, plus the source link.

Stop formatting after 10–15 minutes. A clear example and short explanation are enough; a new polished PDF is optional. If you use AI help, ask for feedback on your attempt or a hint, then close the answer and reproduce the reasoning yourself.

You already have a [10DaysSystemVerilog repository](https://github.com/kapiltrip/10DaysSystemVerilog/tree/master) containing an initial-block note and simulator settings. It can be a lightweight series index linking to the fuller study repository. Check the old settings against a currently working example before reusing them; the main SV repository records later simulator fixes. Keep an exact run command or playground link with each tested lesson.

Your HDLBits [posting plan](https://github.com/kapiltrip/hdlBits/blob/main/LinkedIn_Attempt_2_Posting_Plan_and_Ideas.md) still contains an earlier incomplete checkpoint and older PDF references. Use the current Attempt 2 README for completion counts and document links. If you are still publishing the HDLBits series, let that remain the only active publication series while SV examples accumulate. Study progress can continue without running two daily content schedules.

## Where the core subjects fit

The [Revision Atlas](https://github.com/kapiltrip/RevisionAtlas/blob/main/README.md) gives you FIFO, dividers, protocols, timing, and MOSFET/CMOS material. They need turns in the rotation. Their presence in the app does not make them all daily tasks.

| Area | During the next two weeks | After the ten SV sessions |
|---|---|---|
| HDLBits/Verilog | Usually three of the five 20-minute recall slots per week; prioritize current gaps. | Keep selected delayed recalls and an occasional changed requirement. |
| SV/SVA/coverage | Main subject for the ten sessions; due SV repairs can use recall slots. | Move reliable concepts into maintenance; continue whichever gaps remain. |
| FIFO, dividers, timing, CMOS, protocols | On two main-study days, use the recall slot for an older SV/core prompt. Use each weekly repair/core session for one deeper core topic. | Make one core area the main subject for the next block of sessions. |
| CPU/core projects and architecture | Choose one previously built block or design decision for a weekly core session if relevant. | Follow a concrete project goal when you have capacity or a deadline. |
| C++ and scripting | Keep their place in the archive; bring forward a task if an actual deadline or project needs it. | Give one of them a main-subject turn when it serves your next goal. |

For the first weekly repair/core session, use FIFO accepted reads/writes and boundary behavior; it supports SV Session 10. For the second, choose either a timing calculation or one protocol transfer you currently hesitate over. Existing urgent prerequisites can replace these suggestions.

Use the same 60–100-minute daily budget for a repair/core session. Check one delayed weak item, then work on the chosen core question. Optional HDLBits practice should not be added on top when the block is already full.

After this trial, start the next main block with **FIFO/CDC**, followed by the protocol most relevant to your current work, then timing or CMOS. Adjust for a real interview, assessment, or project deadline. Do not assign every core subject a simultaneous completion date.

## How to tell whether this is helping

Your useful measure of iteration is **less help after a delay, plus the ability to handle a changed requirement**. Keep speed as a secondary measure for comparable tasks.

During the first few sessions, retain three ordinary prompts: one HDLBits timing/design question, one SV object/process question, and one assertion or coverage question. Revisit them roughly a week later inside the existing recall budget. Compare:

- whether you could start without opening the solution;
- whether you identified the right mechanism and checked the behavior;
- which hint, if any, you needed;
- whether one small variation changed your answer correctly.

An archived solution, a successful assisted repair, and an independent answer after a delay are different kinds of evidence. Record which one occurred. GitHub commits and page counts help locate work, but cannot replace that distinction.

If the same weakness appears in several examples, schedule its underlying concept. Repeated off-by-one problems may deserve one careful old-value/new-value trace rather than another complete pass. A useful HDLBits return might be three small prompts and one changed design over several sessions; a fresh 178-entry marathon is only worth considering when you deliberately want broad recalibration and can spare the time.

The recommendation to attempt before rereading has experimental support: repeated retrieval improved delayed recall in Karpicke and Roediger's vocabulary study. Applying that principle to HDL work still requires checking code and behavior. [The critical importance of retrieval for learning, 2008](https://pubmed.ncbi.nlm.nih.gov/18276894/).

Spacing those attempts across days is also supported by learning research, as summarized by the researchers' [guide to spaced retrieval practice](https://pdf.retrievalpractice.org/SpacingGuide.pdf). The exact 20-minute cap, five-prompt limit, session order, and two-week trial here are practical starting choices for your situation, not research-established optimal numbers.

At the end of the two weeks, spend ten minutes deciding what to keep. If you can choose a task quickly, produce checked SV examples, and return to older questions with less help, continue. If the routine remains too heavy, reduce the size of each session and the publication frequency. Keep one clear next action ready for the following day.
