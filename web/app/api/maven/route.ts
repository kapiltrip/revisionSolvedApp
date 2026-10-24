import { Buffer } from "node:buffer";
import { getRevisionStore } from "@/lib/revision-store";
import { attachmentMime, boundedBody, entryInput, maxAttachmentBytes } from "@/lib/maven/input";

export async function GET() {
  try {
    const db = await getRevisionStore();
    const [profile, entries, attachments, events, archive] = await Promise.all([
      db.prepare("SELECT * FROM maven_profile WHERE id='default'").first(),
      db.prepare("SELECT * FROM maven_entries ORDER BY updated_at DESC,id").all(),
      db
        .prepare(
          "SELECT id,entry_id,name,mime_type,byte_length,sha256 FROM maven_attachments ORDER BY created_at,id",
        )
        .all(),
      db.prepare("SELECT * FROM maven_events ORDER BY created_at DESC,id DESC LIMIT 100").all(),
      db
        .prepare("SELECT source_table,COUNT(*) AS count FROM maven_archive GROUP BY source_table")
        .all(),
    ]);
    return Response.json(
      {
        profile,
        entries: entries.results,
        attachments: attachments.results,
        events: events.results,
        archive: archive.results,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Could not load the Maven workspace." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getRevisionStore();
    const now = new Date().toISOString();
    let body: Record<string, unknown>;
    let files: File[] = [];
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const bytes = await boundedBody(request);
      const form = await new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: bytes,
      }).formData();
      body = Object.fromEntries(
        [...form.entries()].filter(([, value]) => typeof value === "string"),
      );
      files = form
        .getAll("files")
        .filter((value): value is File => value instanceof File && value.size > 0);
      if (files.length > 3) throw new Error("Attach at most three original images or PDFs.");
    } else {
      const bytes = await boundedBody(request, 100000);
      body = JSON.parse(new TextDecoder().decode(bytes));
    }
    const event = (message: string) =>
      db.prepare("INSERT INTO maven_events VALUES (?,?,?)").bind(crypto.randomUUID(), message, now);
    if (body.action === "profile") {
      const current = Number(body.current_assignment);
      if (!Number.isInteger(current) || current < 1 || current > 7)
        throw new Error("Choose a Digital assignment from 1 to 7.");
      await db.batch([
        db
          .prepare("UPDATE maven_profile SET current_assignment=?,updated_at=? WHERE id='default'")
          .bind(current, now),
        event(`Current course position changed to Digital Assignment ${current}.`),
      ]);
      return Response.json({ ok: true });
    }
    if (body.action === "status") {
      if (typeof body.id !== "string") throw new Error("Choose an entry.");
      const entry = await db
        .prepare("SELECT title,kind FROM maven_entries WHERE id=?")
        .bind(body.id)
        .first<{ title: string; kind: string }>();
      if (!entry) return Response.json({ error: "Entry not found." }, { status: 404 });
      const status = body.status === "open" ? "open" : entry.kind === "todo" ? "done" : "answered";
      await db.batch([
        db
          .prepare("UPDATE maven_entries SET status=?,updated_at=? WHERE id=?")
          .bind(status, now, body.id),
        event(`${status === "open" ? "Reopened" : "Completed"}: ${entry.title}`),
      ]);
      return Response.json({ ok: true });
    }
    if (body.action !== "save") throw new Error("Unknown action.");
    const entry = entryInput(body);
    const id = typeof body.id === "string" && body.id ? body.id : crypto.randomUUID();
    const existing = await db.prepare("SELECT id FROM maven_entries WHERE id=?").bind(id).first();
    if (body.id && !existing) return Response.json({ error: "Entry not found." }, { status: 404 });
    const existingFiles = await db
      .prepare("SELECT COUNT(*) AS count FROM maven_attachments WHERE entry_id=?")
      .bind(id)
      .first<{ count: number }>();
    if (Number(existingFiles?.count ?? 0) + files.length > 12)
      throw new Error(
        "This entry already has the maximum 12 attachments. Create a continuation entry.",
      );
    const statements = [
      db
        .prepare(`INSERT INTO maven_entries
      (id,kind,title,body,assignment_number,question_number,status,answer,trainer,review_date,repair_action,source_url,created_at,updated_at)
      VALUES (?,?,?,?,?,?,'open',?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,title=excluded.title,body=excluded.body,
        assignment_number=excluded.assignment_number,question_number=excluded.question_number,answer=excluded.answer,
        trainer=excluded.trainer,review_date=excluded.review_date,repair_action=excluded.repair_action,
        source_url=excluded.source_url,updated_at=excluded.updated_at`)
        .bind(
          id,
          entry.kind,
          entry.title,
          entry.body,
          entry.assignment,
          entry.question,
          entry.answer,
          entry.trainer,
          entry.reviewDate,
          entry.repair,
          entry.sourceUrl,
          now,
          now,
        ),
    ];
    for (const file of files) {
      if (file.size > maxAttachmentBytes)
        throw new Error(
          "Each original attachment must be 8 MB or smaller. The app does not resize or recompress images.",
        );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = attachmentMime(bytes);
      if (!mime) throw new Error("Use an original PNG, JPEG, WebP, GIF, or PDF file.");
      const attachmentId = crypto.randomUUID();
      const hash = Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex");
      statements.push(
        db
          .prepare("INSERT INTO maven_attachments VALUES (?,?,?,?,?,?,?,?)")
          .bind(attachmentId, id, file.name.slice(0, 200), mime, bytes.length, hash, "", now),
      );
      // Chunk large originals below the D1 row-size limit. Decoding and download preserve exact bytes.
      for (let offset = 0, index = 0; offset < bytes.length; offset += 262144, index++) {
        statements.push(
          db
            .prepare("INSERT INTO maven_attachment_chunks VALUES (?,?,?)")
            .bind(
              attachmentId,
              index,
              Buffer.from(bytes.subarray(offset, offset + 262144)).toString("base64"),
            ),
        );
      }
    }
    statements.push(
      event(
        `${existing ? "Updated" : "Added"} ${entry.kind === "ask" ? "trainer question" : entry.kind}: ${entry.title}`,
      ),
    );
    await db.batch(statements);
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save this entry." },
      { status: 400 },
    );
  }
}
