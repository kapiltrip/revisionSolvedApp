import { addDays, getRevisionStore } from '@/lib/revision-store';
import { subtopicSeedsForTopic } from '@/data/subtopic-seed';

function stringField(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function integerField(value: unknown, fallback: number) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseInt(value, 10)
        : Number.NaN;
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  return Math.min(max, Math.max(min, integerField(value, fallback)));
}

export async function GET() {
  try {
    const db = await getRevisionStore();
    const [topics, subtopics, revisions, settings] = await Promise.all([
      db
        .prepare(
          `SELECT id, repository, subject, title, status, confidence, priority,
            target_date, last_revised_at, next_due_at, revision_count,
            recall_streak, proof, notes, urgency_override, estimated_minutes,
            source_url, created_at, updated_at
          FROM topics
          ORDER BY target_date IS NULL, target_date, repository, subject, title`,
        )
        .all(),
      db
        .prepare(
          `SELECT id, topic_id, label, covered, covered_at, sort_order,
            source_url
          FROM subtopics ORDER BY topic_id, sort_order, label`,
        )
        .all(),
      db
        .prepare(
          `SELECT id, topic_id, mark, revised_at, next_due_at, proof, notes,
            duration_minutes, reflection, mood, created_at
          FROM revisions ORDER BY revised_at DESC, id DESC`,
        )
        .all(),
      db
        .prepare(
          `SELECT urgent_window_days, yellow_window_days, missed_interval_days,
            hesitant_interval_days, recalled_first_days, recalled_second_days,
            recalled_mastered_days
          FROM revision_settings WHERE id = 'default'`,
        )
        .first(),
    ]);

    return Response.json({
      topics: topics.results,
      subtopics: subtopics.results,
      revisions: revisions.results,
      settings,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not load revision data.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    const db = await getRevisionStore();
    const now = new Date().toISOString();

    if (action === 'add') {
      const title = stringField(body.title).trim();
      const subject = stringField(body.subject).trim();
      const repository = stringField(body.repository, 'revision-solved');
      const priority = stringField(body.priority, 'normal');
      const targetDate = stringField(body.targetDate) || null;
      const sourceUrl = stringField(body.sourceUrl) || null;
      const urgencyOverride = ['urgent', 'soon', 'ready'].includes(
        stringField(body.urgencyOverride),
      )
        ? stringField(body.urgencyOverride)
        : null;
      const estimatedMinutes = boundedInteger(
        body.estimatedMinutes,
        30,
        5,
        240,
      );

      if (!title || !subject) {
        return Response.json(
          { error: 'Topic and subject are required.' },
          { status: 400 },
        );
      }

      const id = `custom-${crypto.randomUUID()}`;
      await db
        .prepare(
          `INSERT INTO topics (
            id, repository, subject, title, priority, target_date,
            urgency_override, estimated_minutes, source_url, created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          repository,
          subject,
          title,
          priority,
          targetDate,
          urgencyOverride,
          estimatedMinutes,
          sourceUrl,
          now,
          now,
        )
        .run();

      const subtopics = subtopicSeedsForTopic({
        id,
        subject,
        sourceUrl: sourceUrl ?? '',
      });
      await db.batch(
        subtopics.map((subtopic) =>
          db
            .prepare(
              `INSERT INTO subtopics (
                id, topic_id, label, sort_order, source_url, created_at,
                updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              subtopic.id,
              subtopic.topicId,
              subtopic.label,
              subtopic.sortOrder,
              subtopic.sourceUrl,
              now,
              now,
            ),
        ),
      );

      return Response.json({ ok: true, id });
    }

    if (action === 'toggle_subtopic') {
      const id = stringField(body.id);
      const covered = body.covered === true;

      if (!id) {
        return Response.json(
          { error: 'Subtopic is required.' },
          { status: 400 },
        );
      }

      const subtopic = await db
        .prepare('SELECT topic_id FROM subtopics WHERE id = ?')
        .bind(id)
        .first<{ topic_id: string }>();
      if (!subtopic) {
        return Response.json({ error: 'Subtopic not found.' }, { status: 404 });
      }

      await db
        .prepare(
          `UPDATE subtopics SET covered = ?, covered_at = ?, updated_at = ?
          WHERE id = ?`,
        )
        .bind(covered ? 1 : 0, covered ? now : null, now, id)
        .run();

      const progress = await db
        .prepare(
          `SELECT COUNT(*) AS total,
            SUM(CASE WHEN covered = 1 THEN 1 ELSE 0 END) AS covered
          FROM subtopics WHERE topic_id = ?`,
        )
        .bind(subtopic.topic_id)
        .first<{ total: number; covered: number }>();
      const total = Number(progress?.total ?? 0);
      const coveredCount = Number(progress?.covered ?? 0);
      const status =
        total > 0 && coveredCount === total
          ? 'covered'
          : coveredCount > 0
            ? 'in_progress'
            : 'not_covered';

      await db
        .prepare('UPDATE topics SET status = ?, updated_at = ? WHERE id = ?')
        .bind(status, now, subtopic.topic_id)
        .run();

      return Response.json({
        ok: true,
        topicId: subtopic.topic_id,
        topicStatus: status,
        coveredCount,
        total,
      });
    }

    if (action === 'revise') {
      const id = stringField(body.id);
      const mark = stringField(body.mark);
      const revisedAt = stringField(body.revisedAt);
      const proof = stringField(body.proof).trim();
      const notes = stringField(body.notes).trim();
      const durationMinutes = boundedInteger(body.durationMinutes, 0, 0, 600);
      const reflection = stringField(body.reflection).trim();
      const mood = ['drained', 'foggy', 'steady', 'energized'].includes(
        stringField(body.mood),
      )
        ? stringField(body.mood)
        : 'steady';

      if (!id || !['R', 'H', 'M'].includes(mark)) {
        return Response.json(
          { error: 'Choose a valid topic and recall mark.' },
          { status: 400 },
        );
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(revisedAt)) {
        return Response.json(
          { error: 'Choose a valid revision date.' },
          { status: 400 },
        );
      }
      if (durationMinutes < 1) {
        return Response.json(
          { error: 'Enter how many minutes this revision took.' },
          { status: 400 },
        );
      }

      const [topic, settings] = await Promise.all([
        db
          .prepare(
            `SELECT recall_streak, revision_count, estimated_minutes
            FROM topics WHERE id = ?`,
          )
          .bind(id)
          .first<{
            recall_streak: number;
            revision_count: number;
            estimated_minutes: number;
          }>(),
        db
          .prepare(
            `SELECT missed_interval_days, hesitant_interval_days,
            recalled_first_days, recalled_second_days, recalled_mastered_days
          FROM revision_settings WHERE id = 'default'`,
          )
          .first<{
            missed_interval_days: number;
            hesitant_interval_days: number;
            recalled_first_days: number;
            recalled_second_days: number;
            recalled_mastered_days: number;
          }>(),
      ]);

      if (!topic) {
        return Response.json({ error: 'Topic not found.' }, { status: 404 });
      }

      const recallStreak = Number(topic.recall_streak ?? 0);
      const interval =
        mark === 'M'
          ? Number(settings?.missed_interval_days ?? 1)
          : mark === 'H'
            ? Number(settings?.hesitant_interval_days ?? 3)
            : recallStreak === 0
              ? Number(settings?.recalled_first_days ?? 7)
              : recallStreak === 1
                ? Number(settings?.recalled_second_days ?? 14)
                : Number(settings?.recalled_mastered_days ?? 30);
      const nextDueAt = addDays(revisedAt, interval);
      const nextStreak = mark === 'R' ? recallStreak + 1 : 0;
      const status = mark === 'R' ? 'covered' : 'in_progress';
      const priorCount = Number(topic.revision_count ?? 0);
      const priorEstimate = Number(topic.estimated_minutes ?? 30);
      const estimatedMinutes = Math.round(
        (priorEstimate * priorCount + durationMinutes) / (priorCount + 1),
      );

      await db.batch([
        db
          .prepare(
            `UPDATE topics SET status = ?, confidence = ?, last_revised_at = ?,
              next_due_at = ?, revision_count = revision_count + 1,
              recall_streak = ?, proof = ?, notes = ?, estimated_minutes = ?,
              updated_at = ?
            WHERE id = ?`,
          )
          .bind(
            status,
            mark,
            revisedAt,
            nextDueAt,
            nextStreak,
            proof,
            notes,
            estimatedMinutes,
            now,
            id,
          ),
        db
          .prepare(
            `INSERT INTO revisions (
              topic_id, mark, revised_at, next_due_at, proof, notes,
              duration_minutes, reflection, mood, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            mark,
            revisedAt,
            nextDueAt,
            proof,
            notes,
            durationMinutes,
            reflection,
            mood,
            now,
          ),
        ...(mark === 'R'
          ? [
              db
                .prepare(
                  `UPDATE subtopics SET covered = 1, covered_at = ?,
                    updated_at = ? WHERE topic_id = ?`,
                )
                .bind(now, now, id),
            ]
          : []),
      ]);

      return Response.json({ ok: true, nextDueAt, estimatedMinutes });
    }

    if (action === 'update_topic') {
      const id = stringField(body.id);
      const urgencyValue = stringField(body.urgencyOverride);
      const urgencyOverride = ['urgent', 'soon', 'ready'].includes(urgencyValue)
        ? urgencyValue
        : null;
      const priority = ['high', 'medium', 'normal'].includes(
        stringField(body.priority),
      )
        ? stringField(body.priority)
        : 'normal';
      const targetDate = stringField(body.targetDate) || null;
      const estimatedMinutes = boundedInteger(
        body.estimatedMinutes,
        30,
        5,
        240,
      );

      if (!id) {
        return Response.json({ error: 'Topic is required.' }, { status: 400 });
      }

      await db
        .prepare(
          `UPDATE topics SET urgency_override = ?, priority = ?,
            target_date = ?, estimated_minutes = ?, updated_at = ?
          WHERE id = ?`,
        )
        .bind(urgencyOverride, priority, targetDate, estimatedMinutes, now, id)
        .run();

      return Response.json({ ok: true });
    }

    if (action === 'update_settings') {
      const urgentWindowDays = boundedInteger(body.urgentWindowDays, 0, 0, 30);
      const yellowWindowDays = boundedInteger(
        body.yellowWindowDays,
        3,
        urgentWindowDays,
        60,
      );
      const missedIntervalDays = boundedInteger(
        body.missedIntervalDays,
        1,
        1,
        30,
      );
      const hesitantIntervalDays = boundedInteger(
        body.hesitantIntervalDays,
        3,
        1,
        60,
      );
      const recalledFirstDays = boundedInteger(
        body.recalledFirstDays,
        7,
        1,
        120,
      );
      const recalledSecondDays = boundedInteger(
        body.recalledSecondDays,
        14,
        recalledFirstDays,
        180,
      );
      const recalledMasteredDays = boundedInteger(
        body.recalledMasteredDays,
        30,
        recalledSecondDays,
        365,
      );

      await db
        .prepare(
          `UPDATE revision_settings SET urgent_window_days = ?,
            yellow_window_days = ?, missed_interval_days = ?,
            hesitant_interval_days = ?, recalled_first_days = ?,
            recalled_second_days = ?, recalled_mastered_days = ?,
            updated_at = ? WHERE id = 'default'`,
        )
        .bind(
          urgentWindowDays,
          yellowWindowDays,
          missedIntervalDays,
          hesitantIntervalDays,
          recalledFirstDays,
          recalledSecondDays,
          recalledMasteredDays,
          now,
        )
        .run();

      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not save revision data.' },
      { status: 500 },
    );
  }
}
