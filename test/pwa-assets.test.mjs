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

test('service worker keeps writes network-only, caches read snapshots, and provides a shell fallback', async () => {
  const source = await readFile(
    new URL('../public/sw.js', import.meta.url),
    'utf8',
  );
  assert.match(source, /request\.method !== 'GET'/);
  assert.match(source, /SNAPSHOT_ENDPOINTS\.has\(url\.pathname\)/);
  assert.match(source, /'\/api\/topics'/);
  assert.match(source, /'\/api\/todos'/);
  assert.match(source, /'\/api\/hdlbits-practice'/);
  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(source, /cache\.put\(request, copy\)/);
  assert.match(source, /request\.mode === 'navigate'/);
  assert.match(source, /caches\.match\('\/'\)/);
});
