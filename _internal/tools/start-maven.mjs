import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "app");
const url = "http://localhost:3210/";
const logs = path.join(web, ".work", "runtime");
const cli = path.join(web, "node_modules", "vinext", "dist", "cli.js");
const noBrowser = process.argv.includes("--no-browser");

async function ready() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return response.ok && (await response.text()).includes("Maven Silicon Revision");
  } catch {
    return false;
  }
}
await import("./prepare-course.mjs");
if (!(await ready())) {
  if (!fs.existsSync(cli))
    throw new Error("Install application dependencies first: cd _internal/app, then pnpm install.");
  fs.mkdirSync(logs, { recursive: true });
  const output = fs.openSync(path.join(logs, "server.log"), "a");
  const errors = fs.openSync(path.join(logs, "server-error.log"), "a");
  const server = spawn(process.execPath, [cli, "dev", "--host", "127.0.0.1", "--port", "3210"], {
    cwd: web,
    detached: true,
    windowsHide: true,
    stdio: ["ignore", output, errors],
    env: {
      ...process.env,
      PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH,
      WRANGLER_SEND_METRICS: "false",
    },
  });
  server.unref();
  fs.closeSync(output);
  fs.closeSync(errors);
  fs.writeFileSync(path.join(logs, "server.pid"), String(server.pid));
  let started = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    if (await ready()) {
      started = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!started)
    throw new Error(`The app did not become ready. See ${path.join(logs, "server-error.log")}`);
}
try {
  const { syncWorkingFiles } = await import("./sync-workspace.mjs");
  await syncWorkingFiles();
  const mirrorDirectory = path.join(root, "work", "mirrors");
  let running = false;
  try {
    const heartbeat = JSON.parse(
      fs.readFileSync(path.join(mirrorDirectory, "heartbeat.json"), "utf8"),
    );
    process.kill(heartbeat.pid, 0);
    running = true;
  } catch {}
  if (!running) {
    const log = fs.openSync(path.join(mirrorDirectory, "sync.log"), "a");
    const companion = spawn(process.execPath, [path.join(root, "tools", "sync-workspace.mjs")], {
      cwd: root,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", log, log],
    });
    companion.unref();
    fs.closeSync(log);
  }
} catch (error) {
  console.error(
    `App ready; working-file synchronization needs attention: ${error instanceof Error ? error.message : String(error)}`,
  );
}
if (!noBrowser) {
  const candidates = [
    process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe"),
    process.env.ProgramFiles &&
      path.join(process.env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"),
    process.env["ProgramFiles(x86)"] &&
      path.join(process.env["ProgramFiles(x86)"], "Google", "Chrome", "Application", "chrome.exe"),
  ];
  const chrome = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!chrome) throw new Error(`Google Chrome was not found. Open ${url} in Chrome.`);
  const browser = spawn(chrome, [url], { detached: true, windowsHide: true, stdio: "ignore" });
  browser.unref();
}
console.log(`Maven Silicon Revision is ready: ${url}`);
