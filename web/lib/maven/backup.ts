import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { attachmentMime, entryInput, maxAttachmentBytes } from "./input.ts";

type Row = Record<string, string | number | null>;
export type MavenBackup = {
  profile: Row | null;
  entries: Row[];
  attachments: Row[];
  chunks: Row[];
  events: Row[];
  archive: Row[];
};

function rows(value: unknown, max: number): Record<string, unknown>[] {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    value.some((r) => !r || typeof r !== "object" || Array.isArray(r))
  )
    throw new Error("Backup has invalid Maven records.");
  return value as Record<string, unknown>[];
}
function id(value: unknown) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,180}$/.test(value))
    throw new Error("Backup has an invalid Maven identifier.");
  return value;
}
function stamp(value: unknown) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    throw new Error("Backup has an invalid timestamp.");
  return new Date(value).toISOString();
}
function unique(records: Row[], key: string) {
  if (new Set(records.map((r) => r[key])).size !== records.length)
    throw new Error("Backup has duplicate Maven identifiers.");
}

export function parseMavenBackup(value: unknown): MavenBackup | null {
  if (value == null) return null;
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error("Backup has invalid Maven data.");
  const raw = value as Record<string, unknown>;
  const entries = rows(raw.entries, 5000).map((r) => {
    let entry;
    try {
      entry = entryInput(r);
    } catch (error) {
      throw new Error(`Backup entry: ${error instanceof Error ? error.message : "invalid data"}`);
    }
    if (!["open", "done", "answered"].includes(String(r.status)))
      throw new Error("Backup has an invalid entry status.");
    return {
      id: id(r.id),
      kind: entry.kind,
      title: entry.title,
      body: entry.body,
      assignment_number: entry.assignment,
      question_number: entry.question,
      status: String(r.status),
      answer: entry.answer,
      trainer: entry.trainer,
      review_date: entry.reviewDate,
      repair_action: entry.repair,
      source_url: entry.sourceUrl,
      created_at: stamp(r.created_at),
      updated_at: stamp(r.updated_at),
    };
  });
  unique(entries, "id");
  const entryIds = new Set(entries.map((e) => e.id));
  const attachments: Row[] = rows(raw.attachments, 10000).map((r) => {
    const size = Number(r.byte_length);
    if (
      !entryIds.has(String(r.entry_id)) ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > maxAttachmentBytes ||
      typeof r.name !== "string" ||
      !r.name ||
      typeof r.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(r.sha256)
    )
      throw new Error("Backup has invalid original attachment metadata.");
    return {
      id: id(r.id),
      entry_id: id(r.entry_id),
      name: r.name.slice(0, 200),
      mime_type: String(r.mime_type),
      byte_length: size,
      sha256: r.sha256,
      data_base64: typeof r.data_base64 === "string" ? r.data_base64 : "",
      created_at: stamp(r.created_at),
    };
  });
  unique(attachments, "id");
  const fileIds = new Set(attachments.map((a) => a.id));
  const chunks: Row[] = rows(raw.chunks, 50000).map((r) => {
    const index = Number(r.chunk_index);
    if (
      !fileIds.has(String(r.attachment_id)) ||
      !Number.isInteger(index) ||
      index < 0 ||
      index > 31 ||
      typeof r.data_base64 !== "string" ||
      r.data_base64.length > 350000 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(r.data_base64)
    )
      throw new Error("Backup has invalid original image chunks.");
    return { attachment_id: id(r.attachment_id), chunk_index: index, data_base64: r.data_base64 };
  });
  for (const attachment of attachments) {
    const parts = chunks
      .filter((c) => c.attachment_id === attachment.id)
      .sort((a, b) => Number(a.chunk_index) - Number(b.chunk_index));
    if (parts.some((c, index) => c.chunk_index !== index))
      throw new Error("Backup is missing an original image chunk.");
    const bytes = parts.length
      ? Buffer.concat(parts.map((p) => Buffer.from(String(p.data_base64), "base64")))
      : Buffer.from(String(attachment.data_base64), "base64");
    if (
      bytes.length !== attachment.byte_length ||
      createHash("sha256").update(bytes).digest("hex") !== attachment.sha256 ||
      attachmentMime(bytes) !== attachment.mime_type
    )
      throw new Error("Backup original attachment failed its size, type or SHA-256 check.");
  }
  const events: Row[] = rows(raw.events, 20000).map((r) => {
    if (typeof r.message !== "string" || r.message.length > 12000)
      throw new Error("Backup has an invalid update.");
    return { id: id(r.id), message: r.message, created_at: stamp(r.created_at) };
  });
  unique(events, "id");
  const allowedTables = new Set([
    "topics",
    "subtopics",
    "revisions",
    "todo_items",
    "hdlbits_practice_sessions",
    "revision_settings",
  ]);
  const archive: Row[] = rows(raw.archive, 20000).map((r) => {
    if (
      typeof r.id !== "string" ||
      r.id.length > 250 ||
      !allowedTables.has(String(r.source_table)) ||
      typeof r.payload !== "string" ||
      r.payload.length > 100000
    )
      throw new Error("Backup has an invalid earlier-data archive.");
    try {
      const payload = JSON.parse(r.payload);
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error();
    } catch {
      throw new Error("Backup archive record is not valid JSON.");
    }
    return {
      id: r.id,
      source_table: String(r.source_table),
      payload: r.payload,
      archived_at: stamp(r.archived_at),
    };
  });
  unique(archive, "id");
  let profile: Row | null = null;
  if (raw.profile) {
    const p = raw.profile as Record<string, unknown>;
    const current = Number(p.current_assignment);
    if (!Number.isInteger(current) || current < 1 || current > 7)
      throw new Error("Backup has an invalid current assignment.");
    profile = { id: "default", current_assignment: current, updated_at: stamp(p.updated_at) };
  }
  return { entries, attachments, chunks, events, archive, profile };
}

