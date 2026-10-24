export const maxAttachmentBytes = 8 * 1024 * 1024;
export const maxRequestBytes = 26 * 1024 * 1024;

export function safeSourceUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.href.slice(0, 2000) : null;
  } catch {
    return null;
  }
}

export function attachmentMime(bytes: Uint8Array): string | null {
  const signature = Array.from(bytes.slice(0, 12));
  if (signature.slice(0, 8).join() === "137,80,78,71,13,10,26,10") return "image/png";
  if (signature[0] === 255 && signature[1] === 216 && signature[2] === 255) return "image/jpeg";
  const ascii = String.fromCharCode(...signature);
  if (ascii.startsWith("GIF87a") || ascii.startsWith("GIF89a")) return "image/gif";
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.startsWith("%PDF-")) return "application/pdf";
  return null;
}

export function entryInput(body: Record<string, unknown>) {
  const text = (key: string, max = 12000) =>
    typeof body[key] === "string" ? (body[key] as string).trim().slice(0, max) : "";
  const kind = text("kind");
  if (!["ask", "todo", "review", "note"].includes(kind))
    throw new Error("Choose a valid capture type.");
  const title = text("title", 240);
  if (!title) throw new Error("Add a title so you can find this later.");
  const integer = (key: string, max: number) => {
    if (body[key] === "" || body[key] == null) return null;
    const value = Number(body[key]);
    if (!Number.isInteger(value) || value < 1 || value > max)
      throw new Error(`Invalid ${key.replaceAll("_", " ")}.`);
    return value;
  };
  const assignment = integer("assignment_number", 7);
  const question = integer("question_number", 200);
  if (question && !assignment) throw new Error("Choose an assignment for this question.");
  const sourceUrl = safeSourceUrl(body.source_url);
  if (text("source_url") && !sourceUrl)
    throw new Error("Source link must be an http or https URL.");
  const reviewDate = text("review_date", 10);
  if (
    reviewDate &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate) ||
      Number.isNaN(Date.parse(reviewDate)) ||
      new Date(reviewDate).toISOString().slice(0, 10) !== reviewDate)
  )
    throw new Error("Choose a valid review date.");
  return {
    kind,
    title,
    body: text("body"),
    assignment,
    question,
    answer: text("answer"),
    trainer: text("trainer", 120),
    reviewDate: reviewDate || null,
    repair: text("repair_action"),
    sourceUrl,
  };
}

export async function boundedBody(
  request: Request,
  max = maxRequestBytes,
  sizeError = "Capture is too large. Use at most three files of 8 MB each.",
) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("The request has no content.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new Error(sizeError);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
