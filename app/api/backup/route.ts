import { parseRevisionBackup } from '@/lib/revision-backup';
import { getRevisionStore } from '@/lib/revision-store';

async function runInChunks(
  db: D1Database,
  statements: D1PreparedStatement[],
  chunkSize = 50,
) {
  for (let index = 0; index < statements.length; index += chunkSize) {
    await db.batch(statements.slice(index, index + chunkSize));
  }
}

export async function GET() {
  try {
    const db = await getRevisionStore();
    const [topics, subtopics, revisions, settings, todos, practice] =
      await Promise.all([
        db.prepare('SELECT * FROM topics ORDER BY id').all(),
        db
          .prepare('SELECT * FROM subtopics ORDER BY topic_id, sort_order, id')
          .all(),
        db.prepare('SELECT * FROM revisions ORDER BY revised_at, id').all(),
        db
          .prepare("SELECT * FROM revision_settings WHERE id = 'default'")
          .first(),
        db.prepare('SELECT * FROM todo_items ORDER BY created_at, id').all(),
        db
          .prepare(
            'SELECT * FROM hdlbits_practice_sessions ORDER BY started_at, id',
          )
          .all(),
      ]);
    return Response.json({
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      settings,
      topics: topics.results,
      subtopics: subtopics.results,
      revisions: revisions.results,
      todos: todos.results,
      hdlbitsPracticeSessions: practice.results,
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not create the backup.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 8_000_000) {
      return Response.json(
        { error: 'Backup file is larger than the 8 MB safety limit.' },
        { status: 413 },
      );
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return Response.json(
        { error: 'Backup is not valid JSON.' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const backup = parseRevisionBackup(json, now);
    const db = await getRevisionStore();

    await runInChunks(
      db,
      backup.topics.map((topic) =>
        db
          .prepare(
            `INSERT INTO topics (
              id, repository, subject, title, status, confidence, priority,
              target_date, last_revised_at, next_due_at, revision_count,
              recall_streak, proof, notes, urgency_override,
              estimated_minutes, source_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              repository = excluded.repository,
              subject = excluded.subject,
              title = excluded.title,
              status = excluded.status,
              confidence = excluded.confidence,
              priority = excluded.priority,
              target_date = excluded.target_date,
              last_revised_at = excluded.last_revised_at,
              next_due_at = excluded.next_due_at,
              revision_count = excluded.revision_count,
              recall_streak = excluded.recall_streak,
              proof = excluded.proof,
              notes = excluded.notes,
              urgency_override = excluded.urgency_override,
              estimated_minutes = excluded.estimated_minutes,
              source_url = excluded.source_url,
              updated_at = excluded.updated_at`,
          )
          .bind(
            topic.id,
            topic.repository,
            topic.subject,
            topic.title,
            topic.status,
            topic.confidence,
            topic.priority,
            topic.targetDate,
            topic.lastRevisedAt,
            topic.nextDueAt,
            topic.revisionCount,
            topic.recallStreak,
            topic.proof,
            topic.notes,
            topic.urgencyOverride,
            topic.estimatedMinutes,
            topic.sourceUrl,
            topic.createdAt,
            topic.updatedAt,
          ),
      ),
    );

    await runInChunks(
      db,
      backup.subtopics.map((subtopic) =>
        db
          .prepare(
            `INSERT INTO subtopics (
              id, topic_id, label, covered, covered_at, sort_order,
              source_url, created_at, updated_at
            ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM topics WHERE id = ?)
            ON CONFLICT(id) DO UPDATE SET
              topic_id = excluded.topic_id,
              label = excluded.label,
              covered = excluded.covered,
              covered_at = excluded.covered_at,
              sort_order = excluded.sort_order,
              source_url = excluded.source_url,
              updated_at = excluded.updated_at`,
          )
          .bind(
            subtopic.id,
            subtopic.topicId,
            subtopic.label,
            subtopic.covered,
            subtopic.coveredAt,
            subtopic.sortOrder,
            subtopic.sourceUrl,
            subtopic.createdAt,
            subtopic.updatedAt,
            subtopic.topicId,
          ),
      ),
    );

    await runInChunks(
      db,
      backup.revisions.map((revision) =>
        db
          .prepare(
            `INSERT INTO revisions (
              topic_id, mark, revised_at, next_due_at, proof, notes,
              duration_minutes, reflection, mood, mistake_category,
              repair_action, created_at
            ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE EXISTS (SELECT 1 FROM topics WHERE id = ?)
              AND NOT EXISTS (
                SELECT 1 FROM revisions
                WHERE topic_id = ? AND mark = ? AND revised_at = ?
                  AND created_at = ?
              )`,
          )
          .bind(
            revision.topicId,
            revision.mark,
            revision.revisedAt,
            revision.nextDueAt,
            revision.proof,
            revision.notes,
            revision.durationMinutes,
            revision.reflection,
            revision.mood,
            revision.mistakeCategory,
            revision.repairAction,
            revision.createdAt,
            revision.topicId,
            revision.topicId,
            revision.mark,
            revision.revisedAt,
            revision.createdAt,
          ),
      ),
    );

    await runInChunks(
      db,
      backup.todos.map((todo) =>
        db
          .prepare(
            `INSERT INTO todo_items (
              id, title, notes, category, priority, due_at, reminder_at,
              status, completed_at, archived_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              title = excluded.title,
              notes = excluded.notes,
              category = excluded.category,
              priority = excluded.priority,
              due_at = excluded.due_at,
              reminder_at = excluded.reminder_at,
              status = excluded.status,
              completed_at = excluded.completed_at,
              archived_at = excluded.archived_at,
              updated_at = excluded.updated_at`,
          )
          .bind(
            todo.id,
            todo.title,
            todo.notes,
            todo.category,
            todo.priority,
            todo.dueAt,
            todo.reminderAt,
            todo.status,
            todo.completedAt,
            todo.archivedAt,
            todo.createdAt,
            todo.updatedAt,
          ),
      ),
    );

    const newestActive = backup.hdlbitsPracticeSessions
      .filter((session) => session.status === 'active')
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]?.id;
    if (newestActive) {
      await db
        .prepare(
          `UPDATE hdlbits_practice_sessions SET status = 'abandoned',
            completed_at = COALESCE(completed_at, ?), updated_at = ?
          WHERE status = 'active'`,
        )
        .bind(now, now)
        .run();
    }
    await runInChunks(
      db,
      backup.hdlbitsPracticeSessions.map((session) => {
        const status =
          session.status === 'active' && session.id !== newestActive
            ? 'abandoned'
            : session.status;
        const completedAt =
          status === 'abandoned' && !session.completedAt
            ? session.updatedAt
            : session.completedAt;
        return db
          .prepare(
            `INSERT INTO hdlbits_practice_sessions (
              id, seed_question_id, question_ids, series_id, series_name,
              mode, focus, status, current_index, time_limit_minutes,
              outcome, started_at, completed_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              seed_question_id = excluded.seed_question_id,
              question_ids = excluded.question_ids,
              series_id = excluded.series_id,
              series_name = excluded.series_name,
              mode = excluded.mode,
              focus = excluded.focus,
              status = excluded.status,
              current_index = excluded.current_index,
              time_limit_minutes = excluded.time_limit_minutes,
              outcome = excluded.outcome,
              started_at = excluded.started_at,
              completed_at = excluded.completed_at,
              updated_at = excluded.updated_at`,
          )
          .bind(
            session.id,
            session.seedQuestionId,
            session.questionIds,
            session.seriesId,
            session.seriesName,
            session.mode,
            session.focus,
            status,
            session.currentIndex,
            session.timeLimitMinutes,
            session.outcome,
            session.startedAt,
            completedAt,
            session.updatedAt,
          );
      }),
    );

    const settings = backup.settings;
    await db
      .prepare(
        `UPDATE revision_settings SET
          urgent_window_days = ?, yellow_window_days = ?,
          missed_interval_days = ?, hesitant_interval_days = ?,
          recalled_first_days = ?, recalled_second_days = ?,
          recalled_mastered_days = ?, daily_goal_minutes = ?,
          focus_block_minutes = ?, updated_at = ?
        WHERE id = 'default'`,
      )
      .bind(
        settings.urgentWindowDays,
        settings.yellowWindowDays,
        settings.missedIntervalDays,
        settings.hesitantIntervalDays,
        settings.recalledFirstDays,
        settings.recalledSecondDays,
        settings.recalledMasteredDays,
        settings.dailyGoalMinutes,
        settings.focusBlockMinutes,
        now,
      )
      .run();

    return Response.json({
      ok: true,
      restored: {
        topics: backup.topics.length,
        subtopics: backup.subtopics.length,
        revisions: backup.revisions.length,
        todos: backup.todos.length,
        hdlbitsPracticeSessions: backup.hdlbitsPracticeSessions.length,
      },
      skipped: backup.skipped,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not restore backup.';
    const clientError =
      message.startsWith('Backup ') || message.includes('valid topics');
    if (!clientError) console.error(error);
    return Response.json(
      { error: clientError ? message : 'Could not restore backup.' },
      { status: clientError ? 400 : 500 },
    );
  }
}
