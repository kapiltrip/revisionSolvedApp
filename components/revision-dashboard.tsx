'use client';

import { type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BatteryLow,
  BookOpenCheck,
  Brain,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  CloudSun,
  Download,
  ExternalLink,
  Flame,
  Gauge,
  GitBranch,
  HardDriveDownload,
  Layers3,
  Pencil,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TerminalSquare,
  Timer,
  Upload,
  Wifi,
  WifiOff,
  Wrench,
  Zap,
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
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PwaInstallButton } from '@/components/pwa-install';
import { buildLearningAnalytics } from '@/lib/revision-analytics';
import {
  daysUntil,
  localDate,
  urgencyForTopic,
  type RevisionTimingSettings,
} from '@/lib/revision-engine';

type Urgency = 'urgent' | 'soon' | 'ready';
type Mood = 'drained' | 'foggy' | 'steady' | 'energized';
type Repository =
  | 'revision-solved'
  | 'systemverilog-from-beginning'
  | 'cpp-and-scripting-practice'
  | 'hdlbits';

type Topic = {
  id: string;
  repository: Repository;
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
  urgency_override: Urgency | null;
  estimated_minutes: number;
  source_url: string | null;
};

type Subtopic = {
  id: string;
  topic_id: string;
  label: string;
  covered: boolean | number;
  covered_at: string | null;
  sort_order: number;
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
  duration_minutes: number;
  reflection: string;
  mood: Mood;
  mistake_category: MistakeCategory;
  repair_action: string;
  created_at: string;
};

type MistakeCategory =
  | 'none'
  | 'syntax'
  | 'logic'
  | 'timing'
  | 'state'
  | 'interface'
  | 'verification'
  | 'memory';

type RevisionSettings = RevisionTimingSettings & {
  daily_goal_minutes: number;
  focus_block_minutes: number;
};

type FocusSession = {
  topicId: string;
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
  endsAt: number | null;
};

const defaultSettings: RevisionSettings = {
  urgent_window_days: 0,
  yellow_window_days: 3,
  missed_interval_days: 1,
  hesitant_interval_days: 3,
  recalled_first_days: 7,
  recalled_second_days: 14,
  recalled_mastered_days: 30,
  daily_goal_minutes: 60,
  focus_block_minutes: 30,
};

const mistakeOptions: Array<{
  value: MistakeCategory;
  label: string;
  hint: string;
}> = [
  { value: 'none', label: 'No specific mistake', hint: 'Recall was clean' },
  {
    value: 'syntax',
    label: 'Syntax / operator',
    hint: 'Language form was wrong',
  },
  {
    value: 'logic',
    label: 'Logic / equation',
    hint: 'Behavioral reasoning failed',
  },
  {
    value: 'timing',
    label: 'Timing / waveform',
    hint: 'Cycle or edge was misplaced',
  },
  {
    value: 'state',
    label: 'State / sequence',
    hint: 'Transition memory failed',
  },
  {
    value: 'interface',
    label: 'Interface / protocol',
    hint: 'Contract or handshake failed',
  },
  {
    value: 'verification',
    label: 'Verification / proof',
    hint: 'Test strategy was weak',
  },
  {
    value: 'memory',
    label: 'Memory lapse',
    hint: 'Known idea would not surface',
  },
];

const mistakeLabels = Object.fromEntries(
  mistakeOptions.map((option) => [option.value, option.label]),
) as Record<MistakeCategory, string>;

const repositoryMeta: Record<
  Repository,
  {
    label: string;
    shortLabel: string;
    description: string;
    url: string;
    accentClass: string;
  }
> = {
  'revision-solved': {
    label: 'RevisionSolved',
    shortLabel: 'Core notes',
    description: 'Digital design, protocols, timing, CMOS and architecture.',
    url: 'https://github.com/kapiltrip/RevisionAtlas',
    accentClass: 'repo-accent-navy',
  },
  'systemverilog-from-beginning': {
    label: 'SystemVerilog from Beginning',
    shortLabel: 'SV practice',
    description: 'Language, assertions and functional coverage practice.',
    url: 'https://github.com/kapiltrip/systemverilog-from-beginning',
    accentClass: 'repo-accent-blue',
  },
  'cpp-and-scripting-practice': {
    label: 'C++ & Scripting Practice',
    shortLabel: 'Automation',
    description: 'Modern C++, Perl, shell, regex and EDA automation.',
    url: 'https://github.com/kapiltrip/cpp-and-scripting-practice',
    accentClass: 'repo-accent-green',
  },
  hdlbits: {
    label: 'HDLBits',
    shortLabel: '178 problems',
    description: 'Solved RTL archive, revision batches and weakness lab.',
    url: 'https://github.com/kapiltrip/hdlBits',
    accentClass: 'repo-accent-orange',
  },
};

const repositories = Object.keys(repositoryMeta) as Repository[];
const repoLabels = Object.fromEntries(
  repositories.map((repository) => [
    repository,
    repositoryMeta[repository].label,
  ]),
) as Record<Repository, string>;

const hdlBitsLinks = {
  repository: 'https://github.com/kapiltrip/hdlBits',
  revisionSheet:
    'https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%201/REVISION_SHEET.md',
  archive:
    'https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%201/study/README.md',
  mistakes:
    'https://github.com/kapiltrip/hdlBits/blob/main/HDLBits%20Attempt%201/study/Mistakes.md',
};

function subtopicIsCovered(subtopic: Subtopic) {
  return subtopic.covered === true || subtopic.covered === 1;
}

const moodOptions = [
  {
    value: 'drained' as const,
    label: 'Drained',
    hint: 'One gentle win',
    icon: BatteryLow,
  },
  {
    value: 'foggy' as const,
    label: 'Foggy',
    hint: 'Warm up first',
    icon: CloudSun,
  },
  {
    value: 'steady' as const,
    label: 'Steady',
    hint: 'Balanced session',
    icon: Gauge,
  },
  {
    value: 'energized' as const,
    label: 'Energized',
    hint: 'Take on a hard one',
    icon: Zap,
  },
];

function urgencyFor(topic: Topic, settings: RevisionSettings): Urgency {
  return urgencyForTopic(topic, settings);
}

