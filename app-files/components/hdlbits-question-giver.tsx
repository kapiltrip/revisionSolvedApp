'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Flag,
  Layers3,
  RotateCcw,
  Shuffle,
  Sparkles,
  Timer,
  Trophy,
  X,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import type {
  HdlBitsDifficulty,
  HdlBitsFocus,
  HdlBitsQuestion,
  HdlBitsSessionMode,
} from '@/lib/hdlbits-question-engine';

type PracticeOutcome = 'recalled' | 'hesitant' | 'missed';

type PracticeSession = {
  id: string;
  seedQuestionId: string;
  seriesId: string | null;
  seriesName: string | null;
  mode: HdlBitsSessionMode;
  focus: HdlBitsFocus;
  status: 'active' | 'completed' | 'abandoned';
  currentIndex: number;
  timeLimitMinutes: number;
  outcome: PracticeOutcome | null;
  startedAt: string;
  completedAt: string | null;
  questions: HdlBitsQuestion[];
};

type PracticeSummary = {
  totalSessions: number;
  questionsSeen: number;
  completed: number;
  recalled: number;
};

const emptySummary: PracticeSummary = {
  totalSessions: 0,
  questionsSeen: 0,
  completed: 0,
  recalled: 0,
};

const focusLabels: Record<HdlBitsFocus, string> = {
  all: 'Whole archive',
  fundamentals: 'Verilog fundamentals',
  combinational: 'Combinational logic',
  sequential: 'Sequential logic',
  fsm: 'FSMs',
  verification: 'Debug and testbench',
  'weak-spots': 'My historical weak spots',
};

const difficultyLabels: Record<HdlBitsDifficulty, string> = {
  'warm-up': 'Warm-up',
  standard: 'Standard',
  challenge: 'Challenge',
};

