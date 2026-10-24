"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  History,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings2,
  Sparkles,
  Timer,
  WifiOff,
  X,
} from "lucide-react";
import rawCatalog from "@/content/maven/catalog.json";
import type { CourseCatalog } from "@/content/maven/types";
import legacyInventory from "@/content/maven/legacy-topic-inventory.json";
import { localDate } from "@/lib/revision-engine";
import { PwaInstallButton } from "@/components/pwa-install";
import { CaptureForm } from "./capture-form";
import { QuestionReader, modes } from "./question-reader";
import {
  defaultSettings,
  emptyWorkspace,
  type Entry,
  type Kind,
  type PracticeMode,
  type Question,
  type Revision,
  type Settings,
  type Topic,
  type View,
  type Workspace,
} from "./types";

const navigation = [
  { id: "revision", label: "Revision", icon: Brain },
  { id: "assignments", label: "Assignments", icon: BookOpen },
  { id: "reviews", label: "Instructor reviews", icon: Mic },
  { id: "ask", label: "To Ask", icon: MessageCircle },
  { id: "capture", label: "Notes & to-dos", icon: ClipboardList },
  { id: "updates", label: "Updates", icon: History },
] as const;
const catalog = rawCatalog as CourseCatalog;
const questionCount = catalog.assignments.reduce((sum, a) => sum + a.questionCount, 0);
type Focus = { topicId: string; elapsedMs: number; runningSince: number | null };
const assignmentFor = (id: string) => Number(id.match(/maven-a(\d+)/)?.[1] ?? 0);
const dateText = (value: string) =>
  new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

function dueLabel(topic: Topic, today: string) {
  if (!topic.next_due_at) return "New recall";
  return topic.next_due_at < today
    ? "Overdue"
    : topic.next_due_at === today
      ? "Due today"
      : `Next ${dateText(topic.next_due_at)}`;
}

