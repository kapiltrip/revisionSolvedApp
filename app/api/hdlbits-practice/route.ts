import {
  getHdlBitsQuestion,
  getHdlBitsQuestions,
  pickHdlBitsQuestion,
  sessionQuestionsFor,
  timeLimitFor,
  type HdlBitsFocus,
  type HdlBitsSessionMode,
} from '@/lib/hdlbits-question-engine';
import { getRevisionStore } from '@/lib/revision-store';

const focuses = new Set<HdlBitsFocus>([
  'all',
  'fundamentals',
  'combinational',
  'sequential',
  'fsm',
  'verification',
  'weak-spots',
]);
const modes = new Set<HdlBitsSessionMode>(['smart-series', 'single']);
const outcomes = new Set(['recalled', 'hesitant', 'missed']);

type SessionRow = {
  id: string;
  seed_question_id: string;
  question_ids: string;
  series_id: string | null;
  series_name: string | null;
  mode: HdlBitsSessionMode;
  focus: HdlBitsFocus;
  status: 'active' | 'completed' | 'abandoned';
  current_index: number;
  time_limit_minutes: number;
  outcome: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

function text(value: unknown, max: number, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function questionIdsFrom(row: SessionRow) {
  try {
    const parsed = JSON.parse(row.question_ids) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function presentSession(row: SessionRow) {
  const questions = getHdlBitsQuestions(questionIdsFrom(row));
  return {
    id: row.id,
    seedQuestionId: row.seed_question_id,
    seriesId: row.series_id,
    seriesName: row.series_name,
    mode: row.mode,
    focus: row.focus,
    status: row.status,
    currentIndex: Math.min(
      Math.max(0, row.current_index),
      Math.max(0, questions.length - 1),
    ),
    timeLimitMinutes: row.time_limit_minutes,
    outcome: row.outcome,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    questions,
  };
}

async function loadPracticeData(db: D1Database) {
  const [active, recent, summary] = await Promise.all([
    db
      .prepare(
        `SELECT id, seed_question_id, question_ids, series_id, series_name,
          mode, focus, status, current_index, time_limit_minutes, outcome,
          started_at, completed_at, updated_at
        FROM hdlbits_practice_sessions
        WHERE status = 'active'
        ORDER BY started_at DESC LIMIT 1`,
      )
      .first<SessionRow>(),
    db
      .prepare(
        `SELECT id, seed_question_id, question_ids, series_id, series_name,
          mode, focus, status, current_index, time_limit_minutes, outcome,
          started_at, completed_at, updated_at
        FROM hdlbits_practice_sessions
        WHERE status != 'active'
        ORDER BY started_at DESC LIMIT 6`,
      )
      .all<SessionRow>(),
    db
      .prepare(
        `SELECT COUNT(*) AS total_sessions,
          (SELECT COUNT(DISTINCT json_each.value)
            FROM hdlbits_practice_sessions AS sessions,
              json_each(sessions.question_ids)) AS questions_seen,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN outcome = 'recalled' THEN 1 ELSE 0 END) AS recalled
        FROM hdlbits_practice_sessions`,
      )
      .first<{
        total_sessions: number;
        questions_seen: number;
        completed: number;
        recalled: number;
      }>(),
  ]);
  return {
    active: active ? presentSession(active) : null,
    recent: recent.results.map(presentSession),
    summary: {
      totalSessions: Number(summary?.total_sessions ?? 0),
      questionsSeen: Number(summary?.questions_seen ?? 0),
      completed: Number(summary?.completed ?? 0),
      recalled: Number(summary?.recalled ?? 0),
    },
  };
}

export async function GET() {
  try {
    const db = await getRevisionStore();
    return Response.json(await loadPracticeData(db));
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not load HDLBits practice.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 40);
    const db = await getRevisionStore();
    const now = new Date().toISOString();

    if (action === 'draw') {
      const active = await db
        .prepare(
          `SELECT id FROM hdlbits_practice_sessions
          WHERE status = 'active' LIMIT 1`,
        )
        .first<{ id: string }>();
      if (active) {
        return Response.json(
          {
            error:
              'Finish or end the active HDLBits sprint before drawing another question.',
          },
          { status: 409 },
        );
      }
      const focusCandidate = text(body.focus, 40) as HdlBitsFocus;
      const modeCandidate = text(body.mode, 40) as HdlBitsSessionMode;
      const focus = focuses.has(focusCandidate) ? focusCandidate : 'all';
      const mode = modes.has(modeCandidate) ? modeCandidate : 'smart-series';
      const history = await db
        .prepare(
          `SELECT question_ids, started_at
          FROM hdlbits_practice_sessions
          ORDER BY started_at DESC LIMIT 1000`,
        )
        .all<{ question_ids: string; started_at: string }>();
      const question = pickHdlBitsQuestion({
        focus,
        history: history.results.flatMap((item) => {
          try {
            const ids = JSON.parse(item.question_ids) as unknown;
            return Array.isArray(ids)
              ? ids.flatMap((id) =>
                  typeof id === 'string'
                    ? [{ questionId: id, startedAt: item.started_at }]
                    : [],
                )
              : [];
          } catch {
            return [];
          }
        }),
      });
      const questions = sessionQuestionsFor(question, mode);
      const id = `hdl-session-${crypto.randomUUID()}`;
      const timeLimitMinutes = timeLimitFor(questions);
      await db
        .prepare(
          `INSERT INTO hdlbits_practice_sessions (
            id, seed_question_id, question_ids, series_id, series_name, mode,
            focus, status, current_index, time_limit_minutes, started_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`,
        )
        .bind(
          id,
          question.id,
          JSON.stringify(questions.map((item) => item.id)),
          mode === 'smart-series' ? question.seriesId : null,
          mode === 'smart-series' ? question.seriesName : null,
          mode,
          focus,
          timeLimitMinutes,
          now,
          now,
        )
        .run();
      const created = await db
        .prepare(
          `SELECT id, seed_question_id, question_ids, series_id, series_name,
            mode, focus, status, current_index, time_limit_minutes, outcome,
            started_at, completed_at, updated_at
          FROM hdlbits_practice_sessions WHERE id = ?`,
        )
        .bind(id)
        .first<SessionRow>();
      if (!created) throw new Error('Practice session was not created.');
      return Response.json({ ok: true, active: presentSession(created) });
    }

    if (action === 'set_part') {
      const id = text(body.id, 120);
      const session = await db
        .prepare(
          `SELECT id, question_ids FROM hdlbits_practice_sessions
          WHERE id = ? AND status = 'active'`,
        )
        .bind(id)
        .first<{ id: string; question_ids: string }>();
      if (!session) {
        return Response.json(
          { error: 'Active practice sprint not found.' },
          { status: 404 },
        );
      }
      let length = 1;
      try {
        const parsed = JSON.parse(session.question_ids) as unknown;
        length = Array.isArray(parsed) ? Math.max(1, parsed.length) : 1;
      } catch {
        length = 1;
      }
      const requested = Number(body.currentIndex);
      const currentIndex = Number.isFinite(requested)
        ? Math.min(length - 1, Math.max(0, Math.round(requested)))
        : 0;
      await db
        .prepare(
          `UPDATE hdlbits_practice_sessions
          SET current_index = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(currentIndex, now, id)
        .run();
      return Response.json({ ok: true, currentIndex });
    }

    if (action === 'complete') {
      const id = text(body.id, 120);
      const outcome = text(body.outcome, 30);
      if (!id || !outcomes.has(outcome)) {
        return Response.json(
          { error: 'Choose how the recall went.' },
          { status: 400 },
        );
      }
      const result = await db
        .prepare(
          `UPDATE hdlbits_practice_sessions SET status = 'completed',
            outcome = ?, completed_at = ?, updated_at = ?
          WHERE id = ? AND status = 'active'`,
        )
        .bind(outcome, now, now, id)
        .run();
      if (!result.meta.changes) {
        return Response.json(
          { error: 'Active practice sprint not found.' },
          { status: 404 },
        );
      }
      return Response.json({ ok: true, ...(await loadPracticeData(db)) });
    }

    if (action === 'abandon') {
      const id = text(body.id, 120);
      const result = await db
        .prepare(
          `UPDATE hdlbits_practice_sessions SET status = 'abandoned',
            completed_at = ?, updated_at = ?
          WHERE id = ? AND status = 'active'`,
        )
        .bind(now, now, id)
        .run();
      if (!result.meta.changes) {
        return Response.json(
          { error: 'Active practice sprint not found.' },
          { status: 404 },
        );
      }
      return Response.json({ ok: true, ...(await loadPracticeData(db)) });
    }

    const questionId = text(body.questionId, 40);
    if (questionId && !getHdlBitsQuestion(questionId)) {
      return Response.json({ error: 'Question not found.' }, { status: 404 });
    }
    return Response.json(
      { error: 'Unknown HDLBits practice action.' },
      { status: 400 },
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not update HDLBits practice.' },
      { status: 500 },
    );
  }
}
