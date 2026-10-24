import { getRevisionStore } from "@/lib/revision-store";

export async function GET(request: Request) {
  const db = await getRevisionStore();
  const kind = new URL(request.url).searchParams.get("kind");
  if (kind === "archive") {
    const rows = await db
      .prepare("SELECT * FROM maven_archive ORDER BY source_table,id")
      .all<{ source_table: string; payload: string; archived_at: string }>();
    return Response.json(
      {
        format: "revision-solved-legacy-archive-v1",
        exportedAt: new Date().toISOString(),
        rows: rows.results.map((r) => ({
          table: r.source_table,
          record: JSON.parse(r.payload),
          archivedAt: r.archived_at,
        })),
      },
      {
        headers: {
          "Content-Disposition": 'attachment; filename="Revision-Solved-Archive.json"',
          "Cache-Control": "no-store",
        },
      },
    );
  }
  if (!["ask", "updates"].includes(kind ?? ""))
    return Response.json({ error: "Choose To Ask, Updates or the archive." }, { status: 400 });
  let markdown = "";
  if (kind === "updates") {
    const events = await db
      .prepare("SELECT message,created_at FROM maven_events ORDER BY created_at DESC,id DESC")
      .all<{ message: string; created_at: string }>();
    markdown =
      "# Maven Silicon Revision — updates\n\n" +
      events.results
        .map((e) => `- ${e.created_at}: ${e.message.replaceAll("\n", " ")}`)
        .join("\n") +
      "\n";
  } else {
    const entries = await db
      .prepare("SELECT * FROM maven_entries WHERE kind='ask' ORDER BY status,created_at")
      .all<{
        id: string;
        title: string;
        body: string;
        answer: string;
        status: string;
        assignment_number: number | null;
        question_number: number | null;
      }>();
    const attachments = await db
      .prepare("SELECT id,entry_id,name,mime_type FROM maven_attachments")
      .all<{ id: string; entry_id: string; name: string; mime_type: string }>();
    const origin = new URL(request.url).origin;
    markdown =
      "# To Ask — Maven Silicon\n\n" +
      (entries.results.length
        ? entries.results
            .map(
              (e) =>
                `## ${e.title}\n\nStatus: ${e.status}${e.assignment_number ? ` · Assignment ${e.assignment_number}` : ""}${e.question_number ? ` · Q${e.question_number}` : ""}\n\n${e.body}\n\n${attachments.results
                  .filter((a) => a.entry_id === e.id)
                  .map(
                    (a) =>
                      `${a.mime_type.startsWith("image/") ? "!" : ""}[${a.name.replaceAll("[", "").replaceAll("]", "")}](${origin}/api/maven/attachments/${a.id})`,
                  )
                  .join("\n\n")}${e.answer ? `\n\n### Trainer response\n\n${e.answer}` : ""}\n`,
            )
            .join("\n")
        : "No trainer questions have been captured yet.\n");
  }
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${kind === "ask" ? "To-Ask" : "Updates"}.md"`,
      "Cache-Control": "no-store",
    },
  });
}
