import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const required = [
  "README.md",
  "Updates.md",
  "To-Ask.md",
  "Open-Maven-Silicon-Revision.cmd",
  "_internal",
];
const metadata = new Set([".git", ".gitignore"]);
const actual = fs.readdirSync(root).filter((name) => !metadata.has(name));
const extra = actual.filter((name) => !required.includes(name));
const missing = required.filter((name) => !actual.includes(name));
if (extra.length || missing.length)
  throw new Error(
    `Unexpected outer layout. Extra: ${extra.join(", ")}. Missing: ${missing.join(", ")}`,
  );
for (const name of ["app", "tools", "docs", "sources", "work"])
  if (!fs.statSync(path.join(root, "_internal", name)).isDirectory())
    throw new Error(`Missing _internal/${name}`);
console.log("Outer layout verified: four working files and one _internal folder.");
