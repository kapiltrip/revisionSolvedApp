'use client';

import {
  type SyntheticEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Pencil,
  Plus,
  RotateCcw,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type TodoPriority = 'high' | 'normal' | 'low';
type TodoFilter = 'open' | 'today' | 'upcoming' | 'completed';

type TodoItem = {
  id: string;
  title: string;
  notes: string;
  category: string;
  priority: TodoPriority;
  due_at: string | null;
  reminder_at: string | null;
  status: 'open' | 'completed';
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

const categoryOptions = ['Personal', 'Study', 'Work', 'Errand'];

function toIso(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || !value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.valueOf()) ? parsed.toISOString() : null;
}

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const shifted = new Date(date.valueOf() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function dayKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateTimeLabel(value: string | null) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PersonalTodo({ online }: { online: boolean }) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('open');
  const [editing, setEditing] = useState<TodoItem | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >('unsupported');
  const notified = useRef(new Set<string>());

  async function loadTodos() {
    setError('');
    try {
      const response = await fetch('/api/todos', { cache: 'no-store' });
      const data = (await response.json()) as {
        todos?: TodoItem[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Could not load to-dos.');
      setTodos(data.todos ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load to-dos.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTodos(), 0);
    const reload = () => void loadTodos();
    window.addEventListener('revision-solved:backup-restored', reload);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('revision-solved:backup-restored', reload);
    };
  }, []);

  useEffect(() => {
    const permissionTimeout = window.setTimeout(() => {
      if ('Notification' in window) {
        setNotificationPermission(window.Notification.permission);
      }
    }, 0);
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => {
      window.clearTimeout(permissionTimeout);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (notificationPermission !== 'granted') return;
    const current = now.valueOf();
    for (const todo of todos) {
      if (
        todo.status !== 'open' ||
        !todo.reminder_at ||
        notified.current.has(todo.id)
      ) {
        continue;
      }
      const reminder = new Date(todo.reminder_at).valueOf();
      if (reminder > current || reminder < current - 5 * 60_000) continue;
      notified.current.add(todo.id);
      void window.navigator.serviceWorker?.ready
        .then((registration) =>
          registration.showNotification('Revision Solved reminder', {
            body: todo.title,
            icon: '/favicon.svg',
            tag: todo.id,
          }),
        )
        .catch(() => undefined);
    }
  }, [notificationPermission, now, todos]);

  async function postAction(payload: Record<string, unknown>) {
    if (!online) throw new Error('Reconnect to save changes.');
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok)
      throw new Error(data.error ?? 'Could not save the to-do.');
  }

  async function addTodo(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const dueAt = toIso(data.get('dueAt'));
    try {
      await postAction({
        action: 'add',
        title: data.get('title'),
        category: data.get('category'),
        priority: data.get('priority'),
        dueAt,
        reminderAt: dueAt,
      });
      form.reset();
      setMessage('Saved. I’ll keep it on your list.');
      await loadTodos();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save to-do.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(todo: TodoItem, completed: boolean) {
    setSaving(true);
    setError('');
    try {
      await postAction({
        action: 'set_status',
        id: todo.id,
        status: completed ? 'completed' : 'open',
      });
      setMessage(
        completed ? 'Done — nice work.' : 'Moved back to your open list.',
      );
      await loadTodos();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not update to-do.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateTodo(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      await postAction({
        action: 'update',
        id: editing.id,
        title: data.get('title'),
        notes: data.get('notes'),
        category: data.get('category'),
        priority: data.get('priority'),
        dueAt: toIso(data.get('dueAt')),
        reminderAt: toIso(data.get('reminderAt')),
      });
      setEditing(null);
      setMessage('To-do updated.');
      await loadTodos();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not update to-do.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function enableReminders() {
    if (!('Notification' in window)) {
      setMessage('This browser does not support task alerts.');
      return;
    }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    setMessage(
      permission === 'granted'
        ? 'Reminders are on while the app is running.'
        : 'Reminder permission was not enabled.',
    );
  }

  const today = dayKey(now);
  const stats = useMemo(() => {
    const open = todos.filter((todo) => todo.status === 'open');
    return {
      open: open.length,
      today: open.filter(
        (todo) => todo.due_at && dayKey(new Date(todo.due_at)) === today,
      ).length,
      overdue: open.filter(
        (todo) =>
          todo.due_at && new Date(todo.due_at).valueOf() < now.valueOf(),
      ).length,
    };
  }, [now, todos, today]);

  const visible = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === 'completed') return todo.status === 'completed';
      if (todo.status !== 'open') return false;
      if (filter === 'today') {
        return Boolean(todo.due_at && dayKey(new Date(todo.due_at)) === today);
      }
      if (filter === 'upcoming') {
        return Boolean(
          todo.due_at && new Date(todo.due_at).valueOf() > now.valueOf(),
        );
      }
      return true;
    });
  }, [filter, now, todos, today]);

  return (
    <section
      id="personal-todos"
      className="todo-command"
      aria-labelledby="todo-heading"
    >
      <div className="todo-command-top">
        <div className="flex items-start gap-3">
          <div className="todo-mark" aria-hidden="true">
            <ClipboardList />
          </div>
          <div>
            <p className="eyebrow-label">For me</p>
            <h2
              id="todo-heading"
              className="font-heading text-2xl font-bold tracking-tight"
            >
              Remember what matters
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
              Capture it quickly, give it a deadline, and keep it here until it
              is done.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => void enableReminders()}
          disabled={notificationPermission === 'granted'}
        >
          {notificationPermission === 'granted' ? <BellRing /> : <Bell />}
          {notificationPermission === 'granted' ? 'Alerts on' : 'Enable alerts'}
        </Button>
      </div>

      <div className="todo-stats" aria-label="To-do summary">
        <div>
          <strong>{stats.open}</strong>
          <span>Open</span>
        </div>
        <div>
          <strong>{stats.today}</strong>
          <span>Due today</span>
        </div>
        <div className={stats.overdue ? 'has-overdue' : ''}>
          <strong>{stats.overdue}</strong>
          <span>Overdue</span>
        </div>
      </div>

      <form className="todo-quick-add" onSubmit={addTodo}>
        <label className="sr-only" htmlFor="todo-quick-title">
          New to-do
        </label>
        <Input
          id="todo-quick-title"
          name="title"
          placeholder="What do you need to remember?"
          className="h-11 rounded-xl bg-card"
          required
          maxLength={240}
          disabled={!online || saving}
        />
        <label className="sr-only" htmlFor="todo-quick-due">
          Due date and time
        </label>
        <Input
          id="todo-quick-due"
          name="dueAt"
          type="datetime-local"
          className="h-11 rounded-xl bg-card"
          disabled={!online || saving}
        />
        <label className="sr-only" htmlFor="todo-quick-category">
          Category
        </label>
        <NativeSelect
          id="todo-quick-category"
          name="category"
          defaultValue="Personal"
          disabled={!online || saving}
          className="w-full"
        >
          {categoryOptions.map((category) => (
            <NativeSelectOption key={category}>{category}</NativeSelectOption>
          ))}
        </NativeSelect>
        <label className="sr-only" htmlFor="todo-quick-priority">
          Priority
        </label>
        <NativeSelect
          id="todo-quick-priority"
          name="priority"
          defaultValue="normal"
          disabled={!online || saving}
          className="w-full"
        >
          <NativeSelectOption value="high">High priority</NativeSelectOption>
          <NativeSelectOption value="normal">
            Normal priority
          </NativeSelectOption>
          <NativeSelectOption value="low">Low priority</NativeSelectOption>
        </NativeSelect>
        <Button
          className="h-11 rounded-xl"
          type="submit"
          disabled={!online || saving}
        >
          <Plus /> Add
        </Button>
      </form>

      {(error || message) && (
        <output className={`todo-feedback ${error ? 'error' : ''}`}>
          {error || message}
        </output>
      )}

      <div className="todo-filter-row" aria-label="Filter to-dos">
        {(
          [
            ['open', `Open · ${stats.open}`],
            ['today', `Today · ${stats.today}`],
            ['upcoming', 'Upcoming'],
            ['completed', 'Completed'],
          ] as Array<[TodoFilter, string]>
        ).map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={filter === value ? 'selected' : ''}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="todo-list" aria-live="polite">
        {loading ? (
          <div className="todo-empty">
            <Clock3 />
            <p>Loading your list…</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="todo-empty">
            <CheckCircle2 />
            <p>
              {filter === 'completed'
                ? 'Nothing completed yet.'
                : 'This list is clear.'}
            </p>
            <span>Add one thing above so it stops living in your head.</span>
          </div>
        ) : (
          visible.map((todo) => {
            const overdue = Boolean(
              todo.status === 'open' &&
              todo.due_at &&
              new Date(todo.due_at).valueOf() < now.valueOf(),
            );
            return (
              <article
                key={todo.id}
                className={`todo-item ${todo.status} ${overdue ? 'overdue' : ''}`}
              >
                <Checkbox
                  checked={todo.status === 'completed'}
                  onCheckedChange={(checked) =>
                    void setStatus(todo, checked === true)
                  }
                  disabled={!online || saving}
                  aria-label={`${todo.status === 'completed' ? 'Reopen' : 'Complete'} ${todo.title}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3>{todo.title}</h3>
                    {todo.priority === 'high' && (
                      <Badge variant="outline" className="todo-priority-high">
                        High
                      </Badge>
                    )}
                  </div>
                  {todo.notes && <p className="todo-notes">{todo.notes}</p>}
                  <div className="todo-meta">
                    <span>
                      <CalendarDays /> {dateTimeLabel(todo.due_at)}
                    </span>
                    <span>{todo.category}</span>
                    {overdue && (
                      <span className="overdue-label">
                        <CircleAlert /> Overdue
                      </span>
                    )}
                    {todo.reminder_at && (
                      <span>
                        <Bell /> Reminder set
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(todo)}
                  disabled={!online || saving}
                  aria-label={`Edit ${todo.title}`}
                >
                  <Pencil />
                </Button>
                {todo.status === 'completed' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void setStatus(todo, false)}
                    disabled={!online || saving}
                    aria-label={`Move ${todo.title} back to open`}
                  >
                    <RotateCcw />
                  </Button>
                )}
              </article>
            );
          })
        )}
      </div>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit to-do</DialogTitle>
            <DialogDescription>
              Refine the task, deadline, and reminder.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              id="todo-edit-form"
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={updateTodo}
            >
              <label className="sm:col-span-2" htmlFor="todo-edit-title">
                <span className="input-label">Title</span>
                <Input
                  id="todo-edit-title"
                  name="title"
                  defaultValue={editing.title}
                  required
                  maxLength={240}
                />
              </label>
              <label htmlFor="todo-edit-category">
                <span className="input-label">Category</span>
                <NativeSelect
                  id="todo-edit-category"
                  name="category"
                  defaultValue={editing.category}
                  className="w-full"
                >
                  {categoryOptions.map((category) => (
                    <NativeSelectOption key={category}>
                      {category}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label htmlFor="todo-edit-priority">
                <span className="input-label">Priority</span>
                <NativeSelect
                  id="todo-edit-priority"
                  name="priority"
                  defaultValue={editing.priority}
                  className="w-full"
                >
                  <NativeSelectOption value="high">High</NativeSelectOption>
                  <NativeSelectOption value="normal">Normal</NativeSelectOption>
                  <NativeSelectOption value="low">Low</NativeSelectOption>
                </NativeSelect>
              </label>
              <label htmlFor="todo-edit-due">
                <span className="input-label">Due</span>
                <Input
                  id="todo-edit-due"
                  name="dueAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(editing.due_at)}
                />
              </label>
              <label htmlFor="todo-edit-reminder">
                <span className="input-label">Remind me</span>
                <Input
                  id="todo-edit-reminder"
                  name="reminderAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(editing.reminder_at)}
                />
              </label>
              <label className="sm:col-span-2" htmlFor="todo-edit-notes">
                <span className="input-label">Notes</span>
                <Textarea
                  id="todo-edit-notes"
                  name="notes"
                  defaultValue={editing.notes}
                  rows={4}
                  maxLength={4000}
                />
              </label>
            </form>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button form="todo-edit-form" type="submit" disabled={saving}>
              <Check /> Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
