"use client";

import { useEffect, useRef, useState, type FormEvent, type ClipboardEvent } from "react";
import { Paperclip, X, ImagePlus } from "lucide-react";
import type { Entry, Kind } from "./types";

export function CaptureForm({
  kind,
  entry,
  assignment,
  question,
  onSaved,
  onClose,
  online,
}: {
  kind: Kind;
  entry?: Entry | null;
  assignment?: number;
  question?: number;
  onSaved: () => void;
  onClose: () => void;
  online: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ url: string; name: string }>>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedKind, setSelectedKind] = useState<Kind>(entry?.kind ?? kind);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  useEffect(() => {
    const next = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);
  function addFiles(incoming: File[]) {
    setError("");
    if (incoming.some((f) => f.size > 8 * 1024 * 1024)) {
      setError(
        "Each original file must be 8 MB or smaller. Images are preserved without resizing.",
      );
      return;
    }
    if (files.length + incoming.length > 3) {
      setError("Attach up to three files per save.");
      return;
    }
    setFiles((old) => [...old, ...incoming]);
  }
  function paste(event: ClipboardEvent) {
    const pasted = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (pasted.length) {
      event.preventDefault();
      addFiles(pasted);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!online || saving) return;
    setSaving(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      form.set("action", "save");
      if (entry) form.set("id", entry.id);
      for (const file of files) form.append("files", file);
      const response = await fetch("/api/maven", { method: "POST", body: form });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save.");
      onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="m-modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="capture-title"
        className="m-modal"
        onPaste={paste}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !saving) onClose();
        }}
      >
        <div className="m-row m-between">
          <h2 id="capture-title">
            {entry
              ? "Edit entry"
              : kind === "ask"
                ? "Ask your trainer"
                : kind === "review"
                  ? "Record instructor feedback"
                  : kind === "todo"
                    ? "Add a next action"
                    : "Capture a note"}
          </h2>
          <button
            type="button"
            className="m-icon"
            aria-label="Close capture"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p className="m-muted">
          Paste a screenshot here or attach the original. Your image stays exactly as supplied.
        </p>
        <form onSubmit={(event) => void submit(event)} className="m-form">
          <label>
            Save to
            <select
              name="kind"
              value={selectedKind}
              onChange={(event) => setSelectedKind(event.target.value as Kind)}
            >
              <option value="ask">To Ask</option>
              <option value="todo">To-do</option>
              <option value="note">Study note</option>
              <option value="review">Instructor review</option>
            </select>
          </label>
          <label>
            Title
            <input
              name="title"
              ref={titleRef}
              required
              maxLength={240}
              defaultValue={entry?.title ?? ""}
              placeholder={kind === "ask" ? "What do you want to ask?" : "A specific title"}
            />
          </label>
          <div className="m-two">
            <label>
              Assignment
              <select
                name="assignment_number"
                defaultValue={entry?.assignment_number ?? assignment ?? ""}
              >
                <option value="">General</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    Digital · Assignment {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Question (optional)
              <input
                name="question_number"
                type="number"
                min={1}
                max={200}
                defaultValue={entry?.question_number ?? question ?? ""}
              />
            </label>
          </div>
          <label>
            {kind === "review"
              ? "What was reviewed / exact feedback"
              : "Your question, working or context"}
            <textarea
              name="body"
              rows={5}
              maxLength={12000}
              defaultValue={entry?.body ?? ""}
              placeholder="Write the detail that will help you remember this later."
            />
          </label>
          {(selectedKind === "review" || selectedKind === "ask") && (
            <>
              <div className="m-two">
                <label>
                  Trainer (optional)
                  <input name="trainer" maxLength={120} defaultValue={entry?.trainer ?? ""} />
                </label>
                <label>
                  Review date (optional)
                  <input name="review_date" type="date" defaultValue={entry?.review_date ?? ""} />
                </label>
              </div>
              <label>
                Trainer response / correction
                <textarea
                  name="answer"
                  rows={3}
                  defaultValue={entry?.answer ?? ""}
                  maxLength={12000}
                />
              </label>
              <label>
                Next repair / spoken answer to practise
                <textarea
                  name="repair_action"
                  rows={2}
                  defaultValue={entry?.repair_action ?? ""}
                  maxLength={12000}
                />
              </label>
            </>
          )}
          <label>
            Source link (optional)
            <input
              name="source_url"
              type="url"
              defaultValue={entry?.source_url ?? ""}
              placeholder="Email or eLearn link"
              maxLength={2000}
            />
          </label>
          <label className="m-upload">
            <ImagePlus size={20} />
            <span>Attach images or PDF · 8 MB per original</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
              multiple
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
          {files.map((file, index) => (
            <div className="m-file" key={`${file.name}-${index}`}>
              <Paperclip size={14} />
              <span>
                {file.name} · {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                className="m-icon"
                aria-label={`Remove ${file.name} from this draft`}
                onClick={() => setFiles((old) => old.filter((_, i) => i !== index))}
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {previews.map((preview) => (
            <img
              className="m-capture-preview"
              src={preview.url}
              alt={`Original preview: ${preview.name}`}
              key={preview.url}
            />
          ))}
          {entry && <p className="m-muted">Previously saved originals remain attached.</p>}
          {error && (
            <p role="alert" className="m-error">
              {error}
            </p>
          )}
          <div className="m-row m-end">
            <button type="button" className="m-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="m-button m-primary" disabled={saving || !online}>
              {saving ? "Saving original…" : "Save entry"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
