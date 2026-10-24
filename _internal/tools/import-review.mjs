import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(process.argv[2] ?? path.join(root, "..", "..", "..", "review3.pdf"));
const base = "http://localhost:3210";
const bytes = fs.readFileSync(source);
if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
  throw new Error("The review source is not a PDF.");
const sha256 = createHash("sha256").update(bytes).digest("hex");
const directory = path.join(root, "sources", "reviews", "Review-03");
fs.mkdirSync(directory, { recursive: true });
const original = path.join(directory, "Digital-Review-03.pdf");
if (
  fs.existsSync(original) &&
  createHash("sha256").update(fs.readFileSync(original)).digest("hex") !== sha256
)
  throw new Error(
    "A different Review 03 original already exists. Retain both versions before importing a replacement.",
  );
fs.writeFileSync(original, bytes);
if (createHash("sha256").update(fs.readFileSync(original)).digest("hex") !== sha256)
  throw new Error("Review preservation failed.");

async function state() {
  const response = await fetch(base + "/api/maven");
  if (!response.ok) throw new Error("The local app is not ready.");
  return response.json();
}
async function save(fields, files = []) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields))
    form.set(key, value == null ? "" : String(value));
  for (const file of files)
    form.append("files", new Blob([file.bytes], { type: file.type }), file.name);
  const response = await fetch(base + "/api/maven", { method: "POST", body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Review import failed.");
  return result;
}
let current = await state();
const match = current.attachments.find(
  (file) =>
    file.sha256 === sha256 &&
    current.entries.some((entry) => entry.id === file.entry_id && entry.kind === "review"),
);
const details = {
  action: "save",
  kind: "review",
  title: "Digital Review 03 â€” flip-flops and counters",
  body: "Original handwritten review work: JK behavior using a T flip-flop, followed by the 75 â†” 98 counter. The three page previews below are rendered from the unchanged PDF.\n\nSource: the existing local review3.pdf. The matching sent email has not been retrieved or verified. No instructor score, acceptance or feedback has been inferred.",
  trainer: "",
  review_date: "",
  answer: "",
  repair_action: "",
};
const entryId =
  match?.entry_id ??
  (await save(details, [{ name: "Digital-Review-03.pdf", type: "application/pdf", bytes }])).id;
current = await state();
const savedEntry = current.entries.find((entry) => entry.id === entryId);
const preserve = { ...savedEntry, action: "save", id: entryId };
const previews = [];
for (let number = 1; number <= 3; number++) {
  const preview = path.join(root, "work", "review-source", `page-${number}.png`);
  if (!fs.existsSync(preview)) continue;
  const content = fs.readFileSync(preview);
  const name = `Review-03-Page-${String(number).padStart(2, "0")}-preview.png`;
  const digest = createHash("sha256").update(content).digest("hex");
  previews.push({ name, sha256: digest });
  if (!current.attachments.some((file) => file.entry_id === entryId && file.sha256 === digest))
    await save(preserve, [{ name, type: "image/png", bytes: content }]);
}
fs.writeFileSync(
  path.join(directory, "source-manifest.json"),
  JSON.stringify(
    {
      review: 3,
      appEntryId: entryId,
      originalSha256: sha256,
      originalBytes: bytes.length,
      pages: 3,
      previews,
      source: { kind: "local-file", originalPath: source, emailVerified: false },
      importedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    review: 3,
    pages: 3,
    originalBytes: bytes.length,
    entryId,
    originalPreserved: true,
    emailVerified: false,
  }),
);
