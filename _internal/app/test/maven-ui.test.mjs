import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React from 'react';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3210/',
});
for (const name of [
  'window',
  'document',
  'HTMLElement',
  'Element',
  'Node',
  'MutationObserver',
  'localStorage',
  'FormData',
  'File',
])
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value: dom.window[name],
  });
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: dom.window.navigator,
});
window.matchMedia = () => ({
  matches: false,
  addEventListener() {},
  removeEventListener() {},
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { render, screen, fireEvent, waitFor, cleanup, act } =
  await import('@testing-library/react');
const { MavenApp } = await import('../features/maven/maven-app.tsx');
let fixture, requests, handler;
const response = (value) =>
  new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
  });
const workspace = () => ({
  profile: { current_assignment: 7, updated_at: '2026-10-24T12:00:00Z' },
  storageScope: 'local',
  serverTime: '2026-10-24T12:00:00Z',
  entries: fixture.entries,
  attachments: fixture.attachments,
  events: [],
  archive: [],
});
const study = () => ({
  topics: [],
  revisions: [],
  settings: { daily_goal_minutes: 60 },
});
function capture(title, id = 'entry-1') {
  return {
    id,
    kind: 'ask',
    title,
    body: 'Exact doubt',
    assignment_number: 7,
    question_number: null,
    status: 'open',
    answer: '',
    trainer: '',
    review_date: null,
    repair_action: '',
    source_url: null,
    created_at: '2026-10-24T12:00:00Z',
    updated_at: '2026-10-24T12:00:00Z',
  };
}
beforeEach(() => {
  fixture = { entries: [], attachments: [] };
  requests = [];
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: true,
  });
  handler = async (url, options) => {
    if (options?.method === 'POST') return response({ ok: true });
    return response(url === '/api/topics' ? study() : workspace());
  };
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return handler(url, options);
  };
});
afterEach(() => cleanup());
async function loaded() {
  await screen.findByText('Up to date');
}

test('the app waits for a successful load and records a trainer question through its form', async () => {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const normal = handler;
  handler = async (url, options) => {
    if (!options?.method) await pending;
    return normal(url, options);
  };
  render(React.createElement(MavenApp));
  assert.ok(screen.getByText('Connecting…'));
  assert.equal(screen.getByRole('button', { name: 'Capture' }).disabled, true);
  await act(async () => release());
  await loaded();
  assert.equal(
    requests.filter((r) => r.url === '/api/maven').length,
    1,
    'initial workspace is fetched once',
  );
  fireEvent.click(screen.getByRole('button', { name: 'To Ask' }));
  fireEvent.click(screen.getByRole('button', { name: 'Add question' }));
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Why does the state toggle?' },
  });
  handler = async (url, options) => {
    if (options?.method === 'POST') {
      assert.equal(options.body.get('title'), 'Why does the state toggle?');
      fixture.entries = [capture(options.body.get('title'))];
      return response({ ok: true, id: 'entry-1' });
    }
    return response(url === '/api/topics' ? study() : workspace());
  };
  fireEvent.click(screen.getByRole('button', { name: 'Save entry' }));
  await screen.findByRole('heading', { name: 'Why does the state toggle?' });
  assert.equal(screen.queryByRole('dialog'), null);
});

test('a failed refresh disables writes and retry returns the workspace to an accurate state', async () => {
  render(React.createElement(MavenApp));
  await loaded();
  handler = async () => {
    throw new Error('Simulated connection loss');
  };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh workspace' }));
  await screen.findByText('Refresh needed');
  assert.equal(screen.getByRole('button', { name: 'Capture' }).disabled, true);
  assert.equal(screen.queryByText('Up to date'), null);
  handler = async (url) =>
    response(url === '/api/topics' ? study() : workspace());
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await loaded();
  assert.equal(screen.getByRole('button', { name: 'Capture' }).disabled, false);
});

test('an older refresh response cannot overwrite a more recent trainer-question list', async () => {
  render(React.createElement(MavenApp));
  await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'To Ask' }));
  let release;
  const old = new Promise((resolve) => {
    release = resolve;
  });
  const capturedOld = {
    ...workspace(),
    entries: [capture('Outdated question')],
  };
  let request = 0;
  handler = async (url) => {
    request++;
    if (request <= 2) {
      await old;
      return response(url === '/api/topics' ? study() : capturedOld);
    }
    return response(
      url === '/api/topics'
        ? study()
        : { ...workspace(), entries: [capture('Newest question')] },
    );
  };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh workspace' }));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh workspace' }));
  await screen.findByRole('heading', { name: 'Newest question' });
  await act(async () => release());
  await waitFor(() =>
    assert.equal(
      screen.queryByRole('heading', { name: 'Outdated question' }),
      null,
    ),
  );
  assert.ok(screen.getByRole('heading', { name: 'Newest question' }));
});

test('review PDFs have an inline reading action and an unchanged-file download', async () => {
  fixture.entries = [{ ...capture('Digital review document'), kind: 'review' }];
  fixture.attachments = [
    {
      id: 'pdf-1',
      entry_id: 'entry-1',
      name: 'Digital-Review.pdf',
      mime_type: 'application/pdf',
      byte_length: 1234,
      sha256: '0'.repeat(64),
    },
  ];
  render(React.createElement(MavenApp));
  await loaded();
  fireEvent.click(screen.getByRole('button', { name: 'Instructor reviews' }));
  assert.ok(await screen.findByText('Read attached PDF'));
  assert.equal(
    screen.getByTitle('Read Digital-Review.pdf').getAttribute('src'),
    '/api/maven/attachments/pdf-1?view=1',
  );
  assert.equal(
    screen
      .getByRole('link', { name: /Digital-Review.pdf/ })
      .getAttribute('href'),
    '/api/maven/attachments/pdf-1?download=1',
  );
});

test('cached offline snapshots remain read only even when the device reports connectivity', async () => {
  render(React.createElement(MavenApp));
  await loaded();
  handler = async (url) =>
    new Response(
      JSON.stringify(url === '/api/topics' ? study() : workspace()),
      {
        headers: { 'Content-Type': 'application/json', 'X-Maven-Offline': '1' },
      },
    );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh workspace' }));
  await screen.findByText('Offline · read only');
  assert.equal(screen.getByRole('button', { name: 'Capture' }).disabled, true);
  assert.equal(screen.queryByText('Up to date'), null);
});
