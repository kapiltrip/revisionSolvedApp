import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import manifest from '../app/manifest.ts';

test('manifest describes an installable standalone education app', () => {
  const value = manifest();
  assert.equal(value.name, 'Revision Solved');
  assert.equal(value.start_url, '/');
  assert.equal(value.scope, '/');
  assert.equal(value.display, 'standalone');
  assert.equal(value.theme_color, '#002060');
  assert.ok(value.icons?.some((icon) => icon.src === '/favicon.svg'));
});

test('service worker keeps API writes network-only and provides a shell fallback', async () => {
  const source = await readFile(
    new URL('../public/sw.js', import.meta.url),
    'utf8',
  );
  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(source, /request\.mode === 'navigate'/);
  assert.match(source, /caches\.match\('\/'\)/);
});