export async function exportMavenData(db: D1Database) {
  const [profile, entries, attachments, chunks, events, archive] = await Promise.all([
    db.prepare("SELECT * FROM maven_profile WHERE id='default'").first(),
    db.prepare("SELECT * FROM maven_entries ORDER BY id").all(),
    db.prepare("SELECT * FROM maven_attachments ORDER BY id").all(),
    db.prepare("SELECT * FROM maven_attachment_chunks ORDER BY attachment_id,chunk_index").all(),
    db.prepare("SELECT * FROM maven_events ORDER BY created_at,id").all(),
    db.prepare("SELECT * FROM maven_archive ORDER BY id").all(),
  ]);
  return {
    profile,
    entries: entries.results,
    attachments: attachments.results,
    chunks: chunks.results,
    events: events.results,
    archive: archive.results,
  };
}

export async function restoreMavenData(db: D1Database, data: MavenBackup | null) {
  if (!data) return;
  const statements: D1PreparedStatement[] = [];
  for (const attachment of data.attachments) {
    const existing = await db
      .prepare("SELECT sha256 FROM maven_attachments WHERE id=?")
      .bind(attachment.id)
      .first<{ sha256: string }>();
    if (existing && existing.sha256 !== attachment.sha256)
      throw new Error("Backup conflicts with a different existing original image.");
  }
  const add = (table: string, columns: string[], row: Row, conflict = "") =>
    statements.push(
      db
        .prepare(
          `INSERT ${conflict ? "" : "OR IGNORE "}INTO ${table} (${columns.join(",")}) VALUES (${columns.map(() => "?").join(",")}) ${conflict}`,
        )
        .bind(...columns.map((c) => row[c])),
    );
  for (const entry of data.entries) {
    const columns = [
      "id",
      "kind",
      "title",
      "body",
      "assignment_number",
      "question_number",
      "status",
      "answer",
      "trainer",
      "review_date",
      "repair_action",
      "source_url",
      "created_at",
      "updated_at",
    ];
    add(
      "maven_entries",
      columns,
      entry,
      `ON CONFLICT(id) DO UPDATE SET ${columns
        .filter((c) => !["id", "created_at"].includes(c))
        .map((c) => `${c}=excluded.${c}`)
        .join(",")} WHERE excluded.updated_at > maven_entries.updated_at`,
    );
  }
  for (const file of data.attachments)
    add(
      "maven_attachments",
      ["id", "entry_id", "name", "mime_type", "byte_length", "sha256", "data_base64", "created_at"],
      file,
    );
  for (const chunk of data.chunks)
    add("maven_attachment_chunks", ["attachment_id", "chunk_index", "data_base64"], chunk);
  for (const event of data.events) add("maven_events", ["id", "message", "created_at"], event);
  for (const archive of data.archive)
    add("maven_archive", ["id", "source_table", "payload", "archived_at"], archive);
  if (data.profile)
    add(
      "maven_profile",
      ["id", "current_assignment", "updated_at"],
      data.profile,
      "ON CONFLICT(id) DO UPDATE SET current_assignment=excluded.current_assignment,updated_at=excluded.updated_at WHERE excluded.updated_at > maven_profile.updated_at",
    );
  if (statements.length) await db.batch(statements);
}
