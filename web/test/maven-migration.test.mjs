import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { legacyArchiveStatements, mavenSchema } from '../lib/maven/archive.ts';

const now = '2026-10-24T13:00:00.000Z';
function fixture() {
  const db = new DatabaseSync(':memory:');
  const source = fs.readFileSync(
    new URL('../lib/revision-store.ts', import.meta.url),
    'utf8',
  );
  for (const match of source.matchAll(/const \w+TableSql = `([\s\S]*?)`;/g))
    db.exec(match[1]);
  for (const sql of mavenSchema) db.exec(sql);
  db.prepare(
    'INSERT INTO topics(id,repository,subject,title,proof,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',
  ).run(
    'legacy-1',
    'hdlbits',
    'FSM',
    'Saved old topic',
    'Original proof',
    now,
    now,
  );
  db.prepare(
    'INSERT INTO topics(id,repository,subject,title,created_at,updated_at) VALUES (?,?,?,?,?,?)',
  ).run('maven-test', 'maven-silicon', 'Digital', 'New curriculum', now, now);
  db.prepare(
    "INSERT INTO subtopics(id,topic_id,label,created_at,updated_at) VALUES ('old-check','legacy-1','Original check',?,?)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO revisions(topic_id,mark,revised_at,next_due_at,proof,created_at) VALUES ('legacy-1','H','2026-10-24','2026-10-27','Original recall',?)",
  ).run(now);
  db.prepare(
    "INSERT INTO todo_items(id,title,created_at,updated_at) VALUES ('old-todo','An earlier task',?,?)",
  ).run(now, now);
  db.prepare(
    "INSERT INTO revision_settings(id,updated_at) VALUES ('default',?)",
  ).run(now);
  return db;
}
function migrate(db) {
  db.exec('BEGIN');
  try {
    for (const { sql, args } of legacyArchiveStatements(now))
      db.prepare(sql).run(...args);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

test('Maven migration preserves exact legacy records and removes them from the active curriculum', () => {
  const db = fixture();
  const before = db.prepare("SELECT * FROM topics WHERE id='legacy-1'").get();
  const beforeRecall = db.prepare('SELECT * FROM revisions').get();
  migrate(db);
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS n FROM topics WHERE repository <> 'maven-silicon'",
      )
      .get().n,
    0,
  );
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM subtopics').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM revisions').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM todo_items').get().n, 0);
  assert.deepEqual(
    JSON.parse(
      db
        .prepare("SELECT payload FROM maven_archive WHERE id='topics:legacy-1'")
        .get().payload,
    ),
    { ...before },
  );
  assert.deepEqual(
    JSON.parse(
      db
        .prepare(
          "SELECT payload FROM maven_archive WHERE source_table='revisions'",
        )
        .get().payload,
    ),
    { ...beforeRecall },
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS n FROM topics WHERE id='maven-test'").get()
      .n,
    1,
  );
  assert.equal(
    db
      .prepare(
        "SELECT current_assignment FROM maven_profile WHERE id='default'",
      )
      .get().current_assignment,
    7,
  );
});

test('migration is idempotent and never archives tasks added after the switch', () => {
  const db = fixture();
  migrate(db);
  const count = db.prepare('SELECT COUNT(*) AS n FROM maven_archive').get().n;
  db.prepare(
    "INSERT INTO todo_items(id,title,created_at,updated_at) VALUES ('new-task','Keep this',?,?)",
  ).run(now, now);
  migrate(db);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM maven_archive').get().n,
    count,
  );
  assert.equal(
    db.prepare("SELECT title FROM todo_items WHERE id='new-task'").get().title,
    'Keep this',
  );
});

test('a failed archive transaction leaves every original in place', () => {
  const db = fixture();
  db.exec(
    "CREATE TRIGGER fail_archive BEFORE INSERT ON maven_archive WHEN NEW.source_table='revisions' BEGIN SELECT RAISE(ABORT,'test failure'); END",
  );
  assert.throws(() => migrate(db), /test failure/);
  assert.equal(
    db.prepare("SELECT title FROM topics WHERE id='legacy-1'").get().title,
    'Saved old topic',
  );
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM maven_archive').get().n,
    0,
  );
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM maven_migrations').get().n,
    0,
  );
});