function formatTimer(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function completionDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

export function HdlBitsQuestionGiver({ online }: { online: boolean }) {
  const [active, setActive] = useState<PracticeSession | null>(null);
  const [recent, setRecent] = useState<PracticeSession[]>([]);
  const [summary, setSummary] = useState<PracticeSummary>(emptySummary);
  const [focus, setFocus] = useState<HdlBitsFocus>('weak-spots');
  const [mode, setMode] = useState<HdlBitsSessionMode>('smart-series');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(() => Date.now());

  function applyData(data: {
    active?: PracticeSession | null;
    recent?: PracticeSession[];
    summary?: PracticeSummary;
  }) {
    if ('active' in data) setActive(data.active ?? null);
    if (data.recent) setRecent(data.recent);
    if (data.summary) setSummary(data.summary);
  }

  async function loadPractice() {
    setError('');
    try {
      const response = await fetch('/api/hdlbits-practice', {
        cache: 'no-store',
      });
      const data = (await response.json()) as {
        active?: PracticeSession | null;
        recent?: PracticeSession[];
        summary?: PracticeSummary;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not load HDLBits practice.');
      }
      applyData(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load HDLBits practice.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadPractice(), 0);
    const reload = () => void loadPractice();
    window.addEventListener('revision-solved:backup-restored', reload);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('revision-solved:backup-restored', reload);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [active]);

  async function postAction(payload: Record<string, unknown>) {
    if (!online) throw new Error('Reconnect to update practice.');
    const response = await fetch('/api/hdlbits-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      active?: PracticeSession | null;
      recent?: PracticeSession[];
      summary?: PracticeSummary;
      currentIndex?: number;
      error?: string;
    };
    if (!response.ok) {
      throw new Error(data.error ?? 'Could not update HDLBits practice.');
    }
    return data;
  }

  async function drawQuestion() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await postAction({ action: 'draw', focus, mode });
      applyData(data);
      setClock(Date.now());
      setMessage(
        mode === 'smart-series'
          ? 'Question ready. Related parts are grouped into one timed sprint.'
          : 'Question ready. Start from a blank editor.',
      );
    } catch (drawError) {
      setError(
        drawError instanceof Error
          ? drawError.message
          : 'Could not draw a question.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function setPart(index: number) {
    if (!active || index === active.currentIndex) return;
    setSaving(true);
    setError('');
    try {
      const data = await postAction({
        action: 'set_part',
        id: active.id,
        currentIndex: index,
      });
      setActive({ ...active, currentIndex: data.currentIndex ?? index });
    } catch (partError) {
      setError(
        partError instanceof Error
          ? partError.message
          : 'Could not change part.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function finish(outcome: PracticeOutcome) {
    if (!active) return;
    setSaving(true);
    setError('');
    try {
      const data = await postAction({
        action: 'complete',
        id: active.id,
        outcome,
      });
      applyData(data);
      setMessage(
        outcome === 'recalled'
          ? 'Recorded as recalled. Strong work.'
          : outcome === 'hesitant'
            ? 'Recorded as hesitant. It can return in another draw.'
            : 'Recorded as missed. This stays visible as a weak spot.',
      );
    } catch (finishError) {
      setError(
        finishError instanceof Error
          ? finishError.message
          : 'Could not finish the sprint.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function abandon() {
    if (!active) return;
    setSaving(true);
    setError('');
    try {
      const data = await postAction({ action: 'abandon', id: active.id });
      applyData(data);
      setMessage(
        'Sprint ended. You can draw a fresh question whenever you want.',
      );
    } catch (endError) {
      setError(
        endError instanceof Error
          ? endError.message
          : 'Could not end the sprint.',
      );
    } finally {
      setSaving(false);
    }
  }

  const currentQuestion = active?.questions[active.currentIndex] ?? null;
  const endTime = active
    ? new Date(active.startedAt).valueOf() + active.timeLimitMinutes * 60_000
    : 0;
  const remainingSeconds = active
    ? Math.max(0, Math.ceil((endTime - clock) / 1000))
    : 0;
  const timeExpired = Boolean(active && remainingSeconds === 0);
  const progress = active
    ? Math.min(
        100,
        Math.max(
          0,
          ((active.timeLimitMinutes * 60 - remainingSeconds) /
            (active.timeLimitMinutes * 60)) *
            100,
        ),
      )
    : 0;

  const successRate = useMemo(() => {
    if (!summary.completed) return 0;
    return Math.round((summary.recalled / summary.completed) * 100);
  }, [summary.completed, summary.recalled]);

  return (
    <section
      id="hdlbits-question-giver"
      className="question-giver"
      aria-labelledby="question-giver-heading"
    >
      <div className="question-giver-header">
        <div className="flex items-start gap-3">
          <div className="question-giver-mark" aria-hidden="true">
            <Zap />
          </div>
          <div>
            <p className="eyebrow-label text-orange-200">
              HDLBits question giver
            </p>
            <h2
              id="question-giver-heading"
              className="font-heading text-2xl font-bold tracking-tight text-white"
            >
              One click. One real challenge.
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-100/70">
              Draw from your 178-question archive. If it belongs to a series,
              every related part gets one honest shared time window.
            </p>
          </div>
        </div>
        <div className="question-summary" aria-label="HDLBits practice summary">
          <div>
            <strong>{summary.questionsSeen}</strong>
            <span>Seen</span>
          </div>
          <div>
            <strong>{summary.completed}</strong>
            <span>Sprints</span>
          </div>
          <div>
            <strong>{successRate}%</strong>
            <span>Recalled</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="question-loading">
          <Shuffle />
          <p>Preparing your question deck…</p>
        </div>
      ) : active && currentQuestion ? (
        <div className="question-active">
          <div className="question-stage">
            <div className="question-timer-row">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-100/55">
                  {timeExpired ? 'Time window complete' : 'Time remaining'}
                </p>
                <output
                  className={timeExpired ? 'expired' : ''}
                  aria-live="off"
                >
                  {formatTimer(remainingSeconds)}
                </output>
              </div>
              <div className="text-right">
                <span className="block text-sm font-semibold text-white">
                  {active.timeLimitMinutes} minutes total
                </span>
                <span className="text-xs text-blue-100/55">
                  {active.questions.length}{' '}
                  {active.questions.length === 1 ? 'question' : 'parts'}
                </span>
              </div>
            </div>
            <Progress value={progress} className="mt-3 h-1.5 bg-white/10" />

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge
                className="border-white/15 bg-white/8 text-blue-50"
                variant="outline"
              >
                #{String(currentQuestion.number).padStart(3, '0')}
              </Badge>
              <Badge
                className={`question-difficulty ${currentQuestion.difficulty}`}
                variant="outline"
              >
                {difficultyLabels[currentQuestion.difficulty]}
              </Badge>
              {active.seriesName && (
                <Badge
                  className="border-orange-200/30 bg-orange-300/10 text-orange-100"
                  variant="outline"
                >
                  <Layers3 /> {active.seriesName}
                </Badge>
              )}
            </div>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-orange-200/80">
              {active.questions.length > 1
                ? `Part ${active.currentIndex + 1} of ${active.questions.length}`
                : 'Your question'}
            </p>
            <h3 className="mt-2 font-heading text-3xl font-bold leading-tight text-white">
              {currentQuestion.title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-blue-100/70">
              Solve this from a blank editor. Keep your archived answer closed,
              compile or submit, and stop at the first mismatching signal if it
              fails.
            </p>
            <div className="question-context">
              <span>{currentQuestion.category}</span>
              {currentQuestion.section && (
                <span>{currentQuestion.section}</span>
              )}
              {currentQuestion.subsection && (
                <span>{currentQuestion.subsection}</span>
              )}
              <span>
                <Timer /> Suggested {currentQuestion.estimatedMinutes} min
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={currentQuestion.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-orange-300 px-3 text-sm font-semibold text-[#342000] transition-colors hover:bg-orange-200"
              >
                Open original question <ExternalLink />
              </a>
              {active.currentIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => void setPart(active.currentIndex - 1)}
                  disabled={saving}
                >
                  <ArrowLeft /> Previous
                </Button>
              )}
              {active.currentIndex < active.questions.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => void setPart(active.currentIndex + 1)}
                  disabled={saving}
                >
                  Next part <ArrowRight />
                </Button>
              )}
            </div>
          </div>

          <aside className="question-parts">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow-label">Sprint map</p>
                <h3 className="font-heading text-lg font-bold">
                  {active.seriesName ?? 'Single challenge'}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void abandon()}
                disabled={!online || saving}
                aria-label="End this sprint"
              >
                <X />
              </Button>
            </div>
            <div className="question-part-list">
              {active.questions.map((question, index) => (
                <button
                  type="button"
                  key={question.id}
                  className={index === active.currentIndex ? 'current' : ''}
                  onClick={() => void setPart(index)}
                  disabled={saving}
                >
                  <span>{index + 1}</span>
                  <div>
                    <b>{question.title}</b>
                    <small>
                      #{String(question.number).padStart(3, '0')} ·{' '}
                      {question.estimatedMinutes}m
                    </small>
                  </div>
                  {index < active.currentIndex && <CheckCircle2 />}
                </button>
              ))}
            </div>

            <div className="question-finish">
              <p>How did the whole sprint go?</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => void finish('recalled')}
                  disabled={!online || saving}
                >
                  <Trophy />
                  <b>Recalled</b>
                  <span>Blind</span>
                </button>
                <button
                  type="button"
                  onClick={() => void finish('hesitant')}
                  disabled={!online || saving}
                >
                  <CircleHelp />
                  <b>Hesitant</b>
                  <span>Some help</span>
                </button>
                <button
                  type="button"
                  onClick={() => void finish('missed')}
                  disabled={!online || saving}
                >
                  <Flag />
                  <b>Missed</b>
                  <span>Retry later</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="question-draw">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-200">
              Ready when you are
            </p>
            <h3 className="mt-2 font-heading text-3xl font-bold text-white">
              What should you solve next?
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/70">
              The deck prioritizes questions you have seen least. Weak-spots
              mode uses the real attempt history from your HDLBits archive.
            </p>
          </div>
          <div className="question-draw-controls">
            <label htmlFor="question-focus">
              <span>Choose an area</span>
              <NativeSelect
                id="question-focus"
                value={focus}
                onChange={(event) =>
                  setFocus(event.target.value as HdlBitsFocus)
                }
                className="w-full"
              >
                {Object.entries(focusLabels).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>
                    {label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <label htmlFor="question-series-mode">
              <span>When it belongs to a series</span>
              <NativeSelect
                id="question-series-mode"
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as HdlBitsSessionMode)
                }
                className="w-full"
              >
                <NativeSelectOption value="smart-series">
                  Give every related part
                </NativeSelectOption>
                <NativeSelectOption value="single">
                  Give only one question
                </NativeSelectOption>
              </NativeSelect>
            </label>
            <Button
              type="button"
              className="h-12 rounded-xl bg-orange-300 text-base text-[#342000] hover:bg-orange-200"
              onClick={() => void drawQuestion()}
              disabled={!online || saving}
            >
              {saving ? <RotateCcw className="animate-spin" /> : <Sparkles />}
              Give me a question
            </Button>
          </div>
        </div>
      )}

      {(error || message) && (
        <output className={`question-feedback ${error ? 'error' : ''}`}>
          {error || message}
        </output>
      )}

      {!active && recent.length > 0 && (
        <div className="question-recent">
          <p className="eyebrow-label text-blue-100/55">Recent draws</p>
          <div>
            {recent.slice(0, 4).map((session) => (
              <article key={session.id}>
                <span
                  className={`practice-outcome ${session.outcome ?? 'abandoned'}`}
                >
                  {session.outcome === 'recalled' ? (
                    <Trophy />
                  ) : session.outcome === 'hesitant' ? (
                    <CircleHelp />
                  ) : (
                    <Flag />
                  )}
                </span>
                <div>
                  <b>
                    {session.seriesName ??
                      session.questions[0]?.title ??
                      'HDLBits sprint'}
                  </b>
                  <small>
                    {session.questions.length}{' '}
                    {session.questions.length === 1 ? 'question' : 'parts'} ·{' '}
                    {completionDate(session.startedAt)}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
