import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = fs.existsSync(path.join(root, "web"))
  ? path.join(root, "web")
  : path.join(root, "app-files");
const directory = path.join(web, "content", "maven");
const mathSource = path.join(web, 'node_modules', 'katex');
const mathAssets = path.join(web, 'public', 'vendor', 'katex');
if (fs.existsSync(path.join(mathSource, 'dist', 'katex.min.css'))) {
  fs.mkdirSync(mathAssets, {recursive:true});
  fs.cpSync(path.join(mathSource,'dist','fonts'),path.join(mathAssets,'fonts'),{recursive:true});
  const css=fs.readFileSync(path.join(mathSource,'dist','katex.min.css'),'utf8').replaceAll('url(fonts/','url(/vendor/katex/fonts/');
  fs.writeFileSync(path.join(mathAssets,'katex.min.css'),css);
  if(fs.existsSync(path.join(mathSource,'LICENSE')))fs.copyFileSync(path.join(mathSource,'LICENSE'),path.join(mathAssets,'LICENSE.txt'));
}
fs.mkdirSync(directory, { recursive: true });
const titles = [
  "Number systems and codes",
  "Boolean algebra and logic gates",
  "Combinational circuits",
  "Latches and flip-flops",
  "Registers and counters",
  "Digital assignment",
  "Current Digital assignment",
];
if (!fs.existsSync(path.join(directory, "catalog.json"))) {
  const assignments = titles.map((title, index) => ({
    number: index + 1,
    title,
    available: false,
    questionCount: 0,
    sourceUrl: null,
    pdfUrl: null,
    questions: [],
  }));
  fs.writeFileSync(
    path.join(directory, "catalog.json"),
    JSON.stringify(
      {
        course: "Maven Silicon",
        module: "Digital",
        currentAssignment: 7,
        sourceCheckedAt: null,
        sourceMode: "empty",
        assignments,
      },
      null,
      2,
    ),
  );
}
for (let number = 1; number <= 5; number++) {
  const filename = path.join(directory, `assignment-0${number}.json`);
  if (!fs.existsSync(filename))
    fs.writeFileSync(
      filename,
      JSON.stringify({
        number,
        title: titles[number - 1],
        available: false,
        questionCount: 0,
        questions: [],
        extraHtml: "",
      }),
    );
}
if (!fs.existsSync(path.join(directory, "source-manifest.json")))
  fs.writeFileSync(path.join(directory, "source-manifest.json"), JSON.stringify({ files: [] }));
