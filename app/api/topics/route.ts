import { addDays, getRevisionStore } from '@/lib/revision-store';

function stringField(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export async function GET() {
  try {
    const db = await getRevisionStore();
    const [topics, revisions] = await Promise.all([
      db
        .prepare(
          `SELECT id, repository, subject, title, status, confidence, priority,
            target_date, last_revised_at, next_due_at, revision_count,
            recall_streak, proof, notes, source_url, created_at, updated_at
          FROM topics
          ORDER BY target_date IS NULL, target_date, repository, subject, title`,
        )
        .all(),
      db
        .prepare(
          `SELECT id, topic_id, mark, revised_at, next_due_at, proof, notes,
            created_at FROM revisions ORDER BY revised_at DESC, id DESC`,
        )
        .all(),
    ]);

    return Response.json({
      topics: topics.results,
      revisions: revisions.results,
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
            source_url, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          repository,
          subject,
          title,
          priority,
          targetDate,
          sourceUrl,
          now,
          now,
        )
        .run();

      return Response.json({ ok: true, id });
    }

    if (action === 'revise') {
      const id = stringField(body.id);
      const mark = stringField(body.mark);
      const revisedAt = stringField(body.revisedAt);
      const proof = stringField(body.proof).trim();
      const notes = stringField(body.notes).trim();

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

      const topic = await db
        .prepare(
          'SELECT recall_streak, revision_count FROM topics WHERE id = ?',
        )
        .bind(id)
        .first<{ recall_streak: number; revision_count: number }>();

      if (!topic) {
        return Response.json({ error: 'Topic not found.' }, { status: 404 });
      }

      const recallStreak = Number(topic.recall_streak ?? 0);
      const interval =
        mark === 'M'
          ? 1
          : mark === 'H'
            ? 3
            : recallStreak === 0
              ? 7
              : recallStreak === 1
                ? 14
                : 30;
      const nextDueAt = addDays(revisedAt, interval);
      const nextStreak = mark === 'R' ? recallStreak + 1 : 0;
      const status = mark === 'R' ? 'covered' : 'in_progress';

      await db.batch([
        db
          .prepare(
            `UPDATE topics SET status = ?, confidence = ?, last_revised_at = ?,
              next_due_at = ?, revision_count = revision_count + 1,
              recall_streak = ?, proof = ?, notes = ?, updated_at = ?
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
            now,
            id,
          ),
        db
          .prepare(
            `INSERT INTO revisions (
              topic_id, mark, revised_at, next_due_at, proof, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(id, mark, revisedAt, nextDueAt, proof, notes, now),
      ]);

      return Response.json({ ok: true, nextDueAt });
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
