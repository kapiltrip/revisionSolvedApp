'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Download,
  ExternalLink,
  Flame,
  History,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type Topic = {
  id: string;
  repository: 'revision-solved' | 'systemverilog-from-beginning';
  subject: string;
  title: string;
  status: 'not_covered' | 'in_progress' | 'covered';
  confidence: 'R' | 'H' | 'M' | null;
  priority: 'high' | 'medium' | 'normal';
  target_date: string | null;
  last_revised_at: string | null;
  next_due_at: string | null;
  revision_count: number;
  recall_streak: number;
  proof: string;
  notes: string;
  source_url: string | null;
};

type Revision = {
  id: number;
  topic_id: string;
  mark: 'R' | 'H' | 'M';
  revised_at: string;
  next_due_at: string;
  proof: string;
  notes: string;
};

type Urgency = 'urgent' | 'soon' | 'ready';

const repoLabels = {
  'revision-solved': 'RevisionSolved',
  'systemverilog-from-beginning': 'SystemVerilog from Beginning',
};

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateValue(date: string) {
  return new Date(`${date}T00:00:00`).getTime();
}

function daysUntil(date: string) {
  return Math.round((dateValue(date) - dateValue(localDate())) / 86_400_000);
}

function urgencyFor(topic: Topic): Urgency {
  const date = topic.next_due_at ?? topic.target_date;
  if (topic.confidence === 'M') return 'urgent';
  if (topic.confidence === 'H') return 'soon';
  if (!date) return topic.priority === 'high' ? 'urgent' : 'soon';
  const days = daysUntil(date);
  if (days <= 0) return 'urgent';
  if (days <= 3) return 'soon';
  return 'ready';
}