export function MavenApp() {
  const [view, setView] = useState<View>("revision");
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(true);
  const [snapshot, setSnapshot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [syncedAt, setSyncedAt] = useState("");
  const [assignment, setAssignment] = useState(7);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [mode, setMode] = useState<PracticeMode>("solve");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [queueLimit, setQueueLimit] = useState(12);
  const [capture, setCapture] = useState<{
    kind: Kind;
    entry?: Entry;
    assignment?: number;
    question?: number;
  } | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [focusLoaded, setFocusLoaded] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [recording, setRecording] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [attemptVersion, setAttemptVersion] = useState(0);
  const [backupDraft, setBackupDraft] = useState<Record<string, unknown> | null>(null);
  const today = localDate();
  const writable = online && !snapshot;

  const load = useCallback(async (initial = false) => {
    try {
      const [studyResponse, workspaceResponse] = await Promise.all([
        fetch("/api/topics", { cache: "no-store" }),
        fetch("/api/maven", { cache: "no-store" }),
      ]);
      const [study, data] = (await Promise.all([
        studyResponse.json(),
        workspaceResponse.json(),
      ])) as [
        { topics: Topic[]; revisions: Revision[]; settings: Settings; error?: string },
        Workspace & { error?: string },
      ];
      if (!studyResponse.ok || !workspaceResponse.ok)
        throw new Error(study.error || data.error || "Could not load the workspace.");
      setTopics(study.topics);
      setRevisions(study.revisions);
      setSettings({ ...defaultSettings, ...study.settings });
      setWorkspace(data);
      setSnapshot(
        studyResponse.headers.get("X-Maven-Offline") === "1" ||
          workspaceResponse.headers.get("X-Maven-Offline") === "1",
      );
      setSyncedAt(new Date().toISOString());
      setError("");
      if (initial) {
        const requested = Number(new URLSearchParams(window.location.search).get("assignment"));
        setAssignment(
          requested >= 1 && requested <= 7 ? requested : data.profile.current_assignment,
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load. Your saved work has not been changed.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const saved = window.location.hash.slice(1);
    if (navigation.some((n) => n.id === saved)) setView(saved as View);
    const connectivity = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) void load();
    };
    connectivity();
    window.addEventListener("online", connectivity);
    window.addEventListener("offline", connectivity);
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void load();
    };
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(refresh, 15000);
    try {
      const savedFocus = JSON.parse(localStorage.getItem("maven-focus-v1") ?? "null");
      if (
        savedFocus &&
        typeof savedFocus.topicId === "string" &&
        Number.isFinite(savedFocus.elapsedMs) &&
        (savedFocus.runningSince === null || Number.isFinite(savedFocus.runningSince))
      )
        setFocus(savedFocus);
    } catch {}
    setFocusLoaded(true);
    return () => {
      window.removeEventListener("online", connectivity);
      window.removeEventListener("offline", connectivity);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(interval);
    };
  }, [load]);
  useEffect(() => {
    if (focusLoaded) {
      if (focus) localStorage.setItem("maven-focus-v1", JSON.stringify(focus));
      else localStorage.removeItem("maven-focus-v1");
    }
  }, [focus, focusLoaded]);
  useEffect(() => {
    if (!focus?.runningSince) return;
    const interval = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [focus?.runningSince]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 7000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function navigate(next: View) {
    setView(next);
    window.history.replaceState(null, "", `#${next}`);
    setShowClosed(false);
  }
  async function mutate(url: string, body: Record<string, unknown>) {
    if (!writable || busy) return false;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not save.");
      await load();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const queue = useMemo(() => {
    const ranked = [...topics].filter(
      (topic) =>
        (filter === "all" || assignmentFor(topic.id) === Number(filter)) &&
        `${topic.title} ${topic.subject}`.toLowerCase().includes(search.toLowerCase()),
    );
    return ranked.sort((a, b) => {
      const score = (t: Topic) =>
        (t.confidence === "M" ? 10000 : t.confidence === "H" ? 5000 : 0) +
        (t.next_due_at && t.next_due_at <= today ? 2000 : 0) +
        (!t.confidence ? 1000 : 0) +
        (t.priority === "high" ? 500 : 0);
      return (
        score(b) - score(a) ||
        (a.next_due_at ?? "9999").localeCompare(b.next_due_at ?? "9999") ||
        a.id.localeCompare(b.id)
      );
    });
  }, [topics, filter, search, today]);
  const openAsk = workspace.entries.filter((e) => e.kind === "ask" && e.status === "open");
  const todos = workspace.entries.filter((e) => e.kind === "todo" && e.status === "open");
  const due = topics.filter((t) => t.next_due_at && t.next_due_at <= today);
  const repairs = topics.filter((t) => t.confidence === "M" || t.confidence === "H");
  const todayMinutes = revisions
    .filter((r) => r.revised_at === today)
    .reduce((sum, r) => sum + r.duration_minutes, 0);
  const focusTopic = topics.find((t) => t.id === focus?.topicId);
  const elapsedMs = focus
    ? Math.max(
        0,
        focus.elapsedMs + (focus.runningSince ? Math.max(0, tick - focus.runningSince) : 0),
      )
    : 0;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  function pause() {
    if (focus) setFocus({ ...focus, elapsedMs, runningSince: null });
  }
  function start(topic: Topic) {
    if (focus && focus.topicId !== topic.id) {
      setNotice("A recall is already running. Record that attempt before starting another.");
      navigate("revision");
      return;
    }
    setAttemptVersion((n) => n + 1);
    setTick(Date.now());
    setFocus(
      focus
        ? { ...focus, runningSince: focus.runningSince ?? Date.now() }
        : { topicId: topic.id, elapsedMs: 0, runningSince: Date.now() },
    );
    setAssignment(assignmentFor(topic.id));
    setQuestionId(topic.id);
    navigate("assignments");
  }
  function practiceQuestion(question: Question) {
    const topic = topics.find((t) => t.id === question.id);
    if (topic) start(topic);
  }
  async function saveRecall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!focusTopic) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const saved = await mutate("/api/topics", {
      action: "revise",
      id: focusTopic.id,
      revisedAt: today,
      mark: data.mark,
      proof: data.proof,
      notes: data.notes,
      durationMinutes: Number(data.duration),
      reflection: data.reflection,
      repairAction: data.repair,
      mistakeCategory: data.mistake,
      mood: "steady",
    });
    if (saved) {
      setFocus(null);
      setRecording(false);
      setNotice("Recall saved. Your next revision is scheduled.");
    }
  }
  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const saved = await mutate("/api/topics", {
      action: "update_settings",
      dailyGoalMinutes: Number(data.goal),
      focusBlockMinutes: Number(data.focus),
      urgentWindowDays: settings.urgent_window_days,
      yellowWindowDays: settings.yellow_window_days,
      missedIntervalDays: Number(data.missed),
      hesitantIntervalDays: Number(data.hesitant),
      recalledFirstDays: Number(data.first),
      recalledSecondDays: Number(data.second),
      recalledMasteredDays: Number(data.mastered),
    });
    if (saved) {
      setSettingsOpen(false);
      setNotice("Revision schedule saved.");
    }
  }
  const entryList = (entries: Entry[]) =>
    entries.length ? (
      <div className="m-entry-list">
        {entries.map((entry) => (
          <article key={entry.id} className="m-entry">
            <div className="m-row m-between">
              <span className="m-eyebrow">
                {entry.kind === "ask"
                  ? "Trainer question"
                  : entry.kind === "review"
                    ? "Instructor review"
                    : entry.kind === "todo"
                      ? "Next action"
                      : "Study note"}
                {entry.assignment_number ? ` · A${entry.assignment_number}` : ""}
                {entry.question_number ? ` Q${entry.question_number}` : ""}
              </span>
              <span className={`m-status ${entry.status !== "open" ? "m-green" : ""}`}>
                {entry.status}
              </span>
            </div>
            <h3>{entry.title}</h3>
            {entry.body && <p className="m-preserve">{entry.body}</p>}
            {(entry.trainer || entry.review_date) && (
              <p className="m-muted">
                {entry.trainer}
                {entry.review_date ? ` · ${dateText(entry.review_date)}` : ""}
              </p>
            )}
            {workspace.attachments
              .filter((a) => a.entry_id === entry.id)
              .map((file) => (
                <figure key={file.id} className="m-entry-image">
                  {file.mime_type.startsWith("image/") && (
                    <img src={`/api/maven/attachments/${file.id}`} alt={file.name} loading="lazy" />
                  )}
                  <figcaption>
                    <a href={`/api/maven/attachments/${file.id}?download=1`}>
                      {file.name} · original ({(file.byte_length / 1024).toFixed(0)} KB) ↓
                    </a>
                  </figcaption>
                </figure>
              ))}
            {entry.answer && (
              <div className="m-answer">
                <strong>Trainer response / correction</strong>
                <p className="m-preserve">{entry.answer}</p>
              </div>
            )}
            {entry.repair_action && (
              <div className="m-answer">
                <strong>Next repair / spoken practice</strong>
                <p className="m-preserve">{entry.repair_action}</p>
              </div>
            )}
            <div className="m-row m-between m-wrap">
              <span className="m-muted">
                Updated {dateText(entry.updated_at)}
                {entry.source_url && (
                  <>
                    {" "}
                    ·{" "}
                    <a href={entry.source_url} target="_blank" rel="noreferrer">
                      Original source ↗
                    </a>
                  </>
                )}
              </span>
              <div className="m-row">
                <button
                  className="m-button m-small"
                  disabled={!writable || busy}
                  onClick={() => setCapture({ kind: entry.kind, entry })}
                >
                  Edit / add response
                </button>
                <button
                  className="m-button m-small"
                  disabled={!writable || busy}
                  onClick={() =>
                    void mutate("/api/maven", {
                      action: "status",
                      id: entry.id,
                      status: entry.status === "open" ? "done" : "open",
                    })
                  }
                >
                  {entry.status === "open" ? (
                    <>
                      <Check size={14} />
                      {entry.kind === "todo" ? "Done" : "Resolved"}
                    </>
                  ) : (
                    "Reopen"
                  )}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="m-empty">
        <MessageCircle size={24} />
        <h3>{showClosed ? "No completed entries yet." : "Nothing captured here yet."}</h3>
        <p>Your own questions, evidence and responses will appear here.</p>
      </div>
    );

  return (
    <div className="m-app">
      <aside className="m-sidebar">
        <a
          href="#revision"
          onClick={(event) => {
            event.preventDefault();
            navigate("revision");
          }}
          className="m-brand"
        >
          <span className="m-brand-icon">
            <Brain size={23} />
          </span>
          <span>
            Maven Silicon<strong>Revision</strong>
          </span>
        </a>
        <div className="m-course">
          <span className="m-eyebrow">Your current focus</span>
          <strong>Digital</strong>
          <label className="m-sr" htmlFor="current-assignment">
            Current course assignment
          </label>
          <select
            id="current-assignment"
            value={workspace.profile.current_assignment}
            disabled={!writable || busy}
            onChange={(event) =>
              void mutate("/api/maven", {
                action: "profile",
                current_assignment: Number(event.target.value),
              })
            }
          >
            {catalog.assignments.map((a) => (
              <option key={a.number} value={a.number}>
                Assignment {a.number}
              </option>
            ))}
          </select>
          <span className="m-muted">End of Digital · your reported position</span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "is-active" : ""}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "ask" && openAsk.length > 0 && (
                <span className="m-count">{openAsk.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="m-sidebar-bottom">
          <a href="https://elearn.maven-silicon.com/" target="_blank" rel="noreferrer">
            Maven eLearn ↗
          </a>
          <a
            href="https://github.com/kapiltrip/Assignments-Maven-Silicon"
            target="_blank"
            rel="noreferrer"
          >
            Assignment notebooks ↗
          </a>
          <button className="m-text-link" onClick={() => setSettingsOpen(true)}>
            <Settings2 size={15} />
            Revision schedule
          </button>
          <PwaInstallButton />
          <p>Recall. Explain. Apply.</p>
        </div>
      </aside>
      <main className="m-main">
        <header className="m-topbar">
          <span>{dateText(today)}</span>
          <div className="m-row">
            <span className={`m-sync ${!writable ? "is-offline" : ""}`}>
              {writable ? <span className="m-dot" /> : <WifiOff size={14} />}{" "}
              {writable ? "Synced" : "Offline · read only"}
            </span>
            <button
              className="m-icon"
              aria-label="Refresh workspace"
              title={
                syncedAt
                  ? `Last refreshed ${new Date(syncedAt).toLocaleTimeString("en-IN")}`
                  : "Refresh"
              }
              onClick={() => void load()}
            >
              <RefreshCw size={17} />
            </button>
            <button
              className="m-button m-primary m-small"
              disabled={!writable}
              onClick={() =>
                setCapture({ kind: "ask", assignment: workspace.profile.current_assignment })
              }
            >
              <Plus size={16} />
              Capture
            </button>
          </div>
        </header>
        {error && (
          <div role="alert" className="m-banner m-error">
            {error}
            <button className="m-text-link" onClick={() => void load()}>
              Retry
            </button>
          </div>
        )}
        {!writable && (
          <div role="status" className="m-banner">
            You’re reading the last saved snapshot. Reconnect to record recalls or save captures.
          </div>
        )}
        {notice && (
          <div role="status" className="m-toast">
            {notice}
            <button
              className="m-icon"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="m-content">
          <div className="m-next">
            <div>
              <span className="m-eyebrow">Up next</span>
              <p>
                {todos[0]?.title ??
                  `Continue Digital Assignment ${workspace.profile.current_assignment}`}
              </p>
            </div>
            <button
              className="m-text-link"
              onClick={() => {
                if (todos.length) navigate("capture");
                else {
                  setAssignment(workspace.profile.current_assignment);
                  navigate("assignments");
                }
              }}
            >
              {todos.length ? "Open to-do" : "Open assignment"}
              <ChevronRight size={16} />
            </button>
          </div>
          {loading ? (
            <div className="m-panel m-loading" aria-busy="true">
              <Brain size={28} />
              <p>Loading your revision workspace…</p>
            </div>
          ) : (
            <>
              {view === "revision" && (
                <>
                  <div className="m-page-heading">
                    <div>
                      <span className="m-eyebrow">Maven Silicon · Digital</span>
                      <h1>Keep it in memory.</h1>
                      <p>Rebuild it first. Check your work. Come back before it fades.</p>
                    </div>
                    <button
                      className="m-button"
                      disabled={!writable}
                      onClick={() =>
                        setCapture({
                          kind: "todo",
                          assignment: workspace.profile.current_assignment,
                        })
                      }
                    >
                      <Plus size={16} />
                      Next action
                    </button>
                  </div>
                  <div className="m-metrics">
                    <div>
                      <span>Today’s practice</span>
                      <strong>
                        {todayMinutes}
                        <small> / {settings.daily_goal_minutes} min</small>
                      </strong>
                      <progress
                        max={settings.daily_goal_minutes}
                        value={todayMinutes}
                        aria-label="Daily revision goal"
                      />
                    </div>
                    <div>
                      <span>Due for recall</span>
                      <strong>
                        {due.length}
                        <small> questions</small>
                      </strong>
                      <p>
                        {topics.filter((t) => !t.confidence).length} still awaiting a first recall
                      </p>
                    </div>
                    <div>
                      <span>Needs a repair</span>
                      <strong>
                        {repairs.length}
                        <small> questions</small>
                      </strong>
                      <p>Hesitant or missed on the last attempt</p>
                    </div>
                  </div>
                  <div className="m-section-heading">
                    <div>
                      <h2>Your recall queue</h2>
                      <p>
                        Misses and due recalls rise to the top. Studied material stays separate from
                        proven recall.
                      </p>
                    </div>
                    <button className="m-text-link" onClick={() => setSettingsOpen(true)}>
                      R / H / M schedule
                    </button>
                  </div>
                  <div className="m-toolbar">
                    <label className="m-search">
                      <span className="m-sr">Search revision questions</span>
                      <input
                        placeholder="Find a concept or question…"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setQueueLimit(12);
                        }}
                      />
                    </label>
                    <label>
                      <span className="m-sr">Assignment filter</span>
                      <select
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setQueueLimit(12);
                        }}
                      >
                        <option value="all">All imported assignments</option>
                        {catalog.assignments
                          .filter((a) => a.available)
                          .map((a) => (
                            <option key={a.number} value={a.number}>
                              Assignment {a.number}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                  <div className="m-queue">
                    {queue.slice(0, queueLimit).map((topic) => (
                      <div key={topic.id} className="m-queue-row">
                        <span className={`m-recall-mark ${topic.confidence ?? "new"}`}>
                          {topic.confidence ?? "–"}
                        </span>
                        <button
                          className="m-question-link"
                          onClick={() => {
                            setAssignment(assignmentFor(topic.id));
                            setQuestionId(topic.id);
                            navigate("assignments");
                          }}
                        >
                          <span>Assignment {assignmentFor(topic.id)}</span>
                          <strong>{topic.title}</strong>
                        </button>
                        <div className="m-queue-meta">
                          <span
                            className={
                              topic.next_due_at && topic.next_due_at <= today ? "m-due" : ""
                            }
                          >
                            {dueLabel(topic, today)}
                          </span>
                          <small>
                            {topic.revision_count} recalls · ~{topic.estimated_minutes} min
                          </small>
                        </div>
                        <button
                          className="m-button m-small"
                          disabled={!writable}
                          onClick={() => start(topic)}
                        >
                          <Play size={14} />
                          Recall
                        </button>
                      </div>
                    ))}
                    {!queue.length && (
                      <div className="m-empty">No questions match this filter.</div>
                    )}
                  </div>
                  {queue.length > queueLimit && (
                    <button
                      className="m-button m-load-more"
                      onClick={() => setQueueLimit((n) => n + 20)}
                    >
                      Show more questions ({queue.length - queueLimit} remaining)
                    </button>
                  )}
                  <div className="m-section-heading">
                    <div>
                      <h2>Recent recall</h2>
                      <p>Your recorded evidence and next revision.</p>
                    </div>
                  </div>
                  {revisions.length ? (
                    <div className="m-history">
                      {revisions.slice(0, 6).map((r) => (
                        <article key={r.id}>
                          <span className={`m-recall-mark ${r.mark}`}>{r.mark}</span>
                          <div>
                            <strong>
                              {topics.find((t) => t.id === r.topic_id)?.title ?? r.topic_id}
                            </strong>
                            <p>{r.proof}</p>
                            {r.repair_action && <p>Repair: {r.repair_action}</p>}
                            <small>
                              {dateText(r.revised_at)} · {r.duration_minutes} min · Next{" "}
                              {dateText(r.next_due_at)}
                            </small>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="m-panel m-muted">
                      No recall attempts recorded yet. The imported notebooks do not count as
                      completed revision.
                    </p>
                  )}
                </>
              )}
              {view === "assignments" && (
                <>
                  <div className="m-page-heading">
                    <div>
                      <span className="m-eyebrow">Concepts · applications · solving</span>
                      <h1>Your Digital assignments.</h1>
                      <p>Original question, your handwriting, and the full discussion—together.</p>
                    </div>
                  </div>
                  <div className="m-assignment-tabs" aria-label="Choose assignment">
                    {catalog.assignments.map((a) => (
                      <button
                        key={a.number}
                        onClick={() => {
                          setAssignment(a.number);
                          setQuestionId(null);
                        }}
                        className={assignment === a.number ? "is-active" : ""}
                      >
                        <span>Assignment {String(a.number).padStart(2, "0")}</span>
                        <small>
                          {a.number === workspace.profile.current_assignment
                            ? "Current"
                            : a.available
                              ? `${a.questionCount} questions`
                              : "Source needed"}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="m-modes" aria-label="Practice mode">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        aria-pressed={mode === m.id}
                        className={mode === m.id ? "is-active" : ""}
                        onClick={() => setMode(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {catalog.assignments.some((a) => a.number === assignment && a.available) ? (
                    <QuestionReader
                      assignment={assignment}
                      questionId={questionId}
                      mode={mode}
                      attemptVersion={attemptVersion}
                      onQuestion={setQuestionId}
                      onPractise={practiceQuestion}
                      onAsk={(q) => setCapture({ kind: "ask", assignment, question: q.number })}
                    />
                  ) : (
                    <div className="m-source-needed">
                      <FileText size={32} />
                      <span className="m-eyebrow">Digital · Assignment {assignment}</span>
                      <h2>
                        {assignment === workspace.profile.current_assignment
                          ? "Your current work belongs here."
                          : "Ready for the original material."}
                      </h2>
                      <p>
                        The original questions and solutions for Assignment {assignment} have not
                        been imported yet. Your available assignment notebooks are shown in the tabs
                        above.
                      </p>
                      <p>
                        You can keep your current questions, working and trainer doubts here while
                        the course source is connected.
                      </p>
                      <div className="m-row m-wrap">
                        <button
                          className="m-button m-primary"
                          disabled={!writable}
                          onClick={() => setCapture({ kind: "note", assignment })}
                        >
                          <Plus size={16} />
                          Add work / screenshot
                        </button>
                        <button
                          className="m-button"
                          disabled={!writable}
                          onClick={() => setCapture({ kind: "ask", assignment })}
                        >
                          Ask trainer
                        </button>
                        <a
                          className="m-button"
                          href="https://elearn.maven-silicon.com/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open eLearn ↗
                        </a>
                      </div>
                      {entryList(
                        workspace.entries.filter((e) => e.assignment_number === assignment),
                      )}
                    </div>
                  )}
                </>
              )}
              {view === "reviews" && (
                <>
                  <div className="m-page-heading">
                    <div>
                      <span className="m-eyebrow">Definitions · reasoning · how to speak</span>
                      <h1>Be ready to explain.</h1>
                      <p>
                        Keep instructor feedback beside the concept, then practise a clearer answer.
                      </p>
                    </div>
                    <button
                      className="m-button m-primary"
                      disabled={!writable}
                      onClick={() =>
                        setCapture({
                          kind: "review",
                          assignment: workspace.profile.current_assignment,
                        })
                      }
                    >
                      <Plus size={16} />
                      Add review
                    </button>
                  </div>
                  <div className="m-panel m-speaking">
                    <Mic size={23} />
                    <div>
                      <h2>A useful spoken answer</h2>
                      <p>
                        Define it precisely. Explain the mechanism. Give one circuit or use case.
                        Finish with a limitation or common mistake.
                      </p>
                      <button
                        className="m-text-link"
                        onClick={() => {
                          setMode("speak");
                          setAssignment(5);
                          setQuestionId(null);
                          navigate("assignments");
                        }}
                      >
                        Practise with an assignment question <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="m-source-note">
                    <strong>Jansi email review</strong>
                    <p>
                      The review email has not been imported. No instructor feedback, acceptance or
                      score has been inferred. Add the verified feedback or original screenshot here
                      when available.
                    </p>
                  </div>
                  <div className="m-row m-between m-section-heading">
                    <h2>Instructor feedback</h2>
                    <label className="m-check">
                      <input
                        type="checkbox"
                        checked={showClosed}
                        onChange={(e) => setShowClosed(e.target.checked)}
                      />
                      Include resolved
                    </label>
                  </div>
                  {entryList(
                    workspace.entries.filter(
                      (e) => e.kind === "review" && (showClosed || e.status === "open"),
                    ),
                  )}
                </>
              )}
              {view === "ask" && (
                <>
                  <div className="m-page-heading">
                    <div>
                      <span className="m-eyebrow">Bring these to your trainer</span>
                      <h1>To Ask.</h1>
                      <p>Save the exact doubt now. Keep the response and repair with it later.</p>
                    </div>
                    <div className="m-row m-wrap">
                      <a className="m-button" href="/api/maven/export?kind=ask">
                        <Download size={16} />
                        To-Ask.md
                      </a>
                      <button
                        className="m-button m-primary"
                        disabled={!writable}
                        onClick={() =>
                          setCapture({
                            kind: "ask",
                            assignment: workspace.profile.current_assignment,
                          })
                        }
                      >
                        <Plus size={16} />
                        Add question
                      </button>
                    </div>
                  </div>
                  <div className="m-row m-between m-list-toolbar">
                    <span>{openAsk.length} open questions</span>
                    <label className="m-check">
                      <input
                        type="checkbox"
                        checked={showClosed}
                        onChange={(e) => setShowClosed(e.target.checked)}
                      />
                      Include answered
                    </label>
                  </div>
                  {entryList(
                    workspace.entries.filter(
                      (e) => e.kind === "ask" && (showClosed || e.status === "open"),
                    ),
                  )}
                </>
              )}
              {view === "capture" && (
                <>
                  <div className="m-page-heading">
                    <div>
                      <span className="m-eyebrow">Keep the useful detail</span>
                      <h1>Notes & next actions.</h1>
                      <p>
                        Paste an image or screenshot as it is. Add the context you’ll need later.
                      </p>
                    </div>
                    <div className="m-row m-wrap">
                      <button
                        className="m-button"
                        disabled={!writable}
                        onClick={() =>
                          setCapture({
                            kind: "todo",
                            assignment: workspace.profile.current_assignment,
                          })
                        }
                      >
                        Add to-do
                      </button>
                      <button
                        className="m-button m-primary"
                        disabled={!writable}
                        onClick={() =>
                          setCapture({
                            kind: "note",
                            assignment: workspace.profile.current_assignment,
                          })
                        }
                      >
                        <Plus size={16} />
                        Capture note
                      </button>
                    </div>
                  </div>
                  <div className="m-row m-between m-list-toolbar">
                    <span>{todos.length} open next actions</span>
                    <label className="m-check">
                      <input
                        type="checkbox"
                        checked={showClosed}
                        onChange={(e) => setShowClosed(e.target.checked)}
                      />
                      Include completed
                    </label>
                  </div>
                  {entryList(
                    workspace.entries.filter(
                      (e) =>
                        ["note", "todo"].includes(e.kind) && (showClosed || e.status === "open"),
                    ),
                  )}
                </>
              )}
              {view === "updates" && (
                <>
                  <div className="m-page-heading">
                    <div>
                      <span className="m-eyebrow">Saved changes, in one place</span>
                      <h1>Updates.</h1>
                      <p>
                        Activity refreshes while the app is open. Export a readable record whenever
                        you need it.
                      </p>
                    </div>
                    <a className="m-button" href="/api/maven/export?kind=updates">
                      <Download size={16} />
                      Updates.md
                    </a>
                  </div>
                  <ol className="m-timeline">
                    {workspace.events.map((e) => (
                      <li key={e.id}>
                        <span className="m-timeline-dot" />
                        <div>
                          <p>{e.message}</p>
                          <time dateTime={e.created_at}>
                            {new Date(e.created_at).toLocaleString("en-IN", {
                              timeZone: "Asia/Kolkata",
                            })}
                          </time>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="m-panel">
                    <h2>Earlier Revision Solved data</h2>
                    <p>
                      The previous curriculum and progress were moved out of the active workspace
                      into a recoverable archive.
                    </p>
                    <div className="m-archive-counts">
                      {workspace.archive.map((row) => (
                        <span key={row.source_table}>
                          {row.count} {row.source_table.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                    <a className="m-button" href="/api/maven/export?kind=archive">
                      <Download size={16} />
                      Download earlier data
                    </a>
                    <p className="m-muted">
                      Replaced source files are in your desktop’s To Review /
                      Revision-Solved-before-Maven-2026-10-24 folder.
                    </p>
                  </div>
                  <details className="m-legacy-topics">
                    <summary>
                      Inspect the earlier curriculum ({legacyInventory.length} topics)
                    </summary>
                    <table>
                      <thead>
                        <tr>
                          <th>Previous repository</th>
                          <th>Subject</th>
                          <th>Topic</th>
                        </tr>
                      </thead>
                      <tbody>
                        {legacyInventory.map((topic) => (
                          <tr key={topic.id}>
                            <td>{topic.repository}</td>
                            <td>{topic.subject}</td>
                            <td>{topic.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </>
              )}
            </>
          )}
          <footer className="m-footer">
            <span>Maven Silicon Revision · {questionCount} source questions · Digital</span>
            <div className="m-row">
              <a href="/api/backup">Download full backup</a>
              <label className="m-restore-label">
                Restore backup
                <input
                  type="file"
                  accept="application/json,.json"
                  className="m-sr"
                  disabled={!writable}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    if (file.size > 64000000) {
                      setError("Backup restore supports files up to 64 MB.");
                      return;
                    }
                    void file
                      .text()
                      .then((text) => {
                        const value: unknown = JSON.parse(text);
                        if (!value || typeof value !== "object" || Array.isArray(value))
                          throw new Error("Choose a valid backup file.");
                        setBackupDraft(value as Record<string, unknown>);
                      })
                      .catch(() => setError("The selected file is not a valid JSON backup."));
                  }}
                />
              </label>
            </div>
          </footer>
        </div>
      </main>
      {focusTopic && focus && (
        <div className="m-focusbar">
          <Timer size={20} />
          <div>
            <strong>
              {String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:
              {String(elapsedSeconds % 60).padStart(2, "0")}
            </strong>
            <span>{focusTopic.title}</span>
          </div>
          <button
            className="m-icon"
            aria-label={focus.runningSince ? "Pause recall timer" : "Resume recall timer"}
            onClick={() => {
              if (focus.runningSince) pause();
              else {
                setTick(Date.now());
                setFocus({ ...focus, runningSince: Date.now() });
              }
            }}
          >
            {focus.runningSince ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="m-button m-primary m-small"
            disabled={!writable}
            onClick={() => {
              pause();
              setRecording(true);
            }}
          >
            Record recall
          </button>
        </div>
      )}
      {capture && (
        <CaptureForm
          {...capture}
          online={writable}
          onClose={() => setCapture(null)}
          onSaved={() => {
            setCapture(null);
            setNotice("Saved with the original attachments.");
            void load();
          }}
        />
      )}
      {backupDraft && (
        <div className="m-modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-title"
            className="m-modal"
          >
            <div className="m-row m-between">
              <h2 id="backup-title">Restore this backup?</h2>
              <button
                className="m-icon"
                aria-label="Close backup review"
                disabled={busy}
                onClick={() => setBackupDraft(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p>
              The server validates the revision records and the size, type and SHA-256 hash of every
              original attachment. Newer Maven entries are retained. Earlier Revision Solved backups
              go into the legacy archive.
            </p>
            <p>
              {Array.isArray(backupDraft.topics) ? backupDraft.topics.length : 0} revision topics ·
              exported{" "}
              {typeof backupDraft.exportedAt === "string"
                ? dateText(backupDraft.exportedAt)
                : "date unknown"}
            </p>
            <div className="m-row m-end">
              <button className="m-button" disabled={busy} onClick={() => setBackupDraft(null)}>
                Cancel
              </button>
              <button
                className="m-button m-primary"
                disabled={busy || !writable}
                onClick={() =>
                  void mutate("/api/backup", backupDraft).then((saved) => {
                    if (saved) {
                      setBackupDraft(null);
                      setNotice("Backup restored. Original attachments verified.");
                    }
                  })
                }
              >
                {busy ? "Validating & restoring…" : "Restore validated data"}
              </button>
            </div>
          </section>
        </div>
      )}
      {recording && focusTopic && (
        <div className="m-modal-backdrop">
          <section
            className="m-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recall-title"
          >
            <div className="m-row m-between">
              <h2 id="recall-title">Record this recall</h2>
              <button
                className="m-icon"
                aria-label="Close recall form"
                onClick={() => setRecording(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p>{focusTopic.title}</p>
            <form className="m-form" onSubmit={(e) => void saveRecall(e)}>
              <fieldset>
                <legend>How did it go?</legend>
                <div className="m-mark-options">
                  <label>
                    <input type="radio" name="mark" value="R" required />R · Recalled
                  </label>
                  <label>
                    <input type="radio" name="mark" value="H" />H · Hesitant
                  </label>
                  <label>
                    <input type="radio" name="mark" value="M" />M · Missed
                  </label>
                </div>
              </fieldset>
              <label>
                Your proof / explanation
                <textarea
                  name="proof"
                  required
                  maxLength={12000}
                  rows={4}
                  placeholder="What did you derive or explain without help? Where did it break?"
                />
              </label>
              <div className="m-two">
                <label>
                  Minutes
                  <input
                    name="duration"
                    type="number"
                    required
                    min={1}
                    max={600}
                    defaultValue={elapsedMinutes}
                  />
                </label>
                <label>
                  Mistake category
                  <select name="mistake" defaultValue="none">
                    <option value="none">No specific mistake</option>
                    <option value="logic">Logic / equation</option>
                    <option value="timing">Timing / waveform</option>
                    <option value="state">State / sequence</option>
                    <option value="memory">Memory lapse</option>
                    <option value="verification">Verification / proof</option>
                    <option value="interface">Interface / application</option>
                    <option value="syntax">Syntax / notation</option>
                  </select>
                </label>
              </div>
              <label>
                Next repair
                <textarea name="repair" rows={2} maxLength={12000} />
              </label>
              <label>
                Reflection / what helped
                <textarea name="reflection" rows={2} maxLength={12000} />
              </label>
              <label>
                Extra notes
                <textarea name="notes" rows={2} maxLength={12000} />
              </label>
              <p className="m-muted">
                R → {settings.recalled_first_days}/{settings.recalled_second_days}/
                {settings.recalled_mastered_days} days as your streak grows. H →{" "}
                {settings.hesitant_interval_days} days. M → {settings.missed_interval_days} day(s).
              </p>
              <button className="m-button m-primary" disabled={busy || !writable}>
                {busy ? "Saving…" : "Save & schedule next recall"}
              </button>
            </form>
          </section>
        </div>
      )}
      {settingsOpen && (
        <div className="m-modal-backdrop">
          <section
            className="m-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className="m-row m-between">
              <h2 id="settings-title">Your revision schedule</h2>
              <button
                className="m-icon"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p>
              Intervals use calendar days. A hesitant or missed attempt resets the recalled streak.
            </p>
            <form className="m-form" onSubmit={(e) => void saveSettings(e)}>
              <div className="m-two">
                {[
                  {
                    name: "goal",
                    label: "Daily goal (minutes)",
                    value: settings.daily_goal_minutes,
                    min: 10,
                    max: 600,
                  },
                  {
                    name: "focus",
                    label: "Focus block (minutes)",
                    value: settings.focus_block_minutes,
                    min: 5,
                    max: 180,
                  },
                  {
                    name: "missed",
                    label: "Missed → days",
                    value: settings.missed_interval_days,
                    min: 1,
                    max: 30,
                  },
                  {
                    name: "hesitant",
                    label: "Hesitant → days",
                    value: settings.hesitant_interval_days,
                    min: 1,
                    max: 60,
                  },
                  {
                    name: "first",
                    label: "First recalled → days",
                    value: settings.recalled_first_days,
                    min: 1,
                    max: 120,
                  },
                  {
                    name: "second",
                    label: "Second recalled → days",
                    value: settings.recalled_second_days,
                    min: 1,
                    max: 180,
                  },
                  {
                    name: "mastered",
                    label: "Later recalled → days",
                    value: settings.recalled_mastered_days,
                    min: 1,
                    max: 365,
                  },
                ].map((field) => (
                  <label key={field.name}>
                    {field.label}
                    <input
                      type="number"
                      name={field.name}
                      required
                      min={field.min}
                      max={field.max}
                      defaultValue={field.value}
                    />
                  </label>
                ))}
              </div>
              <button className="m-button m-primary" disabled={busy || !writable}>
                {busy ? "Saving…" : "Save schedule"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
