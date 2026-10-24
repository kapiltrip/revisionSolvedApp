import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { syncWorkingFiles } from '../../tools/sync-workspace.mjs';
import { viewThemes } from '../features/maven/themes.ts';

test('working Markdown mirrors exact saved data and preserves manual edits', async () => {
  const work = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'work',
    'mirror-tests',
  );
  fs.mkdirSync(work, { recursive: true });
  const root = fs.mkdtempSync(path.join(work, 'case-'));
  const fetcher = async (url) =>
    new Response(
      url.includes('kind=ask')
        ? '# To Ask\n\nOriginal trainer question\n'
        : '# Updates\n\nSaved review\n',
      { headers: { 'Content-Type': 'text/markdown' } },
    );
  await syncWorkingFiles({ root, fetcher });
  assert.equal(
    fs.readFileSync(path.join(root, 'To-Ask.md'), 'utf8'),
    '# To Ask\n\nOriginal trainer question\n',
  );
  const manual =
    '# My manually added doubt\n\nPlease preserve this exact text.\n';
  fs.writeFileSync(path.join(root, 'To-Ask.md'), manual);
  await syncWorkingFiles({ root, fetcher });
  const inbox = path.join(root, '_internal', 'sources', 'file-inbox');
  assert.equal(
    fs.readFileSync(path.join(inbox, fs.readdirSync(inbox)[0]), 'utf8'),
    manual,
  );
  assert.equal(
    fs.readFileSync(path.join(root, 'Updates.md'), 'utf8'),
    '# Updates\n\nSaved review\n',
  );
  const before = fs.readFileSync(path.join(root, 'To-Ask.md'), 'utf8');
  await assert.rejects(
    () =>
      syncWorkingFiles({
        root,
        fetcher: async () => new Response('Unavailable', { status: 503 }),
      }),
    /503/,
  );
  assert.equal(fs.readFileSync(path.join(root, 'To-Ask.md'), 'utf8'), before);
});

test('all six view accents retain readable button and label contrast', () => {
  function luminance(hex) {
    const rgb = hex
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const contrast = (a, b) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  for (const [view, theme] of Object.entries(viewThemes)) {
    assert.ok(contrast('#ffffff', theme.ink) >= 4.5, `${view} button contrast`);
    assert.ok(
      contrast(theme.soft, theme.ink) >= 4.5,
      `${view} selected-label contrast`,
    );
  }
});