function formatDate(date: string | null, fallback = 'Not scheduled') {
  if (!date) return fallback;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatMinutes(minutes: number) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function formatTimer(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
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

function topicContext(topic: Topic) {
  const subject =
    topic.repository === 'hdlbits'
      ? topic.subject.replace(/^HDLBits · /, '')
      : topic.subject;
  return `${repoLabels[topic.repository]} · ${subject}`;
}

function reasonFor(topic: Topic, settings: RevisionSettings) {
  if (topic.urgency_override === 'urgent') return 'You pinned this to orange';
  if (topic.confidence === 'M') return 'Last recall was missed';
  if (topic.confidence === 'H') return 'Last recall was hesitant';
  if (!topic.last_revised_at) return 'Never revised — close this blind spot';
  if (urgencyFor(topic, settings) === 'urgent')
    return `${dueCopy(topic)} — memory needs attention`;
  if (urgencyFor(topic, settings) === 'soon')
    return `${dueCopy(topic)} — protect the memory now`;
  return `Last done ${formatDate(topic.last_revised_at)} — keep the streak alive`;
}

export function RevisionDashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [tuningTopic, setTuningTopic] = useState<Topic | null>(null);
  const [mark, setMark] = useState<'R' | 'H' | 'M'>('R');
  const [revisedAt, setRevisedAt] = useState(localDate());
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [sessionMood, setSessionMood] = useState<Mood>('steady');
  const [proof, setProof] = useState('');
  const [reflection, setReflection] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [mistakeCategory, setMistakeCategory] =
    useState<MistakeCategory>('none');
  const [repairAction, setRepairAction] = useState('');
  const [studyMinutes, setStudyMinutes] = useState(45);
  const [feeling, setFeeling] = useState<Mood>('steady');
  const [saving, setSaving] = useState(false);
  const [checkingSubtopic, setCheckingSubtopic] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);
  const [backupPayload, setBackupPayload] = useState('');
  const [backupFileName, setBackupFileName] = useState('');
  const [backupSummary, setBackupSummary] = useState<{
    topics: number;
    subtopics: number;
    revisions: number;
  } | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    () => new Set(),
  );

  async function loadTopics() {
    setError('');
    try {
      const response = await fetch('/api/topics', { cache: 'no-store' });
      const data = (await response.json()) as {
        topics?: Topic[];
        subtopics?: Subtopic[];
        revisions?: Revision[];
        settings?: RevisionSettings;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Could not load topics.');
      setTopics(data.topics ?? []);
      setSubtopics(data.subtopics ?? []);
      setRevisions(data.revisions ?? []);
      setSettings(data.settings ?? defaultSettings);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load topics.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTopics(), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const updateConnection = () => setOnline(window.navigator.onLine);
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('revision-solved-focus-v1');
      if (!saved) return;
      const parsed = JSON.parse(saved) as FocusSession;
      if (
        typeof parsed.topicId !== 'string' ||
        !Number.isFinite(parsed.totalSeconds) ||
        !Number.isFinite(parsed.remainingSeconds)
      ) {
        return;
      }
      const remaining =
        parsed.running && parsed.endsAt
          ? Math.max(0, Math.ceil((parsed.endsAt - Date.now()) / 1000))
          : Math.max(0, parsed.remainingSeconds);
      const timeout = window.setTimeout(
        () =>
          setFocusSession({
            ...parsed,
            remainingSeconds: remaining,
            running: parsed.running && remaining > 0,
            endsAt: parsed.running && remaining > 0 ? parsed.endsAt : null,
          }),
        0,
      );
      return () => window.clearTimeout(timeout);
    } catch {
      window.localStorage.removeItem('revision-solved-focus-v1');
    }
  }, []);

  useEffect(() => {
    if (!focusSession) {
      window.localStorage.removeItem('revision-solved-focus-v1');
      return;
    }
    window.localStorage.setItem(
      'revision-solved-focus-v1',
      JSON.stringify(focusSession),
    );
  }, [focusSession]);

  useEffect(() => {
    if (!focusSession?.running || !focusSession.endsAt) return;
    const tick = () => {
      setFocusSession((current) => {
        if (!current?.running || !current.endsAt) return current;
        const remaining = Math.max(
          0,
          Math.ceil((current.endsAt - Date.now()) / 1000),
        );
        if (remaining === 0) {
          setMessage('Focus block complete. Record what you could recall.');
          return {
            ...current,
            remainingSeconds: 0,
            running: false,
            endsAt: null,
          };
        }
        return { ...current, remainingSeconds: remaining };
      });
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [focusSession?.endsAt, focusSession?.running]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === '/') {
        event.preventDefault();
        document.getElementById('topic-search')?.focus();
      } else if (event.key.toLowerCase() === 'n') {
        setAddOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const topicById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );

  const subtopicsByTopic = useMemo(() => {
    const groups = new Map<string, Subtopic[]>();
    for (const subtopic of subtopics) {
      const group = groups.get(subtopic.topic_id) ?? [];
      group.push(subtopic);
      groups.set(subtopic.topic_id, group);
    }
    return groups;
  }, [subtopics]);

  const metrics = useMemo(() => {
    const covered = topics.filter((topic) => topic.status === 'covered').length;
    const untouched = topics.filter(
      (topic) => topic.status === 'not_covered',
    ).length;
    const urgent = topics.filter(
      (topic) => urgencyFor(topic, settings) === 'urgent',
    ).length;
    const last = topics
      .map((topic) => topic.last_revised_at)
      .filter((date): date is string => Boolean(date))
      .sort()
      .at(-1);
    const totalMinutes = revisions.reduce(
      (sum, revision) => sum + Number(revision.duration_minutes || 0),
      0,
    );
    const timedSessions = revisions.filter(
      (revision) => Number(revision.duration_minutes || 0) > 0,
    );
    return {
      covered,
      untouched,
      urgent,
      last,
      totalMinutes,
      averageMinutes: timedSessions.length
        ? Math.round(totalMinutes / timedSessions.length)
        : 0,
    };
  }, [revisions, settings, topics]);

  const prioritized = useMemo(() => {
    const rank = { urgent: 0, soon: 1, ready: 2 };
    return [...topics].sort((a, b) => {
      const urgencyDelta =
        rank[urgencyFor(a, settings)] - rank[urgencyFor(b, settings)];
      if (urgencyDelta) return urgencyDelta;
      const confidenceRank = { M: 0, H: 1, R: 2 };
      const confidenceDelta =
        (a.confidence ? confidenceRank[a.confidence] : 0) -
        (b.confidence ? confidenceRank[b.confidence] : 0);
      if (confidenceDelta) return confidenceDelta;
      const aDate = a.next_due_at ?? a.target_date ?? '9999-12-31';
      const bDate = b.next_due_at ?? b.target_date ?? '9999-12-31';
      return aDate.localeCompare(bDate) || a.title.localeCompare(b.title);
    });
  }, [settings, topics]);

  const sessionPlan = useMemo(() => {
    const rank = { urgent: 0, soon: 1, ready: 2 };
    const moodAdjustment = (topic: Topic) => {
      if (feeling === 'drained') {
        return (
          (topic.confidence === 'R' ? -4 : 0) +
          (topic.estimated_minutes <= 25 ? -3 : 0)
        );
      }
      if (feeling === 'foggy') return topic.status === 'in_progress' ? -3 : 0;
      if (feeling === 'energized') {
        return (
          (topic.confidence === 'M' ? -5 : 0) +
          (topic.status === 'not_covered' ? -3 : 0) +
          (topic.priority === 'high' ? -2 : 0)
        );
      }
      return topic.confidence === 'H' ? -2 : 0;
    };
    const candidates = [...prioritized].sort(
      (a, b) =>
        rank[urgencyFor(a, settings)] * 10 +
        moodAdjustment(a) -
        (rank[urgencyFor(b, settings)] * 10 + moodAdjustment(b)),
    );
    const breakMinutes = studyMinutes >= 45 ? 5 : 0;
    let remaining = Math.max(10, studyMinutes - breakMinutes);
    const maximumTopics =
      feeling === 'drained' ? 1 : feeling === 'energized' ? 3 : 2;
    const plan: Array<{ topic: Topic; minutes: number; reason: string }> = [];
    for (const topic of candidates) {
      if (plan.length >= maximumTopics || remaining < 10) break;
      const estimate = Math.max(10, Number(topic.estimated_minutes || 30));
      if (plan.length > 0 && estimate > remaining + 10) continue;
      const minutes = Math.min(estimate, remaining);
      plan.push({ topic, minutes, reason: reasonFor(topic, settings) });
      remaining -= minutes;
    }
    return { plan, breakMinutes, unusedMinutes: remaining };
  }, [feeling, prioritized, settings, studyMinutes]);

  const subjectStats = useMemo(() => {
    const timeByTopic = new Map<string, number>();
    for (const revision of revisions) {
      timeByTopic.set(
        revision.topic_id,
        (timeByTopic.get(revision.topic_id) ?? 0) +
          Number(revision.duration_minutes || 0),
      );
    }
    const groups = new Map<
      string,
      {
        subject: string;
        total: number;
        covered: number;
        active: number;
        urgent: number;
        minutes: number;
        last: string | null;
      }
    >();
    for (const topic of topics) {
      const group = groups.get(topic.subject) ?? {
        subject: topic.subject,
        total: 0,
        covered: 0,
        active: 0,
        urgent: 0,
        minutes: 0,
        last: null,
      };
      group.total += 1;
      group.covered += topic.status === 'covered' ? 1 : 0;
      group.active += topic.status === 'in_progress' ? 1 : 0;
      group.urgent += urgencyFor(topic, settings) === 'urgent' ? 1 : 0;
      group.minutes += timeByTopic.get(topic.id) ?? 0;
      if (
        topic.last_revised_at &&
        (!group.last || topic.last_revised_at > group.last)
      ) {
        group.last = topic.last_revised_at;
      }
      groups.set(topic.subject, group);
    }
    return [...groups.values()].sort(
      (a, b) =>
        b.urgent - a.urgent || a.covered / a.total - b.covered / b.total,
    );
  }, [revisions, settings, topics]);

  const repositoryStats = useMemo(
    () =>
      repositories.map((repository) => {
        const repositoryTopics = topics.filter(
          (topic) => topic.repository === repository,
        );
        const covered = repositoryTopics.filter(
          (topic) => topic.status === 'covered',
        ).length;
        const urgent = repositoryTopics.filter(
          (topic) => urgencyFor(topic, settings) === 'urgent',
        ).length;
        const next = [...repositoryTopics]
          .filter((topic) => topic.status !== 'covered')
          .sort((a, b) => {
            const aDate = a.next_due_at ?? a.target_date ?? '9999-12-31';
            const bDate = b.next_due_at ?? b.target_date ?? '9999-12-31';
            return aDate.localeCompare(bDate);
          })[0];
        return {
          repository,
          total: repositoryTopics.length,
          covered,
          urgent,
          next,
        };
      }),
    [settings, topics],
  );

  const hdlBitsStats = useMemo(() => {
    const hdlTopics = prioritized.filter(
      (topic) => topic.repository === 'hdlbits',
    );
    const hdlTopicIds = new Set(hdlTopics.map((topic) => topic.id));
    const hdlChecks = subtopics.filter((subtopic) =>
      hdlTopicIds.has(subtopic.topic_id),
    );
    const next = hdlTopics.find((topic) => topic.status !== 'covered');
    return {
      topics: hdlTopics,
      coveredTopics: hdlTopics.filter((topic) => topic.status === 'covered')
        .length,
      completedChecks: hdlChecks.filter(subtopicIsCovered).length,
      totalChecks: hdlChecks.length,
      urgent: hdlTopics.filter(
        (topic) => urgencyFor(topic, settings) === 'urgent',
      ).length,
      next,
    };
  }, [prioritized, settings, subtopics]);

  const learningAnalytics = useMemo(
    () =>
      buildLearningAnalytics({
        revisions,
        topics,
        dailyGoalMinutes: settings.daily_goal_minutes,
      }),
    [revisions, settings.daily_goal_minutes, topics],
  );

  const focusTopic = focusSession
    ? (topicById.get(focusSession.topicId) ?? null)
    : null;
  const focusElapsedMinutes = focusSession
    ? Math.max(
        0,
        Math.ceil(
          (focusSession.totalSeconds - focusSession.remainingSeconds) / 60,
        ),
      )
    : 0;
  const maxForecastMinutes = Math.max(
    1,
    ...learningAnalytics.forecast.map((day) => day.minutes),
  );

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prioritized.filter((topic) => {
      const matchesQuery =
        !query ||
        `${topic.title} ${topic.subject} ${repoLabels[topic.repository]} ${(subtopicsByTopic.get(topic.id) ?? []).map((subtopic) => subtopic.label).join(' ')}`
          .toLowerCase()
          .includes(query);
      return (
        matchesQuery &&
        (repoFilter === 'all' || topic.repository === repoFilter) &&
        (statusFilter === 'all' || topic.status === statusFilter)
      );
    });
  }, [prioritized, repoFilter, search, statusFilter, subtopicsByTopic]);

  const recentRevisions = revisions.slice(0, 6);
  const lastRevision = recentRevisions[0];
  const lastTopic = lastRevision ? topicById.get(lastRevision.topic_id) : null;

  function showRepository(repository: Repository) {
    setRepoFilter(repository);
    setStatusFilter('all');
    setSearch('');
    window.requestAnimationFrame(() => {
      document
        .getElementById('topic-observatory')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function beginRevision(topic: Topic, minutes?: number) {
    setSelectedTopic(topic);
    setMark(topic.confidence ?? 'R');
    setRevisedAt(localDate());
    setDurationMinutes(
      Math.max(1, minutes ?? Number(topic.estimated_minutes || 30)),
    );
    setSessionMood(feeling);
    setProof('');
    setReflection('');
    setRevisionNotes('');
    setMistakeCategory('none');
    setRepairAction('');
    setError('');
  }

  function startFocus(topic: Topic, minutes?: number) {
    const totalSeconds =
      Math.max(
        5,
        Math.min(
          180,
          Math.round(
            minutes ?? topic.estimated_minutes ?? settings.focus_block_minutes,
          ),
        ),
      ) * 60;
    setFocusSession({
      topicId: topic.id,
      totalSeconds,
      remainingSeconds: totalSeconds,
      running: false,
      endsAt: null,
    });
    setFocusOpen(true);
  }

  function toggleFocusTimer() {
    setFocusSession((current) => {
      if (!current) return current;
      if (current.running) {
        const remaining = current.endsAt
          ? Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000))
          : current.remainingSeconds;
        return {
          ...current,
          remainingSeconds: remaining,
          running: false,
          endsAt: null,
        };
      }
      if (current.remainingSeconds <= 0) {
        return {
          ...current,
          remainingSeconds: current.totalSeconds,
          running: true,
          endsAt: Date.now() + current.totalSeconds * 1000,
        };
      }
      return {
        ...current,
        running: true,
        endsAt: Date.now() + current.remainingSeconds * 1000,
      };
    });
  }

  function resetFocusTimer() {
    setFocusSession((current) =>
      current
        ? {
            ...current,
            remainingSeconds: current.totalSeconds,
            running: false,
            endsAt: null,
          }
        : current,
    );
  }

  function finishFocusSession() {
    if (!focusTopic || !focusSession) return;
    const minutes = Math.max(1, focusElapsedMinutes);
    setFocusSession(null);
    setFocusOpen(false);
    beginRevision(focusTopic, minutes);
  }

  async function postAction(payload: Record<string, unknown>) {
    if (!window.navigator.onLine) {
      throw new Error(
        'You are offline. Your last dashboard is available, but saving waits for a connection.',
      );
    }
    const response = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      error?: string;
      nextDueAt?: string;
      topicId?: string;
      topicStatus?: Topic['status'];
      coveredCount?: number;
      total?: number;
    };
    if (!response.ok) throw new Error(data.error ?? 'Could not save changes.');
    return data;
  }

  function toggleTopicExpanded(topicId: string) {
    setExpandedTopics((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  async function toggleSubtopic(subtopic: Subtopic, covered: boolean) {
    if (checkingSubtopic) return;
    setCheckingSubtopic(subtopic.id);
    setError('');
    const priorCovered = subtopicIsCovered(subtopic);
    setSubtopics((current) =>
      current.map((item) =>
        item.id === subtopic.id
          ? {
              ...item,
              covered,
              covered_at: covered ? new Date().toISOString() : null,
            }
          : item,
      ),
    );

    try {
      const data = await postAction({
        action: 'toggle_subtopic',
        id: subtopic.id,
        covered,
      });
      if (data.topicId && data.topicStatus) {
        setTopics((current) =>
          current.map((topic) =>
            topic.id === data.topicId
              ? { ...topic, status: data.topicStatus! }
              : topic,
          ),
        );
      }
    } catch (saveError) {
      setSubtopics((current) =>
        current.map((item) =>
          item.id === subtopic.id ? { ...item, covered: priorCovered } : item,
        ),
      );
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save the quick check.',
      );
    } finally {
      setCheckingSubtopic(null);
    }
  }

  async function recordRevision(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    if (!selectedTopic) return;
    setSaving(true);
    setError('');
    try {
      const data = await postAction({
        action: 'revise',
        id: selectedTopic.id,
        mark,
        revisedAt,
        durationMinutes,
        mood: sessionMood,
        proof,
        reflection,
        notes: revisionNotes,
        mistakeCategory,
        repairAction,
      });
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

  async function addTopic(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await postAction({
        action: 'add',
        title: form.get('title'),
        subject: form.get('subject'),
        repository: form.get('repository'),
        priority: form.get('priority'),
        targetDate: form.get('targetDate'),
        estimatedMinutes: form.get('estimatedMinutes'),
        urgencyOverride: form.get('urgencyOverride'),
        sourceUrl: form.get('sourceUrl'),
      });
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

  async function saveTopicTuning(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    if (!tuningTopic) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await postAction({
        action: 'update_topic',
        id: tuningTopic.id,
        urgencyOverride: form.get('urgencyOverride'),
        priority: form.get('priority'),
        targetDate: form.get('targetDate'),
        estimatedMinutes: form.get('estimatedMinutes'),
      });
      setTuningTopic(null);
      setMessage('Topic urgency and time estimate updated.');
      await loadTopics();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not tune topic.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings(
    event: SyntheticEvent<HTMLFormElement, SubmitEvent>,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await postAction({
        action: 'update_settings',
        urgentWindowDays: form.get('urgentWindowDays'),
        yellowWindowDays: form.get('yellowWindowDays'),
        missedIntervalDays: form.get('missedIntervalDays'),
        hesitantIntervalDays: form.get('hesitantIntervalDays'),
        recalledFirstDays: form.get('recalledFirstDays'),
        recalledSecondDays: form.get('recalledSecondDays'),
        recalledMasteredDays: form.get('recalledMasteredDays'),
        dailyGoalMinutes: form.get('dailyGoalMinutes'),
        focusBlockMinutes: form.get('focusBlockMinutes'),
      });
      setSettingsOpen(false);
      setMessage('Study goal, focus block, urgency, and recall rules updated.');
      await loadTopics();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Could not save urgency rules.',
      );
    } finally {
      setSaving(false);
    }
  }

  function exportBackup() {
    const payload = JSON.stringify(
      {
        schemaVersion: 2,
        exportedAt: new Date().toISOString(),
        settings,
        topics,
        subtopics,
        revisions,
      },
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

  async function selectBackupFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setBackupPayload('');
    setBackupSummary(null);
    setBackupFileName(file?.name ?? '');
    if (!file) return;
    if (file.size > 8_000_000) {
      setError('That backup is larger than the 8 MB safety limit.');
      return;
    }
    try {
      const payload = await file.text();
      const parsed = JSON.parse(payload) as Record<string, unknown>;
      const topics = Array.isArray(parsed.topics) ? parsed.topics.length : 0;
      const subtopics = Array.isArray(parsed.subtopics)
        ? parsed.subtopics.length
        : 0;
      const revisions = Array.isArray(parsed.revisions)
        ? parsed.revisions.length
        : 0;
      if (
        !topics ||
        !Array.isArray(parsed.subtopics) ||
        !Array.isArray(parsed.revisions)
      ) {
        throw new Error('This is not a complete Revision Solved backup.');
      }
      setBackupPayload(payload);
      setBackupSummary({ topics, subtopics, revisions });
      setError('');
    } catch (selectionError) {
      setError(
        selectionError instanceof Error
          ? selectionError.message
          : 'Could not read that backup.',
      );
    }
  }

  async function restoreBackup() {
    if (!backupPayload) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: backupPayload,
      });
      const data = (await response.json()) as {
        error?: string;
        restored?: { topics: number; subtopics: number; revisions: number };
      };
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not restore backup.');
      }
      setBackupOpen(false);
      setBackupPayload('');
      setBackupSummary(null);
      setBackupFileName('');
      setMessage(
        `Backup restored: ${data.restored?.topics ?? 0} topics and ${data.restored?.revisions ?? 0} revision observations merged safely.`,
      );
      await loadTopics();
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : 'Could not restore backup.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to revision dashboard
      </a>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpenCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-bold tracking-tight">
                Revision Solved
              </p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Observe · decide · revise · reflect
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/kapiltrip/revisionSolvedApp"
              target="_blank"
              rel="noreferrer"
              className="repo-link hidden lg:inline-flex"
            >
              <ExternalLink /> App code
            </a>
            <PwaInstallButton />
            <output
              className={`connection-pill ${online ? 'online' : 'offline'}`}
              aria-label={
                online ? 'Online and saving enabled' : 'Offline read-only mode'
              }
            >
              {online ? <Wifi /> : <WifiOff />}
              <span className="hidden lg:inline">
                {online ? 'Synced' : 'Offline'}
              </span>
            </output>
            <Button
              size="icon"
              variant="outline"
              className="size-10 rounded-xl sm:hidden"
              onClick={() => setSettingsOpen(true)}
              aria-label="Tune urgency and recall timing"
            >
              <Settings2 />
            </Button>
            <Button
              variant="outline"
              className="hidden h-10 rounded-xl sm:inline-flex"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 /> Tune urgency
            </Button>
            <Button
              className="h-10 rounded-xl px-3 sm:px-4"
              onClick={() => setAddOpen(true)}
              aria-label="Add topic"
            >
              <Plus /> <span className="hidden sm:inline">Add topic</span>
            </Button>
          </div>
        </div>
      </header>

      {focusSession && focusTopic && !focusOpen && (
        <button
          type="button"
          className="focus-dock"
          onClick={() => setFocusOpen(true)}
          aria-label={`Open focus timer for ${focusTopic.title}`}
        >
          <span className="focus-dock-icon">
            <Timer />
          </span>
          <span className="min-w-0 text-left">
            <b className="block truncate">{focusTopic.title}</b>
            <small>
              {formatTimer(focusSession.remainingSeconds)} ·{' '}
              {focusSession.running ? 'running' : 'paused'}
            </small>
          </span>
          {focusSession.running ? <Pause /> : <Play />}
        </button>
      )}

      <div
        id="main-content"
        className="mx-auto max-w-[1480px] px-5 py-7 lg:px-8"
      >
        <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary/70">
              {new Intl.DateTimeFormat('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(new Date())}
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Your revision observation room.
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              See the whole syllabus across four repositories, protect weak
              memories, and turn today&apos;s available energy into one
              realistic session.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex xl:w-auto">
            {repositories.map((repository) => (
              <a
                key={repository}
                href={repositoryMeta[repository].url}
                target="_blank"
                rel="noreferrer"
                className="repo-link"
              >
                {repositoryMeta[repository].shortLabel} <ExternalLink />
              </a>
            ))}
          </div>
        </section>

        {!online && (
          <output className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <WifiOff className="mt-0.5 size-4 shrink-0" />
            <span>
              <b>Offline read mode.</b> Your last loaded dashboard remains
              available. Reconnect before saving checks, sessions, or settings.
            </span>
          </output>
        )}

        {(error || message) && (
          <div
            aria-live="polite"
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error ? 'border-orange-200 bg-orange-50 text-orange-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
          >
            <div className="flex items-center justify-between gap-4">
              <span>{error || message}</span>
              <button
                className="text-xs font-semibold underline"
                onClick={() => {
                  setError('');
                  setMessage('');
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingDashboard />
        ) : error && topics.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <WifiOff className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 font-heading text-xl font-bold">
              The revision ledger could not load
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Check the connection and retry. No progress has been changed.
            </p>
            <Button className="mt-5" onClick={() => void loadTopics()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.45fr_.55fr]">
              <article className="session-cockpit">
                <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                      Build my next session
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                      Tell me your capacity. I&apos;ll carry the decision.
                    </h2>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-right">
                    <p className="text-xs text-blue-100/70">
                      Today&apos;s budget
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {studyMinutes} minutes
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
                  <div>
                    <fieldset>
                      <legend className="mb-3 text-sm font-semibold">
                        How are you feeling?
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        {moodOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`mood-choice ${feeling === option.value ? 'selected' : ''}`}
                              onClick={() => setFeeling(option.value)}
                            >
                              <Icon />
                              <span>
                                <b>{option.label}</b>
                                <small>{option.hint}</small>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                    <label className="mt-5 block" htmlFor="study-minutes">
                      <span className="mb-2 block text-sm font-semibold">
                        How long do you want to study?
                      </span>
                      <div className="flex items-center gap-3">
                        <Input
                          id="study-minutes"
                          type="number"
                          min="10"
                          max="240"
                          value={studyMinutes}
                          onChange={(event) =>
                            setStudyMinutes(
                              Math.min(
                                240,
                                Math.max(10, Number(event.target.value) || 10),
                              ),
                            )
                          }
                          className="border-white/20 bg-white/10 text-white"
                        />
                        <span className="text-sm text-blue-100/70">
                          minutes
                        </span>
                      </div>
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[20, 30, 45, 60, 90].map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => setStudyMinutes(minutes)}
                          className={`time-chip ${studyMinutes === minutes ? 'selected' : ''}`}
                        >
                          {minutes}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 text-foreground shadow-xl shadow-black/10">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/65">
                          Your adaptive plan
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {feeling === 'drained'
                            ? 'Low-load mode: one clean win.'
                            : feeling === 'foggy'
                              ? 'Warm-up mode: familiar before difficult.'
                              : feeling === 'energized'
                                ? 'Challenge mode: attack the hardest memory.'
                                : 'Balanced mode: urgency without overload.'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {sessionPlan.plan.length} topic
                        {sessionPlan.plan.length === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      {sessionPlan.plan.map((item, index) => (
                        <div key={item.topic.id} className="plan-step">
                          <span>{index + 1}</span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">
                                {item.topic.title}
                              </p>
                              <Badge variant="secondary">{item.minutes}m</Badge>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {item.reason}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => startFocus(item.topic, item.minutes)}
                          >
                            <Timer /> Focus
                          </Button>
                        </div>
                      ))}
                    </div>
                    {(sessionPlan.breakMinutes > 0 ||
                      sessionPlan.unusedMinutes > 0) && (
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {sessionPlan.breakMinutes > 0 && (
                          <span className="rounded-lg bg-muted px-2.5 py-1.5">
                            + {sessionPlan.breakMinutes}m reset break
                          </span>
                        )}
                        {sessionPlan.unusedMinutes > 0 && (
                          <span className="rounded-lg bg-muted px-2.5 py-1.5">
                            {sessionPlan.unusedMinutes}m buffer — no overpacking
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>

              <aside className="observation-card">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#e7efff] text-primary">
                    <Activity className="size-5" />
                  </div>
                  <Badge variant="outline">Live observation</Badge>
                </div>
                <h2 className="mt-5 font-heading text-xl font-bold">
                  {lastTopic ? 'Last time → now' : 'Your first signal'}
                </h2>
                {lastTopic && lastRevision ? (
                  <>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Last time you revised <b>{lastTopic.title}</b> on{' '}
                      {formatDate(lastRevision.revised_at)} for{' '}
                      {formatMinutes(
                        Number(lastRevision.duration_minutes || 0),
                      )}
                      .
                    </p>
                    <div className="mt-4 rounded-xl border bg-muted/45 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Now do this
                      </p>
                      <p className="mt-2 text-sm font-semibold">
                        {sessionPlan.plan[0]?.topic.title ?? 'Choose one topic'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {sessionPlan.plan[0]?.reason ??
                          'Add a topic to receive a recommendation.'}
                      </p>
                    </div>
                    {lastRevision.reflection && (
                      <blockquote className="mt-4 border-l-2 border-primary/25 pl-3 text-xs italic leading-5 text-muted-foreground">
                        “{lastRevision.reflection}”
                      </blockquote>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    No completed session yet. Start the first suggested topic;
                    your next visit will compare what you did with what memory
                    needs now.
                  </p>
                )}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="mini-stat">
                    <span>Time invested</span>
                    <b>{formatMinutes(metrics.totalMinutes)}</b>
                  </div>
                  <div className="mini-stat">
                    <span>Average session</span>
                    <b>
                      {metrics.averageMinutes
                        ? formatMinutes(metrics.averageMinutes)
                        : 'No data'}
                    </b>
                  </div>
                </div>
              </aside>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={<CheckCircle2 />}
                iconClass="bg-[#e7f6ed] text-[#176b3a]"
                label="Covered"
                value={
                  <>
                    {metrics.covered} <span>/ {topics.length}</span>
                  </>
                }
                note="Memory-marked as recalled"
                progress={
                  topics.length ? (metrics.covered / topics.length) * 100 : 0
                }
              />
              <MetricCard
                icon={<BookOpenCheck />}
                iconClass="bg-[#fff4cf] text-[#8a6500]"
                label="Not covered"
                value={metrics.untouched}
                note="Blind spots across all four repositories"
              />
              <MetricCard
                icon={<Flame />}
                iconClass="bg-[#ffe1bc] text-[#a84d00]"
                label="Orange now"
                value={metrics.urgent}
                note="Automatic rules + your overrides"
                accent
              />
              <MetricCard
                icon={<CalendarClock />}
                iconClass="bg-[#e7efff] text-primary"
                label="Last revision"
                value={
                  <span className="text-xl">
                    {formatDate(metrics.last ?? null, 'No session yet')}
                  </span>
                }
                note={
                  metrics.last
                    ? `${revisions.length} recorded sessions`
                    : 'Record one to start the memory clock'
                }
              />
            </section>

            <section
              className="mt-7"
              aria-labelledby="memory-intelligence-heading"
            >
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary/60">
                    Memory intelligence
                  </p>
                  <h2
                    id="memory-intelligence-heading"
                    className="mt-1 font-heading text-xl font-bold"
                  >
                    Measure recall quality, not just completed pages.
                  </h2>
                </div>
                <Badge variant="outline">
                  {learningAnalytics.weekSessions} sessions ·{' '}
                  {formatMinutes(learningAnalytics.weekMinutes)} this week
                </Badge>
              </div>

              <div className="memory-intelligence-grid">
                <article className="memory-overview-card">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary/60">
                        Today&apos;s deliberate practice
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        <b className="text-3xl tracking-tight">
                          {learningAnalytics.todayMinutes}m
                        </b>
                        <span className="text-sm text-muted-foreground">
                          of {learningAnalytics.dailyGoalMinutes}m goal
                        </span>
                      </div>
                    </div>
                    <div
                      className="daily-goal-ring"
                      style={{
                        background: `conic-gradient(#315ea8 ${learningAnalytics.dailyGoalPercent}%, #e7edf7 0)`,
                      }}
                      aria-hidden="true"
                    >
                      <span>{learningAnalytics.dailyGoalPercent}%</span>
                    </div>
                  </div>
                  <Progress
                    className="mt-4 h-2"
                    value={learningAnalytics.dailyGoalPercent}
                    aria-label={`${learningAnalytics.dailyGoalPercent}% of daily study goal complete`}
                  />

                  <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="intelligence-stat">
                      <dt>Memory strength</dt>
                      <dd>{learningAnalytics.memoryStrength}%</dd>
                    </div>
                    <div className="intelligence-stat">
                      <dt>Clean recall</dt>
                      <dd>
                        {learningAnalytics.totalRecalls
                          ? `${learningAnalytics.retentionRate}%`
                          : '—'}
                      </dd>
                    </div>
                    <div className="intelligence-stat">
                      <dt>Current streak</dt>
                      <dd>{learningAnalytics.currentStreak}d</dd>
                    </div>
                    <div className="intelligence-stat">
                      <dt>Best streak</dt>
                      <dd>{learningAnalytics.bestStreak}d</dd>
                    </div>
                  </dl>

                  <div className="mt-5 border-t pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        Last 14 days
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R {learningAnalytics.recall.R} · H{' '}
                        {learningAnalytics.recall.H} · M{' '}
                        {learningAnalytics.recall.M}
                      </p>
                    </div>
                    <figure
                      className="activity-strip"
                      aria-label={`Fourteen day activity: ${learningAnalytics.weekMinutes} minutes during the latest seven days`}
                    >
                      {learningAnalytics.activity.map((day) => (
                        <span
                          key={day.date}
                          className={`activity-cell intensity-${day.intensity}`}
                          title={`${formatDate(day.date)}: ${day.minutes} minutes across ${day.sessions} sessions`}
                        />
                      ))}
                    </figure>
                  </div>
                </article>

                <article className="forecast-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-primary/60">
                        Seven-day load forecast
                      </p>
                      <h3 className="mt-1 font-heading text-lg font-bold">
                        See overload before it arrives.
                      </h3>
                    </div>
                    <BarChart3 className="size-5 text-primary/65" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {learningAnalytics.forecast.map((day, index) => (
                      <div key={day.date} className="forecast-row">
                        <div>
                          <b>
                            {index === 0
                              ? 'Today'
                              : new Intl.DateTimeFormat('en-IN', {
                                  weekday: 'short',
                                }).format(new Date(`${day.date}T00:00:00`))}
                          </b>
                          <span>
                            {day.topicIds.length}{' '}
                            {day.topicIds.length === 1 ? 'topic' : 'topics'}
                          </span>
                        </div>
                        <div className="forecast-track" aria-hidden="true">
                          <span
                            style={{
                              width: `${Math.max(
                                day.minutes ? 8 : 0,
                                (day.minutes / maxForecastMinutes) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                        <strong>
                          {day.minutes ? `${day.minutes}m` : 'clear'}
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>

                <aside className="repair-queue-card">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-orange-700/70">
                        Repair queue
                      </p>
                      <h3 className="mt-1 font-heading text-lg font-bold">
                        Turn mistakes into the next drill.
                      </h3>
                    </div>
                    <Wrench className="size-5 text-orange-700" />
                  </div>
                  {learningAnalytics.topMistake && (
                    <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-900">
                      Most frequent pattern:{' '}
                      <b>
                        {mistakeLabels[
                          learningAnalytics.topMistake
                            .category as MistakeCategory
                        ] ?? learningAnalytics.topMistake.category}
                      </b>{' '}
                      ({learningAnalytics.topMistake.count})
                    </p>
                  )}
                  <div className="mt-4 space-y-2.5">
                    {learningAnalytics.repairQueue.slice(0, 4).map((signal) => {
                      const topic = topicById.get(signal.topicId);
                      if (!topic) return null;
                      return (
                        <button
                          key={signal.topicId}
                          type="button"
                          className="repair-item"
                          onClick={() => beginRevision(topic)}
                        >
                          <span
                            className={`mark-orb mark-${signal.mark.toLowerCase()}`}
                          >
                            {signal.mark}
                          </span>
                          <span className="min-w-0 text-left">
                            <b className="block truncate">{topic.title}</b>
                            <small className="line-clamp-1">
                              {signal.repairAction ||
                                signal.notes ||
                                mistakeLabels[
                                  signal.mistakeCategory as MistakeCategory
                                ] ||
                                'Repeat blind and isolate mismatch one'}
                            </small>
                          </span>
                          <ArrowUpRight />
                        </button>
                      );
                    })}
                    {learningAnalytics.repairQueue.length === 0 && (
                      <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                        Missed and hesitant recalls will become targeted repair
                        drills here.
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </section>

            <section
              className="mt-7"
              aria-labelledby="repository-health-heading"
            >
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary/60">
                    Source intelligence
                  </p>
                  <h2
                    id="repository-health-heading"
                    className="mt-1 font-heading text-xl font-bold"
                  >
                    Four repositories. One memory system.
                  </h2>
                </div>
                <p className="max-w-xl text-xs leading-5 text-muted-foreground sm:text-right">
                  Each card is a live view of its seeded learning ledger. Open
                  one to isolate its queue without losing the global plan.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {repositoryStats.map((stat) => {
                  const meta = repositoryMeta[stat.repository];
                  const progress = stat.total
                    ? (stat.covered / stat.total) * 100
                    : 0;
                  return (
                    <article
                      key={stat.repository}
                      className={`repo-ledger-card ${meta.accentClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="repo-ledger-icon">
                          <GitBranch />
                        </div>
                        <Badge variant="outline">{stat.urgent} urgent</Badge>
                      </div>
                      <h3 className="mt-4 font-heading text-base font-bold">
                        {meta.label}
                      </h3>
                      <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">
                        {meta.description}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-bold tracking-tight">
                            {stat.covered}
                            <span className="text-sm text-muted-foreground">
                              {' '}
                              / {stat.total}
                            </span>
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                            topics recalled
                          </p>
                        </div>
                        <button
                          type="button"
                          className="ledger-open"
                          onClick={() => showRepository(stat.repository)}
                        >
                          Open ledger <ArrowUpRight />
                        </button>
                      </div>
                      <Progress
                        className="mt-3 h-1.5"
                        value={progress}
                        aria-label={`${meta.label} topic coverage`}
                      />
                      <p className="mt-3 truncate text-xs text-muted-foreground">
                        Next: {stat.next?.title ?? 'Queue complete'}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section
              className="hdlbits-command mt-7"
              aria-labelledby="hdlbits-command-heading"
            >
              <div className="hdlbits-command-main">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-3">
                    <div className="hdlbits-mark" aria-hidden="true">
                      <TerminalSquare />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.17em] text-orange-200">
                        HDLBits command center
                      </p>
                      <h2
                        id="hdlbits-command-heading"
                        className="mt-1 font-heading text-2xl font-bold tracking-tight"
                      >
                        Recall the design. Don&apos;t recognize the solution.
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/75">
                        Your complete HDLBits archive is now a first-class
                        revision track: 178 solved problems, 17 focused batches,
                        and the exact 24 weaknesses recorded while solving them.
                      </p>
                    </div>
                  </div>
                  <a
                    href={hdlBitsLinks.repository}
                    target="_blank"
                    rel="noreferrer"
                    className="hdlbits-source-link"
                  >
                    Open repository <ExternalLink />
                  </a>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="hdlbits-stat">
                    <b>178 / 178</b>
                    <span>archived problems</span>
                  </div>
                  <div className="hdlbits-stat">
                    <b>17</b>
                    <span>recall batches</span>
                  </div>
                  <div className="hdlbits-stat">
                    <b>24 / 24</b>
                    <span>weakness themes</span>
                  </div>
                  <div className="hdlbits-stat">
                    <b>{hdlBitsStats.completedChecks}</b>
                    <span>of {hdlBitsStats.totalChecks} app checks</span>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="size-4 text-orange-200" />
                    Non-negotiable revision loop
                  </div>
                  <ol className="hdlbits-loop">
                    <li>
                      <span>1</span>
                      <div>
                        <b>Attempt blind</b>
                        <p>Do not open the saved `.sv` first.</p>
                      </div>
                    </li>
                    <li>
                      <span>2</span>
                      <div>
                        <b>Run the proof</b>
                        <p>Compile or submit; do not judge by appearance.</p>
                      </div>
                    </li>
                    <li>
                      <span>3</span>
                      <div>
                        <b>Find mismatch one</b>
                        <p>Localize the first wrong signal and cycle.</p>
                      </div>
                    </li>
                    <li>
                      <span>4</span>
                      <div>
                        <b>Write the exact rule</b>
                        <p>Record the causal mistake, not “unclear.”</p>
                      </div>
                    </li>
                    <li>
                      <span>5</span>
                      <div>
                        <b>Rate recall</b>
                        <p>R, H or M schedules the next attempt.</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>

              <aside className="hdlbits-next">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-orange-100 text-orange-800">
                    <Target className="size-5" />
                  </div>
                  <Badge
                    className="border-orange-200 bg-orange-50 text-orange-800"
                    variant="outline"
                  >
                    {hdlBitsStats.urgent} urgent
                  </Badge>
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-primary/60">
                  Next HDLBits recall
                </p>
                <h3 className="mt-2 font-heading text-lg font-bold leading-6">
                  {hdlBitsStats.next?.title ?? 'All HDLBits batches recalled'}
                </h3>
                {hdlBitsStats.next && (
                  <>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {reasonFor(hdlBitsStats.next, settings)}. Expected{' '}
                      {formatMinutes(hdlBitsStats.next.estimated_minutes)}.
                    </p>
                    <Button
                      className="mt-4 w-full rounded-xl"
                      onClick={() =>
                        startFocus(
                          hdlBitsStats.next!,
                          settings.focus_block_minutes,
                        )
                      }
                    >
                      <Sparkles /> Start blind recall
                    </Button>
                  </>
                )}
                <Button
                  className="mt-2 w-full rounded-xl"
                  variant="outline"
                  onClick={() => showRepository('hdlbits')}
                >
                  <Layers3 /> View all {hdlBitsStats.topics.length} tracks
                </Button>

                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Deep links
                  </p>
                  <div className="mt-2 grid gap-1.5">
                    <a
                      href={hdlBitsLinks.revisionSheet}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Revision sheet <ArrowUpRight />
                    </a>
                    <a
                      href={hdlBitsLinks.archive}
                      target="_blank"
                      rel="noreferrer"
                    >
                      178-problem archive <ArrowUpRight />
                    </a>
                    <a
                      href={hdlBitsLinks.mistakes}
                      target="_blank"
                      rel="noreferrer"
                    >
                      24-theme mistakes lab <ArrowUpRight />
                    </a>
                  </div>
                </div>
              </aside>
            </section>

            <section className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
              <article className="rounded-2xl border bg-card shadow-[0_12px_40px_rgb(27_49_77/5%)]">
                <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold">
                      Subject observation map
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Coverage, weak load, time spent, and recency by subject
                    </p>
                  </div>
                  <Badge variant="outline">
                    {subjectStats.length} subjects
                  </Badge>
                </div>
                <div className="divide-y">
                  {subjectStats.map((subject) => (
                    <div key={subject.subject} className="subject-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{subject.subject}</p>
                          {subject.urgent > 0 && (
                            <Badge
                              className="border-orange-200 bg-orange-50 text-orange-800"
                              variant="outline"
                            >
                              {subject.urgent} orange
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {subject.covered} covered · {subject.active} active ·{' '}
                          {subject.total - subject.covered - subject.active}{' '}
                          untouched
                        </p>
                        <Progress
                          className="mt-3 h-1.5"
                          value={(subject.covered / subject.total) * 100}
                          aria-label={`${subject.subject} coverage`}
                        />
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold">
                          {subject.minutes
                            ? formatMinutes(subject.minutes)
                            : 'No time logged'}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Last: {formatDate(subject.last, 'Never')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="rounded-2xl border bg-card p-5 shadow-[0_12px_40px_rgb(27_49_77/5%)] sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-bold">
                      Revision trail
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      What recent sessions actually felt like
                    </p>
                  </div>
                  <Brain className="size-5 text-primary/65" />
                </div>
                <div className="mt-5 space-y-4">
                  {recentRevisions.map((revision) => {
                    const topic = topicById.get(revision.topic_id);
                    return (
                      <div key={revision.id} className="trail-item">
                        <span
                          className={`mark-orb mark-${revision.mark.toLowerCase()}`}
                        >
                          {revision.mark}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {topic?.title ?? 'Unknown topic'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(revision.revised_at)} ·{' '}
                            {formatMinutes(
                              Number(revision.duration_minutes || 0),
                            )}{' '}
                            · {revision.mood || 'steady'}
                          </p>
                          {revision.reflection && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-foreground/70">
                              {revision.reflection}
                            </p>
                          )}
                          {revision.mistake_category &&
                            revision.mistake_category !== 'none' && (
                              <p className="mt-1 text-[11px] font-semibold text-orange-700">
                                {mistakeLabels[revision.mistake_category]}
                                {revision.repair_action
                                  ? ` · ${revision.repair_action}`
                                  : ''}
                              </p>
                            )}
                        </div>
                      </div>
                    );
                  })}
                  {recentRevisions.length === 0 && (
                    <div className="rounded-xl bg-muted/50 p-5 text-center text-sm text-muted-foreground">
                      Reflections appear here after your first revision.
                    </div>
                  )}
                </div>
              </aside>
            </section>

            <section
              id="topic-observatory"
              className="mt-7 scroll-mt-24 rounded-2xl border bg-card shadow-[0_12px_40px_rgb(27_49_77/4%)]"
            >
              <div className="border-b p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                  <div>
                    <h2 className="font-heading text-xl font-bold">
                      Complete topic observatory
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {filteredTopics.length} of {topics.length} topics · every
                      date, memory mark, estimate, and override · press / to
                      search
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="topic-search"
                        className="h-10 rounded-xl pl-9"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search topics"
                        aria-label="Search topics"
                      />
                    </div>
                    <NativeSelect
                      className="w-full sm:w-52"
                      value={repoFilter}
                      onChange={(event) => setRepoFilter(event.target.value)}
                      aria-label="Filter by repository"
                    >
                      <NativeSelectOption value="all">
                        All repositories
                      </NativeSelectOption>
                      {repositories.map((repository) => (
                        <NativeSelectOption key={repository} value={repository}>
                          {repositoryMeta[repository].label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      className="w-full sm:w-36"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      aria-label="Filter by status"
                    >
                      <NativeSelectOption value="all">
                        All statuses
                      </NativeSelectOption>
                      <NativeSelectOption value="not_covered">
                        Not covered
                      </NativeSelectOption>
                      <NativeSelectOption value="in_progress">
                        In progress
                      </NativeSelectOption>
                      <NativeSelectOption value="covered">
                        Covered
                      </NativeSelectOption>
                    </NativeSelect>
                  </div>
                </div>
              </div>
              <div className="divide-y">
                {filteredTopics.map((topic) => {
                  const topicSubtopics = subtopicsByTopic.get(topic.id) ?? [];
                  const coveredSubtopics =
                    topicSubtopics.filter(subtopicIsCovered).length;
                  const expanded = expandedTopics.has(topic.id);
                  return (
                    <div key={topic.id} className="topic-record">
                      <article className="topic-row">
                        <span
                          className={`urgency-dot ${urgencyFor(topic, settings)}`}
                          aria-label={`${urgencyFor(topic, settings)} urgency`}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="topic-disclosure"
                              onClick={() => toggleTopicExpanded(topic.id)}
                              aria-expanded={expanded}
                              aria-controls={`subtopics-${topic.id}`}
                            >
                              <ChevronDown
                                className={expanded ? 'expanded' : ''}
                              />
                              <h3>{topic.title}</h3>
                            </button>
                            {topic.confidence && (
                              <Badge
                                className={`mark-badge mark-${topic.confidence.toLowerCase()}`}
                                variant="outline"
                              >
                                {topic.confidence}
                              </Badge>
                            )}
                            {topic.urgency_override && (
                              <Badge variant="secondary">Manual color</Badge>
                            )}
                            <Badge variant="outline">
                              {coveredSubtopics}/{topicSubtopics.length} quick
                              checks
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {topicContext(topic)} ·{' '}
                            {formatMinutes(
                              Number(topic.estimated_minutes || 30),
                            )}{' '}
                            expected
                          </p>
                          {topic.notes && (
                            <p className="mt-2 line-clamp-1 text-xs text-foreground/70">
                              Next repair: {topic.notes}
                            </p>
                          )}
                        </div>
                        <div className="hidden text-right text-xs sm:block">
                          <p className="font-semibold">{statusLabel(topic)}</p>
                          <p className="mt-1 text-muted-foreground">
                            Last: {formatDate(topic.last_revised_at, 'Never')}
                          </p>
                        </div>
                        <div className="hidden text-right text-xs lg:block">
                          <p className="font-semibold">{dueCopy(topic)}</p>
                          <p className="mt-1 text-muted-foreground">
                            {formatDate(topic.next_due_at ?? topic.target_date)}
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          {topic.source_url && (
                            <a
                              href={topic.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="icon-link"
                              aria-label={`Open source for ${topic.title}`}
                            >
                              <ArrowUpRight />
                            </a>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => setTuningTopic(topic)}
                            aria-label={`Tune ${topic.title}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() =>
                              startFocus(topic, settings.focus_block_minutes)
                            }
                            aria-label={`Start focus timer for ${topic.title}`}
                          >
                            <Timer />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => beginRevision(topic)}
                          >
                            <RotateCcw /> Revise
                          </Button>
                        </div>
                      </article>
                      {expanded && (
                        <div
                          id={`subtopics-${topic.id}`}
                          className="subtopic-panel"
                        >
                          <div className="subtopic-intro">
                            <div>
                              <p className="font-semibold">
                                Quick coverage check
                              </p>
                              <p>
                                Click each item you have covered. Your progress
                                is saved immediately.
                              </p>
                            </div>
                            <span>
                              {coveredSubtopics} of {topicSubtopics.length} done
                            </span>
                          </div>
                          <div className="subtopic-grid">
                            {topicSubtopics.map((subtopic) => (
                              <label
                                key={subtopic.id}
                                className={`subtopic-check ${subtopicIsCovered(subtopic) ? 'covered' : ''}`}
                              >
                                <Checkbox
                                  checked={subtopicIsCovered(subtopic)}
                                  disabled={checkingSubtopic === subtopic.id}
                                  onCheckedChange={(checked) =>
                                    void toggleSubtopic(
                                      subtopic,
                                      checked === true,
                                    )
                                  }
                                  aria-label={`Mark ${subtopic.label} as covered`}
                                />
                                <span>{subtopic.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredTopics.length === 0 && (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    No topics match these filters.
                  </div>
                )}
              </div>
            </section>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <p>
                Orange ≤ {settings.urgent_window_days}d · Yellow ≤{' '}
                {settings.yellow_window_days}d · Green after that. Per-topic
                overrides always win.
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBackupOpen(true)}
                >
                  <Upload /> Restore backup
                </Button>
                <Button variant="ghost" size="sm" onClick={exportBackup}>
                  <Download /> Export complete backup
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={focusOpen && Boolean(focusSession && focusTopic)}
        onOpenChange={setFocusOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          {focusSession && focusTopic && (
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Blind recall focus
                </DialogTitle>
                <DialogDescription>
                  {focusTopic.title} · {topicContext(focusTopic)}
                </DialogDescription>
              </DialogHeader>
              <div className="focus-session-panel">
                <div className="focus-timer" role="timer" aria-live="off">
                  {formatTimer(focusSession.remainingSeconds)}
                </div>
                <p className="mt-2 text-center text-xs text-blue-100/70">
                  {focusSession.running
                    ? 'Timer is running. Stay with mismatch one.'
                    : focusSession.remainingSeconds === 0
                      ? 'Block complete. Capture evidence while it is fresh.'
                      : 'Start when notes and saved HDL are closed.'}
                </p>
                <Progress
                  className="mt-4 h-2 bg-white/15"
                  value={
                    ((focusSession.totalSeconds -
                      focusSession.remainingSeconds) /
                      focusSession.totalSeconds) *
                    100
                  }
                  aria-label={`${focusElapsedMinutes} focus minutes elapsed`}
                />
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button
                    type="button"
                    onClick={toggleFocusTimer}
                    className="min-w-28 bg-white text-primary hover:bg-blue-50"
                  >
                    {focusSession.running ? <Pause /> : <Play />}
                    {focusSession.running ? 'Pause' : 'Start'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetFocusTimer}
                    className="border-white/25 bg-white/8 text-white hover:bg-white/15 hover:text-white"
                  >
                    <RotateCcw /> Reset
                  </Button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Evidence sequence
                  </p>
                  <ol className="mt-3 space-y-2 text-sm">
                    <li>1. Attempt from memory before opening the source.</li>
                    <li>
                      2. Compile, simulate, draw, or explain the behavior.
                    </li>
                    <li>3. Stop at the first mismatch and name its cause.</li>
                    <li>4. Record one concrete repair before rating recall.</li>
                  </ol>
                </div>
                <div className="rounded-xl border bg-muted/35 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Next uncovered checks
                  </p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {(subtopicsByTopic.get(focusTopic.id) ?? [])
                      .filter((subtopic) => !subtopicIsCovered(subtopic))
                      .slice(0, 4)
                      .map((subtopic) => (
                        <li key={subtopic.id} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{subtopic.label}</span>
                        </li>
                      ))}
                    {(subtopicsByTopic.get(focusTopic.id) ?? []).every(
                      subtopicIsCovered,
                    ) && (
                      <li className="text-muted-foreground">
                        All quick checks are covered. Prove the complete topic
                        blind.
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <DialogFooter className="mt-6 gap-2 sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFocusSession(null);
                    setFocusOpen(false);
                  }}
                >
                  End without recording
                </Button>
                <Button type="button" onClick={finishFocusSession}>
                  <CheckCircle2 /> Finish and record evidence
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={backupOpen} onOpenChange={setBackupOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Restore a Revision Solved backup
            </DialogTitle>
            <DialogDescription>
              Select an exported JSON backup. Matching records return to the
              backed-up state; records absent from the file are kept, never
              deleted.
            </DialogDescription>
          </DialogHeader>
          <label className="backup-drop" htmlFor="backup-file">
            <HardDriveDownload />
            <span>
              <b>{backupFileName || 'Choose a JSON backup'}</b>
              <small>Maximum 8 MB · validated before anything is merged</small>
            </span>
            <Input
              id="backup-file"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void selectBackupFile(event)}
            />
          </label>
          {backupSummary && (
            <output className="mt-4 grid grid-cols-3 gap-2">
              <div className="backup-stat">
                <b>{backupSummary.topics}</b>
                <span>topics</span>
              </div>
              <div className="backup-stat">
                <b>{backupSummary.subtopics}</b>
                <span>checks</span>
              </div>
              <div className="backup-stat">
                <b>{backupSummary.revisions}</b>
                <span>sessions</span>
              </div>
            </output>
          )}
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
            Make a fresh export first if you want a recovery point for the
            current state. Restoration is a safe merge and does not remove newer
            unmatched records.
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBackupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void restoreBackup()}
              disabled={!backupPayload || saving}
            >
              {saving ? 'Restoring…' : 'Merge verified backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedTopic)}
        onOpenChange={(open) => !open && setSelectedTopic(null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={recordRevision}>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Record this revision
              </DialogTitle>
              <DialogDescription>{selectedTopic?.title}</DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-5">
              <fieldset>
                <legend className="input-label">How did recall go?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(['R', 'H', 'M'] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={mark === value ? 'default' : 'outline'}
                      className="h-auto flex-col py-3"
                      onClick={() => setMark(value)}
                      aria-pressed={mark === value}
                    >
                      <span className="text-base">{value}</span>
                      <span className="text-[10px] opacity-70">
                        {value === 'R'
                          ? 'Recalled'
                          : value === 'H'
                            ? 'Hesitant'
                            : 'Missed'}
                      </span>
                    </Button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="input-label">
                  How did you feel during this session?
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {moodOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={
                        sessionMood === option.value ? 'default' : 'outline'
                      }
                      onClick={() => setSessionMood(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block" htmlFor="revision-date">
                  <span className="input-label">Revision date</span>
                  <Input
                    id="revision-date"
                    type="date"
                    value={revisedAt}
                    onChange={(event) => setRevisedAt(event.target.value)}
                    required
                  />
                </label>
                <label className="block" htmlFor="revision-duration">
                  <span className="input-label">Time it took (minutes)</span>
                  <Input
                    id="revision-duration"
                    type="number"
                    min="1"
                    max="600"
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(Number(event.target.value) || 1)
                    }
                    required
                  />
                </label>
              </div>
              <label className="block" htmlFor="revision-reflection">
                <span className="input-label">Your personal opinion</span>
                <Textarea
                  id="revision-reflection"
                  value={reflection}
                  onChange={(event) => setReflection(event.target.value)}
                  placeholder="The idea clicked, but the timing diagram still feels slow"
                />
              </label>
              <label className="block" htmlFor="revision-proof">
                <span className="input-label">Proof produced</span>
                <Textarea
                  id="revision-proof"
                  value={proof}
                  onChange={(event) => setProof(event.target.value)}
                  placeholder="Drew the AXI handshake and explained a stalled payload without notes"
                />
              </label>
              <label className="block" htmlFor="revision-notes">
                <span className="input-label">Weakest link / next repair</span>
                <Textarea
                  id="revision-notes"
                  value={revisionNotes}
                  onChange={(event) => setRevisionNotes(event.target.value)}
                  placeholder="What was still unclear, hesitant, or worth testing next?"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block" htmlFor="mistake-category">
                  <span className="input-label">Mistake pattern</span>
                  <NativeSelect
                    id="mistake-category"
                    className="w-full"
                    value={mistakeCategory}
                    onChange={(event) =>
                      setMistakeCategory(event.target.value as MistakeCategory)
                    }
                  >
                    {mistakeOptions.map((option) => (
                      <NativeSelectOption
                        key={option.value}
                        value={option.value}
                      >
                        {option.label} — {option.hint}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </label>
                <label className="block" htmlFor="repair-action">
                  <span className="input-label">Next repair action</span>
                  <Textarea
                    id="repair-action"
                    value={repairAction}
                    onChange={(event) => setRepairAction(event.target.value)}
                    placeholder="Rebuild the FSM state table blind, then simulate the failing transition"
                  />
                </label>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="h-10" disabled={saving}>
                {saving ? 'Saving…' : 'Save observation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <form onSubmit={addTopic}>
            <DialogHeader>
              <DialogTitle className="text-xl">Add a topic</DialogTitle>
              <DialogDescription>
                Add another trackable unit to any repository ledger.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id="topic-title" label="Topic" className="sm:col-span-2">
                <Input
                  id="topic-title"
                  name="title"
                  placeholder="AXI outstanding transactions"
                  required
                />
              </Field>
              <Field id="topic-subject" label="Subject">
                <Input
                  id="topic-subject"
                  name="subject"
                  placeholder="AMBA AXI"
                  required
                />
              </Field>
              <Field id="topic-repository" label="Repository">
                <NativeSelect
                  id="topic-repository"
                  name="repository"
                  className="w-full"
                >
                  {repositories.map((repository) => (
                    <NativeSelectOption key={repository} value={repository}>
                      {repositoryMeta[repository].label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field id="topic-priority" label="Priority">
                <NativeSelect
                  id="topic-priority"
                  name="priority"
                  className="w-full"
                >
                  <NativeSelectOption value="high">High</NativeSelectOption>
                  <NativeSelectOption value="medium">Medium</NativeSelectOption>
                  <NativeSelectOption value="normal">Normal</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field id="topic-urgency" label="Urgency color">
                <NativeSelect
                  id="topic-urgency"
                  name="urgencyOverride"
                  className="w-full"
                >
                  <NativeSelectOption value="">Automatic</NativeSelectOption>
                  <NativeSelectOption value="urgent">Orange</NativeSelectOption>
                  <NativeSelectOption value="soon">Yellow</NativeSelectOption>
                  <NativeSelectOption value="ready">Green</NativeSelectOption>
                </NativeSelect>
              </Field>
              <Field id="topic-target-date" label="Target date">
                <Input id="topic-target-date" type="date" name="targetDate" />
              </Field>
              <Field id="topic-estimate" label="Expected minutes">
                <Input
                  id="topic-estimate"
                  type="number"
                  name="estimatedMinutes"
                  min="5"
                  max="240"
                  defaultValue="30"
                  required
                />
              </Field>
              <Field
                id="topic-source-url"
                label="Source link (optional)"
                className="sm:col-span-2"
              >
                <Input
                  id="topic-source-url"
                  type="url"
                  name="sourceUrl"
                  placeholder="https://github.com/…"
                />
              </Field>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" className="h-10" disabled={saving}>
                {saving ? 'Adding…' : 'Add topic'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(tuningTopic)}
        onOpenChange={(open) => !open && setTuningTopic(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={saveTopicTuning}>
            <DialogHeader>
              <DialogTitle className="text-xl">Tune this topic</DialogTitle>
              <DialogDescription>{tuningTopic?.title}</DialogDescription>
            </DialogHeader>
            {tuningTopic && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field id="tune-urgency" label="Urgency color">
                  <NativeSelect
                    id="tune-urgency"
                    name="urgencyOverride"
                    className="w-full"
                    defaultValue={tuningTopic.urgency_override ?? ''}
                  >
                    <NativeSelectOption value="">Automatic</NativeSelectOption>
                    <NativeSelectOption value="urgent">
                      Orange — now
                    </NativeSelectOption>
                    <NativeSelectOption value="soon">
                      Yellow — soon
                    </NativeSelectOption>
                    <NativeSelectOption value="ready">
                      Green — on track
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field id="tune-priority" label="Priority">
                  <NativeSelect
                    id="tune-priority"
                    name="priority"
                    className="w-full"
                    defaultValue={tuningTopic.priority}
                  >
                    <NativeSelectOption value="high">High</NativeSelectOption>
                    <NativeSelectOption value="medium">
                      Medium
                    </NativeSelectOption>
                    <NativeSelectOption value="normal">
                      Normal
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field id="tune-date" label="Target date">
                  <Input
                    id="tune-date"
                    name="targetDate"
                    type="date"
                    defaultValue={tuningTopic.target_date ?? ''}
                  />
                </Field>
                <Field id="tune-estimate" label="Expected minutes">
                  <Input
                    id="tune-estimate"
                    name="estimatedMinutes"
                    type="number"
                    min="5"
                    max="240"
                    defaultValue={tuningTopic.estimated_minutes || 30}
                    required
                  />
                </Field>
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save topic rules'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={saveSettings}>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Customize urgency and memory timing
              </DialogTitle>
              <DialogDescription>
                These rules control automatic colors and the next date after R,
                H, or M. Per-topic overrides always win.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 space-y-6">
              <fieldset>
                <legend className="mb-3 text-sm font-bold">
                  Daily practice system
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TimingInput
                    id="daily-goal-minutes"
                    name="dailyGoalMinutes"
                    label="Daily study target"
                    value={settings.daily_goal_minutes}
                    min={10}
                    max={600}
                    unit="minutes"
                  />
                  <TimingInput
                    id="focus-block-minutes"
                    name="focusBlockMinutes"
                    label="Default focus block"
                    value={settings.focus_block_minutes}
                    min={5}
                    max={180}
                    unit="minutes"
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-bold">
                  Color windows
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TimingInput
                    id="urgent-days"
                    name="urgentWindowDays"
                    label="Orange when due within"
                    value={settings.urgent_window_days}
                    min={0}
                    max={30}
                  />
                  <TimingInput
                    id="yellow-days"
                    name="yellowWindowDays"
                    label="Yellow when due within"
                    value={settings.yellow_window_days}
                    min={0}
                    max={60}
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-bold">
                  Recall scheduling
                </legend>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <TimingInput
                    id="missed-days"
                    name="missedIntervalDays"
                    label="M · Missed"
                    value={settings.missed_interval_days}
                  />
                  <TimingInput
                    id="hesitant-days"
                    name="hesitantIntervalDays"
                    label="H · Hesitant"
                    value={settings.hesitant_interval_days}
                  />
                  <TimingInput
                    id="recalled-first-days"
                    name="recalledFirstDays"
                    label="R · First recall"
                    value={settings.recalled_first_days}
                  />
                  <TimingInput
                    id="recalled-second-days"
                    name="recalledSecondDays"
                    label="R · Second recall"
                    value={settings.recalled_second_days}
                  />
                  <TimingInput
                    id="recalled-mastered-days"
                    name="recalledMasteredDays"
                    label="R · Mastered"
                    value={settings.recalled_mastered_days}
                  />
                </div>
              </fieldset>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save urgency system'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Field({
  id,
  label,
  className = '',
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="input-label">{label}</span>
      {children}
    </label>
  );
}

function TimingInput({
  id,
  name,
  label,
  value,
  min = 1,
  max = 365,
  unit = 'days',
}: {
  id: string;
  name: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <Field id={id} label={label}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="number"
          min={min}
          max={max}
          defaultValue={value}
          className={unit === 'days' ? 'pr-12' : 'pr-20'}
          required
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    </Field>
  );
}

function MetricCard({
  icon,
  iconClass,
  label,
  value,
  note,
  progress,
  accent = false,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: React.ReactNode;
  note: string;
  progress?: number;
  accent?: boolean;
}) {
  return (
    <article
      className={`metric-card ${accent ? 'border-orange-200 bg-[#fff8ee]' : ''}`}
    >
      <div className={`metric-icon ${iconClass}`}>{icon}</div>
      <p className="metric-label">{label}</p>
      <p className={`metric-value ${accent ? 'text-[#9a4300]' : ''}`}>
        {value}
      </p>
      {progress !== undefined ? (
        <Progress
          value={progress}
          className="mt-4"
          aria-label="Topic coverage"
        />
      ) : (
        <p className="metric-note">{note}</p>
      )}
    </article>
  );
}

function LoadingDashboard() {
  return (
    <div className="space-y-7" aria-label="Loading revision dashboard">
      <div className="grid gap-6 xl:grid-cols-[1.45fr_.55fr]">
        <Skeleton className="h-[520px] rounded-2xl" />
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
