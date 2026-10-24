# Maven course content

The application source repository is public. Original Maven Silicon questions, Kapil's handwriting and complete notebook discussions are generated locally and intentionally ignored by Git.

Run the importer from the repository root to use the private saved assignment collection:

```powershell
node tools/import-maven.mjs 'C:/Users/kapil/OneDrive/Desktop/mavensilicon assignments'
```

This produces `catalog.json`, five assignment JSON files, an image hash manifest and the byte-preserved assets in `public/maven/`. It keeps the original collection unchanged. `prepare-course.mjs` creates an empty, source-needed catalog only when those local generated files are absent, allowing the public application source to build without redistributing course material.

The legacy topic inventory describes the previous public app curriculum and contains no learner progress or private correspondence. Database captures, original uploads and review responses are runtime data, never source files.