function formatDate(date: string | null, fallback = 'Not scheduled') {
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function dueCopy(topic: Topic) {
  const date = topic.next_due_at ?? topic.target_date;
  if (!date) return 'No date set';
  const days = daysUntil(date);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days}d`;
}

function statusLabel(topic: Topic) {
  if (topic.status === 'covered') return 'Covered';
  if (topic.status === 'in_progress') return 'In progress';
  return 'Not covered';
}

export function RevisionDashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [mark, setMark] = useState<'R' | 'H' | 'M'>('R');
  const [revisedAt, setRevisedAt] = useState(localDate());
  const [proof, setProof] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadTopics() {
    setError('');
    try {
      const response = await fetch('/api/topics', { cache: 'no-store' });
      const data = (await response.json()) as {
        topics?: Topic[];
        revisions?: Revision[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Could not load topics.');
      setTopics(data.topics ?? []);
      setRevisions(data.revisions ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Could not load topics.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTopics();
  }, []);

  const metrics = useMemo(() => {
    const covered = topics.filter((topic) => topic.status === 'covered').length;
    const untouched = topics.filter(
      (topic) => topic.status === 'not_covered',
    ).length;
    const urgent = topics.filter(
      (topic) => urgencyFor(topic) === 'urgent',
    ).length;
    const last = topics
      .map((topic) => topic.last_revised_at)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1);
    return { covered, untouched, urgent, last };
  }, [topics]);

  const prioritized = useMemo(() => {
    const rank = { urgent: 0, soon: 1, ready: 2 };
    return [...topics].sort((a, b) => {
      const urgencyDelta = rank[urgencyFor(a)] - rank[urgencyFor(b)];
      if (urgencyDelta) return urgencyDelta;
      const aDate = a.next_due_at ?? a.target_date ?? '9999-12-31';
      const bDate = b.next_due_at ?? b.target_date ?? '9999-12-31';
      return aDate.localeCompare(bDate) || a.title.localeCompare(b.title);
    });
  }, [topics]);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prioritized.filter((topic) => {
      const matchesQuery =
        !query ||
        `${topic.title} ${topic.subject} ${repoLabels[topic.repository]}`
          .toLowerCase()
          .includes(query);
      const matchesRepo =
        repoFilter === 'all' || topic.repository === repoFilter;
      const matchesStatus =
        statusFilter === 'all' || topic.status === statusFilter;
      return matchesQuery && matchesRepo && matchesStatus;
    });
  }, [prioritized, repoFilter, search, statusFilter]);

  function beginRevision(topic: Topic) {
    setSelectedTopic(topic);
    setMark(topic.confidence ?? 'R');
    setRevisedAt(localDate());
    setProof('');
    setRevisionNotes('');
    setError('');
  }

  async function recordRevision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTopic) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
          id: selectedTopic.id,
          mark,
          revisedAt,
          proof,
          notes: revisionNotes,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        nextDueAt?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Could not save revision.');
      setSelectedTopic(null);
      setMessage(
        `Revision saved. Next due ${formatDate(data.nextDueAt ?? null)}.`,
      );
      await loadTopics();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save revision.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function addTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          title: form.get('title'),
          subject: form.get('subject'),
          repository: form.get('repository'),
          priority: form.get('priority'),
          targetDate: form.get('targetDate'),
          sourceUrl: form.get('sourceUrl'),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not add topic.');
      setAddOpen(false);
      setMessage('Topic added to the revision ledger.');
      await loadTopics();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Could not add topic.',
      );
    } finally {
      setSaving(false);
    }
  }

  function exportBackup() {
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), topics, revisions },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `revision-solved-backup-${localDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Backup exported as JSON.');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpenCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-bold tracking-tight">Revision Solved</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Two repositories · one memory system</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="hidden h-10 rounded-xl sm:inline-flex" onClick={exportBackup} disabled={loading}>
              <Download /> Export backup
            </Button>
            <Button className="h-10 rounded-xl px-4" onClick={() => setAddOpen(true)}>
              <Plus /> Add topic
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-5 py-7 lg:px-8">
        <section className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
              {new Intl.DateTimeFormat('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Know exactly what to revise next.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Coverage, urgency and your last revision date—calculated from the input you record after every study session.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
            <a href="https://github.com/kapiltrip/RevisionAtlas" target="_blank" rel="noreferrer" className="repo-link">RevisionSolved <ExternalLink /></a>
            <a href="https://github.com/kapiltrip/systemverilog-from-beginning" target="_blank" rel="noreferrer" className="repo-link">SystemVerilog <ExternalLink /></a>
          </div>
        </section>

        {(error || message) && (
          <div aria-live="polite" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
            <div className="flex items-center justify-between gap-4">
              <span>{error || message}</span>
              <button className="text-xs font-semibold underline" onClick={() => { setError(''); setMessage(''); }}>Dismiss</button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingDashboard />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="metric-card">
                <div className="metric-icon bg-[#e7f6ed] text-[#176b3a]"><CheckCircle2 /></div>
                <p className="metric-label">Covered</p>
                <p className="metric-value">{metrics.covered} <span>/ {topics.length}</span></p>
                <Progress value={topics.length ? (metrics.covered / topics.length) * 100 : 0} className="mt-4" aria-label="Topic coverage" />
              </article>
              <article className="metric-card">
                <div className="metric-icon bg-[#fff4cf] text-[#8a6500]"><BookOpenCheck /></div>
                <p className="metric-label">Not covered</p>
                <p className="metric-value">{metrics.untouched}</p>
                <p className="metric-note">Across both repositories</p>
              </article>
              <article className="metric-card border-orange-200 bg-[#fff8ee]">
                <div className="metric-icon bg-[#ffe1bc] text-[#a84d00]"><Flame /></div>
                <p className="metric-label">Urgent now</p>
                <p className="metric-value text-[#9a4300]">{metrics.urgent}</p>
                <p className="metric-note text-[#9a4300]/75">Overdue, due today, or missed</p>
              </article>
              <article className="metric-card">
                <div className="metric-icon bg-[#e7efff] text-primary"><CalendarClock /></div>
                <p className="metric-label">Last revision</p>
                <p className="mt-3 text-xl font-bold tracking-tight">{formatDate(metrics.last ?? null, 'No session yet')}</p>
                <p className="metric-note">{metrics.last ? `${revisions.length} total revision records` : 'Record one to start the clock'}</p>
              </article>
            </section>

            <section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
              <article className="rounded-2xl border bg-card shadow-[0_12px_40px_rgb(27_49_77/5%)]">
                <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold">Revise next</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Highest urgency first · calculated automatically</p>
                  </div>
                  <Badge variant="outline">Top {Math.min(6, prioritized.length)}</Badge>
                </div>
                <div className="divide-y">
                  {prioritized.slice(0, 6).map((topic, index) => (
                    <div key={topic.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 sm:px-6">
                      <span className={`urgency-dot ${urgencyFor(topic)}`} aria-label={urgencyFor(topic)} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{topic.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{repoLabels[topic.repository]} · {topic.subject} · {dueCopy(topic)}</p>
                      </div>
                      <Button size="sm" variant={index === 0 ? 'default' : 'outline'} onClick={() => beginRevision(topic)}>Revise</Button>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="rounded-2xl border bg-[#061f4d] p-6 text-white shadow-[0_18px_50px_rgb(6_31_77/20%)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">How priority works</p>
                <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight">Three colors. One decision.</h2>
                <div className="mt-6 space-y-5 text-sm">
                  <div className="legend-row"><span className="urgency-dot urgent" /><div><b>Orange · revise now</b><p>Overdue, due today, or marked missed.</p></div></div>
                  <div className="legend-row"><span className="urgency-dot soon" /><div><b>Yellow · coming up</b><p>Due within three days or marked hesitant.</p></div></div>
                  <div className="legend-row"><span className="urgency-dot ready" /><div><b>Green · on track</b><p>Safely scheduled more than three days away.</p></div></div>
                </div>
                <div className="mt-7 rounded-xl border border-white/10 bg-white/7 p-4 text-xs leading-5 text-blue-100/80">
                  <Sparkles className="mb-2 size-4 text-yellow-300" />
                  R schedules 7 → 14 → 30 days. H returns in 3 days. M returns tomorrow.
                </div>
              </aside>
            </section>

            <section className="mt-7 rounded-2xl border bg-card shadow-[0_12px_40px_rgb(27_49_77/4%)]">
              <div className="border-b p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <h2 className="font-heading text-xl font-bold">All topics</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{filteredTopics.length} of {topics.length} topics shown</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input className="h-10 rounded-xl pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics" aria-label="Search topics" />
                    </div>
                    <NativeSelect className="w-full sm:w-52" value={repoFilter} onChange={(event) => setRepoFilter(event.target.value)} aria-label="Filter by repository">
                      <NativeSelectOption value="all">Both repositories</NativeSelectOption>
                      <NativeSelectOption value="revision-solved">RevisionSolved</NativeSelectOption>
                      <NativeSelectOption value="systemverilog-from-beginning">SystemVerilog</NativeSelectOption>
                    </NativeSelect>
                    <NativeSelect className="w-full sm:w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
                      <NativeSelectOption value="all">All statuses</NativeSelectOption>
                      <NativeSelectOption value="not_covered">Not covered</NativeSelectOption>
                      <NativeSelectOption value="in_progress">In progress</NativeSelectOption>
                      <NativeSelectOption value="covered">Covered</NativeSelectOption>
                    </NativeSelect>
                  </div>
                </div>
              </div>
              <div className="divide-y">
                {filteredTopics.map((topic) => (
                  <article key={topic.id} className="topic-row">
                    <span className={`urgency-dot ${urgencyFor(topic)}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold leading-5">{topic.title}</h3>
                        {topic.confidence && <Badge className={`mark-badge mark-${topic.confidence.toLowerCase()}`} variant="outline">{topic.confidence}</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{repoLabels[topic.repository]} · {topic.subject}</p>
                      {topic.proof && <p className="mt-2 line-clamp-1 text-xs text-foreground/70">Proof: {topic.proof}</p>}
                    </div>
                    <div className="hidden text-right text-xs sm:block">
                      <p className="font-semibold">{statusLabel(topic)}</p>
                      <p className="mt-1 text-muted-foreground">Last: {formatDate(topic.last_revised_at, 'Never')}</p>
                    </div>
                    <div className="hidden text-right text-xs lg:block">
                      <p className="font-semibold">{dueCopy(topic)}</p>
                      <p className="mt-1 text-muted-foreground">{formatDate(topic.next_due_at ?? topic.target_date)}</p>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {topic.source_url && <Button size="icon-sm" variant="ghost" render={<a href={topic.source_url} target="_blank" rel="noreferrer" aria-label={`Open source for ${topic.title}`} />}><ArrowUpRight /></Button>}
                      <Button size="sm" variant="outline" onClick={() => beginRevision(topic)}><RotateCcw /> Revise</Button>
                    </div>
                  </article>
                ))}
                {filteredTopics.length === 0 && (
                  <div className="p-10 text-center text-sm text-muted-foreground">No topics match these filters.</div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <Dialog open={Boolean(selectedTopic)} onOpenChange={(open) => !open && setSelectedTopic(null)}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={recordRevision}>
            <DialogHeader>
              <DialogTitle className="text-xl">Record this revision</DialogTitle>
              <DialogDescription>{selectedTopic?.title}</DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="input-label">How did recall go?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(['R', 'H', 'M'] as const).map((value) => (
                    <Button key={value} type="button" variant={mark === value ? 'default' : 'outline'} className="h-auto flex-col py-3" onClick={() => setMark(value)}>
                      <span className="text-base">{value}</span>
                      <span className="text-[10px] opacity-70">{value === 'R' ? 'Recalled' : value === 'H' ? 'Hesitant' : 'Missed'}</span>
                    </Button>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="input-label">Revision date</span>
                <Input type="date" value={revisedAt} onChange={(event) => setRevisedAt(event.target.value)} required />
              </label>
              <label className="block">
                <span className="input-label">Proof produced</span>
                <Textarea value={proof} onChange={(event) => setProof(event.target.value)} placeholder="Example: drew the AXI handshake and explained a stalled payload without notes" />
              </label>
              <label className="block">
                <span className="input-label">Weakest link / next repair</span>
                <Textarea value={revisionNotes} onChange={(event) => setRevisionNotes(event.target.value)} placeholder="What was still unclear, hesitant, or worth testing next?" />
              </label>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="h-10" disabled={saving}>{saving ? 'Saving…' : 'Save revision'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={addTopic}>
            <DialogHeader>
              <DialogTitle className="text-xl">Add a topic</DialogTitle>
              <DialogDescription>Add another trackable unit to either repository ledger.</DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className="input-label">Topic</span><Input name="title" placeholder="Example: AXI outstanding transactions" required /></label>
              <label className="block"><span className="input-label">Subject</span><Input name="subject" placeholder="AMBA AXI" required /></label>
              <label className="block"><span className="input-label">Repository</span><NativeSelect name="repository" className="w-full"><NativeSelectOption value="revision-solved">RevisionSolved</NativeSelectOption><NativeSelectOption value="systemverilog-from-beginning">SystemVerilog from Beginning</NativeSelectOption></NativeSelect></label>
              <label className="block"><span className="input-label">Priority</span><NativeSelect name="priority" className="w-full"><NativeSelectOption value="high">High</NativeSelectOption><NativeSelectOption value="medium">Medium</NativeSelectOption><NativeSelectOption value="normal">Normal</NativeSelectOption></NativeSelect></label>
              <label className="block"><span className="input-label">Target date</span><Input type="date" name="targetDate" /></label>
              <label className="block sm:col-span-2"><span className="input-label">Source link (optional)</span><Input type="url" name="sourceUrl" placeholder="https://github.com/…" /></label>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="h-10" disabled={saving}>{saving ? 'Adding…' : 'Add topic'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-7" aria-label="Loading revision dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-44 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
