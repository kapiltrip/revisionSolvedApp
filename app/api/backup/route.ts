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
