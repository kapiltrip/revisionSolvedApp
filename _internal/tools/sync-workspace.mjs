import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const internalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.dirname(internalRoot);
const baseUrl = "http://localhost:3210";
const hash = (value) => createHash("sha256").update(value).digest("hex");

export async function syncWorkingFiles({
  root = projectRoot,
  base = baseUrl,
  fetcher = fetch,
} = {}) {
  const stateDirectory = path.join(root, "_internal", "work", "mirrors");
  fs.mkdirSync(stateDirectory, { recursive: true });
  const statePath = path.join(stateDirectory, "state.json");
  let previous = {};
  try {
    previous = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {}
  const state = { updatedAt: new Date().toISOString(), files: {} };
  for (const [filename, kind] of [
    ["To-Ask.md", "ask"],
    ["Updates.md", "updates"],
  ]) {
    const response = await fetcher(`${base}/api/maven/export?kind=${kind}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Could not synchronize ${filename}: HTTP ${response.status}`);
    if (!response.headers.get("content-type")?.startsWith("text/markdown"))
      throw new Error(`Unexpected export format for ${filename}; existing file retained.`);
    const content = await response.text();
    const destination = path.join(root, filename);
    const existing = fs.existsSync(destination) ? fs.readFileSync(destination, "utf8") : null;
    const digest = hash(content);
    if (existing !== content) {
      if (
        existing &&
        (!previous.files?.[filename] || hash(existing) !== previous.files[filename])
      ) {
        // Preserve manual edits before refreshing a generated working file.
        const inbox = path.join(root, "_internal", "sources", "file-inbox");
        fs.mkdirSync(inbox, { recursive: true });
        const original = path.join(
          inbox,
          `${path.parse(filename).name}-${hash(existing).slice(0, 12)}.md`,
        );
        if (!fs.existsSync(original)) fs.writeFileSync(original, existing);
      }
      const temporary = path.join(stateDirectory, filename + ".tmp");
      fs.writeFileSync(temporary, content);
      fs.renameSync(temporary, destination);
    }
    state.files[filename] = digest;
  }
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  return state;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const once = process.argv.includes("--once");
  const heartbeat = path.join(internalRoot, "work", "mirrors", "heartbeat.json");
  async function run() {
    try {
      const state = await syncWorkingFiles();
      fs.writeFileSync(heartbeat, JSON.stringify({ pid: process.pid, ...state }));
      if (once) console.log("Working Markdown files match saved app data.");
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      if (once) process.exitCode = 1;
    }
  }
  await run();
  if (!once) {
    let active = false;
    setInterval(async () => {
      if (active) return;
      active = true;
      try {
        await run();
      } finally {
        active = false;
      }
    }, 10000);
  }
}
