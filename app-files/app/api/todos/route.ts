import { getRevisionStore } from '@/lib/revision-store';

const priorities = new Set(['high', 'normal', 'low']);
const statuses = new Set(['open', 'completed']);

function text(value: unknown, max: number, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, max) : fallback;
}

function timestamp(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export async function GET() {
  try {
    const db = await getRevisionStore();
    const todos = await db
      .prepare(
        `SELECT id, title, notes, category, priority, due_at, reminder_at,
          status, completed_at, created_at, updated_at
        FROM todo_items
        WHERE archived_at IS NULL
        ORDER BY status = 'completed',
          CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
          due_at IS NULL, due_at, created_at DESC`,
      )
      .all();
    return Response.json({ todos: todos.results });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not load your to-dos.' },
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

    if (action === 'add') {
      const title = text(body.title, 240);
      const notes = text(body.notes, 4000);
      const category = text(body.category, 80, 'Personal') || 'Personal';
      const priority = priorities.has(text(body.priority, 20))
        ? text(body.priority, 20)
        : 'normal';
      const dueAt = timestamp(body.dueAt);
      const reminderAt = timestamp(body.reminderAt);
      if (!title) {
        return Response.json(
          { error: 'Give the to-do a short title.' },
          { status: 400 },
        );
      }
      if (body.dueAt && !dueAt) {
        return Response.json(
          { error: 'The due date is not valid.' },
          { status: 400 },
        );
      }
      if (body.reminderAt && !reminderAt) {
        return Response.json(
          { error: 'The reminder time is not valid.' },
          { status: 400 },
        );
      }
      const id = `todo-${crypto.randomUUID()}`;
      await db
        .prepare(
          `INSERT INTO todo_items (
            id, title, notes, category, priority, due_at, reminder_at,
            status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)`,
        )
        .bind(id, title, notes, category, priority, dueAt, reminderAt, now, now)
        .run();
      return Response.json({ ok: true, id });
    }

    if (action === 'set_status') {
      const id = text(body.id, 120);
      const status = text(body.status, 20);
      if (!id || !statuses.has(status)) {
        return Response.json(
          { error: 'The to-do status is not valid.' },
          { status: 400 },
        );
      }
      const result = await db
        .prepare(
          `UPDATE todo_items SET status = ?, completed_at = ?, updated_at = ?
          WHERE id = ? AND archived_at IS NULL`,
        )
        .bind(status, status === 'completed' ? now : null, now, id)
        .run();
      if (!result.meta.changes) {
        return Response.json({ error: 'To-do not found.' }, { status: 404 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'update') {
      const id = text(body.id, 120);
      const title = text(body.title, 240);
      const notes = text(body.notes, 4000);
      const category = text(body.category, 80, 'Personal') || 'Personal';
      const priority = priorities.has(text(body.priority, 20))
        ? text(body.priority, 20)
        : 'normal';
      const dueAt = timestamp(body.dueAt);
      const reminderAt = timestamp(body.reminderAt);
      if (!id || !title) {
        return Response.json(
          { error: 'A to-do and title are required.' },
          { status: 400 },
        );
      }
      if ((body.dueAt && !dueAt) || (body.reminderAt && !reminderAt)) {
        return Response.json(
          { error: 'The due date or reminder time is not valid.' },
          { status: 400 },
        );
      }
      const result = await db
        .prepare(
          `UPDATE todo_items SET title = ?, notes = ?, category = ?,
            priority = ?, due_at = ?, reminder_at = ?, updated_at = ?
          WHERE id = ? AND archived_at IS NULL`,
        )
        .bind(title, notes, category, priority, dueAt, reminderAt, now, id)
        .run();
      if (!result.meta.changes) {
        return Response.json({ error: 'To-do not found.' }, { status: 404 });
      }
      return Response.json({ ok: true });
    }

    if (action === 'archive') {
      const id = text(body.id, 120);
      if (!id) {
        return Response.json({ error: 'To-do not found.' }, { status: 400 });
      }
      const result = await db
        .prepare(
          `UPDATE todo_items SET archived_at = ?, updated_at = ?
          WHERE id = ? AND archived_at IS NULL`,
        )
        .bind(now, now, id)
        .run();
      if (!result.meta.changes) {
        return Response.json({ error: 'To-do not found.' }, { status: 404 });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown to-do action.' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Could not save your to-do.' },
      { status: 500 },
    );
  }
}
