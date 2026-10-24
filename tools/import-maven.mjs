import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = fs.existsSync(path.join(root, "web"))
  ? path.join(root, "web")
  : path.join(root, "app-files");
const require = createRequire(path.join(web, "package.json"));
const { marked } = require("marked");
const katex = require("katex");
const sanitize = require("sanitize-html");
const source = path.resolve(
  process.argv[2] ?? path.join(root, "..", "..", "mavensilicon assignments"),
);
const base = "https://github.com/kapiltrip/Assignments-Maven-Silicon/blob/main/";
const titles = [
  "Number systems and codes",
  "Boolean algebra and logic gates",
  "Combinational circuits",
  "Latches and flip-flops",
  "Registers and counters",
];
const publicRoot = path.join(web, "public", "maven", "digital");
const dataRoot = path.join(web, "content", "maven");
fs.mkdirSync(dataRoot, { recursive: true });
const sources = [];

function publicUrl(assignment, relative) {
  const safe = relative.split("#")[0];
  const resolved = path.resolve(
    source,
    `Assignment ${String(assignment).padStart(2, "0")}`,
    "Revision",
    safe,
  );
  if (!resolved.startsWith(source + path.sep))
    throw new Error(`Source escapes collection: ${relative}`);
  const destination = path.join(
    publicRoot,
    `assignment-${String(assignment).padStart(2, "0")}`,
    safe,
  );
  if (!destination.startsWith(publicRoot + path.sep)) throw new Error("Unsafe output");
  if (!fs.existsSync(resolved)) throw new Error(`Missing source: ${resolved}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(resolved, destination);
  sources.push({
    path: path.relative(source, resolved).replaceAll("\\", "/"),
    sha256: createHash("sha256").update(fs.readFileSync(resolved)).digest("hex"),
  });
  return `/maven/digital/assignment-${String(assignment).padStart(2, "0")}/${safe}`;
}

function render(markdown, assignment) {
  const math = [];
  let text = markdown.replace(
    /\$\$([\s\S]*?)\$\$|\$`([^`]*?)`\$|\$([^$\n]+?)\$/g,
    (_, display, github, inline) => {
      const marker = `MAVENMATHPLACEHOLDER${math.length}END`;
      math.push(
        katex.renderToString(display ?? github ?? inline, {
          displayMode: display !== undefined,
          throwOnError: false,
          trust: false,
          strict: "ignore",
        }),
      );
      return marker;
    },
  );
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (_, alt, uri) => `![${alt}](${publicUrl(assignment, decodeURI(uri))})`,
  );
  text = text.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (_, label, uri) => {
    if (/^(?:https?:|#|\/maven\/)/.test(uri)) return `[${label}](${uri})`;
    const resolved = path.resolve(
      source,
      `Assignment ${String(assignment).padStart(2, "0")}`,
      "Revision",
      decodeURI(uri),
    );
    return `[${label}](${base}${path.relative(source, resolved).split(path.sep).map(encodeURIComponent).join("/")})`;
  });
  let html = sanitize(marked.parse(text), {
    allowedTags: [...sanitize.defaults.allowedTags, "img", "details", "summary"],
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      a: ["href", "id", "title"],
      img: ["src", "alt", "title", "loading"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https"],
  });
  math.forEach((value, i) => {
    html = html.replaceAll(`MAVENMATHPLACEHOLDER${i}END`, value);
  });
  return html;
}

const assignments = [];
for (let number = 1; number <= 5; number++) {
  const directory = path.join(source, `Assignment ${String(number).padStart(2, "0")}`, "Revision");
  const markdown = fs
    .readFileSync(path.join(directory, "README.md"), "utf8")
    .replaceAll("\r\n", "\n");
  const headings = [...markdown.matchAll(/^### A\d+ Q(\d+) [·—-] (.+)$/gm)];
  const questions = headings.map((match, index) => {
    const question = Number(match[1]);
    const section = markdown.slice(
      match.index + match[0].length,
      headings[index + 1]?.index ?? markdown.length,
    );
    const discussionIndex = section.search(/^#### Discussion\s*$/m);
    if (discussionIndex < 0) throw new Error(`Missing discussion: A${number} Q${question}`);
    const before = section.slice(0, discussionIndex);
    const images = [...before.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((m) => ({
      alt: m[1],
      src: publicUrl(number, decodeURI(m[2])),
      kind: /questions\//.test(m[2]) ? "question" : "solution",
    }));
    if (!images.some((i) => i.kind === "question") || !images.some((i) => i.kind === "solution"))
      throw new Error(`Incomplete original images: A${number} Q${question}`);
    const discussion = section
      .slice(discussionIndex)
      .replace(/^#### Discussion\s*\n/, "")
      .replace(/\n\[.*?(?:index|Next|Previous).*?\]\([^\n]*$/gim, "");
    return {
      id: `maven-a${String(number).padStart(2, "0")}-q${String(question).padStart(2, "0")}`,
      number: question,
      title: match[2],
      images,
      html: render(discussion, number),
      sourceUrl: `${base}Assignment%20${String(number).padStart(2, "0")}/Revision/README.md#a${number}-q${String(question).padStart(2, "0")}`,
    };
  });
  const extra = fs.readFileSync(path.join(directory, "Extra-notes.md"), "utf8");
  const metadata = {
    number,
    title: titles[number - 1],
    available: true,
    questionCount: questions.length,
    sourceUrl: `${base}Assignment%20${String(number).padStart(2, "0")}/Revision/README.md`,
    pdfUrl: `${base.replace("/blob/", "/raw/")}Assignment%20${String(number).padStart(2, "0")}/Revision/Assignment-${String(number).padStart(2, "0")}-Revision.pdf`,
  };
  fs.writeFileSync(
    path.join(dataRoot, `assignment-${String(number).padStart(2, "0")}.json`),
    JSON.stringify({ ...metadata, questions, extraHtml: render(extra, number) }),
  );
  assignments.push({
    ...metadata,
    questions: questions.map(({ id, number, title, sourceUrl }) => ({
      id,
      number,
      title,
      sourceUrl,
    })),
  });
}
for (const number of [6, 7])
  assignments.push({
    number,
    title: number === 7 ? "Current Digital assignment" : "Digital assignment",
    available: false,
    questionCount: 0,
    sourceUrl: null,
    pdfUrl: null,
    questions: [],
  });
fs.writeFileSync(
  path.join(dataRoot, "catalog.json"),
  JSON.stringify(
    {
      course: "Maven Silicon",
      module: "Digital",
      currentAssignment: 7,
      sourceCheckedAt: "2026-10-24",
      sourceMode: "imported",
      assignments,
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(dataRoot, "source-manifest.json"),
  JSON.stringify(
    {
      sourceRepository: "kapiltrip/Assignments-Maven-Silicon",
      files: [...new Map(sources.map((x) => [x.path, x])).values()],
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    assignments: 5,
    questions: assignments.reduce((sum, a) => sum + a.questionCount, 0),
    preservedImages: new Set(sources.map((s) => s.path)).size,
  }),
);
