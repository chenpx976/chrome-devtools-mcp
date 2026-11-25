/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {parseArgs, promisify} from 'node:util';

import {Client} from '@modelcontextprotocol/client';
import {StdioClientTransport} from '@modelcontextprotocol/client/stdio';

const {values} = parseArgs({
  options: {'browser-url': {type: 'string', default: 'http://127.0.0.1:9222'}},
});
assert.equal(
  process.platform,
  'darwin',
  'Arc smoke verification requires macOS',
);
const browserUrl = values['browser-url'];
const versionResponse = await fetch(new URL('/json/version', browserUrl), {
  signal: AbortSignal.timeout(5000),
});
assert.ok(versionResponse.ok, 'Arc debugging endpoint must respond');
const version = await versionResponse.json();
console.log(`Debugging browser: ${version.Browser}`);

async function activeTab() {
  const {stdout} = await promisify(execFile)(
    '/usr/bin/osascript',
    [
      '-e',
      'tell application id "company.thebrowser.Browser" to return id of active tab of front window',
    ],
    {timeout: 10_000, encoding: 'utf8'},
  );
  return stdout.trim();
}

const selectedBefore = await activeTab();
const token = randomUUID();
const fixture = http.createServer((request, response) => {
  if (request.url === `/${token}/ping`) {
    response.end('arc-network-ok');
    return;
  }
  if (request.url !== `/${token}`) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  response.end(`<!doctype html><title>Arc compatibility smoke</title>
    <h1>Arc compatibility smoke</h1><button>Test button</button>
    <script>console.log('arc-console-ok'); fetch('/${token}/ping');</script>`);
});
fixture.listen(0, '127.0.0.1');
await once(fixture, 'listening');
const address = fixture.address();
assert.ok(address && typeof address === 'object');
const url = `http://127.0.0.1:${address.port}/${token}`;
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'arc-mcp-smoke-'));
console.log(`Smoke artifacts: ${directory}`);
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [
    path.resolve('out/Default/gen/src/bin/chrome-devtools-mcp.js'),
    '--arc',
    `--browserUrl=${browserUrl}`,
    '--experimentalStructuredContent',
    `--logFile=${path.join(directory, 'server.log')}`,
    `--filesystem-root=${directory}`,
    '--no-usage-statistics',
    '--no-performanceCrux',
  ],
});
const client = new Client({name: 'arc-compatibility-smoke', version: '1.0.0'});
let pageId;

async function call(name, args = {}) {
  console.log(`Running ${name}`);
  const result = await client.callTool({name, arguments: args});
  if (result.isError) {
    const text = result.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');
    throw new Error(`${name} failed: ${text}`);
  }
  return result;
}

function pages(result) {
  const entries = result.structuredContent?.pages;
  assert.ok(Array.isArray(entries), 'Expected structured page listing');
  return entries;
}

try {
  await client.connect(transport);
  const before = pages(await call('list_pages'));
  const created = pages(await call('new_page', {url, background: true}));
  const newPage = created.find(page => page.url === url);
  assert.ok(newPage, 'new_page must return the smoke tab');
  pageId = newPage.id;
  assert.equal(typeof pageId, 'number');
  assert.ok(!before.some(page => page.id === pageId), 'Must create a new page');
  for (const page of before) {
    const retained = created.find(candidate => candidate.id === page.id);
    assert.ok(retained, 'Existing page must remain open');
    assert.equal(retained.url, page.url, 'Existing page URL must not change');
  }
  assert.equal(
    await activeTab(),
    selectedBefore,
    'Background must preserve selection',
  );
  console.log(
    'PASS new_page: new native tab, existing pages and selection preserved',
  );

  const snapshot = await call('take_snapshot', {pageId});
  assert.match(JSON.stringify(snapshot), /Arc compatibility smoke/);
  const evaluated = await call('evaluate_script', {
    pageId,
    function: '() => document.title',
  });
  assert.match(JSON.stringify(evaluated), /Arc compatibility smoke/);
  const consoleMessages = await call('list_console_messages', {pageId});
  assert.match(JSON.stringify(consoleMessages), /arc-console-ok/);
  const network = await call('list_network_requests', {pageId});
  assert.match(JSON.stringify(network), new RegExp(`${token}/ping`));
  const screenshotPath = path.join(directory, 'arc-smoke.png');
  await call('take_screenshot', {pageId, filePath: screenshotPath});
  assert.ok((await fs.stat(screenshotPath)).size > 0);
  console.log(
    `PASS snapshot, script, console, network, screenshot: ${screenshotPath}`,
  );

  await call('close_page', {pageId});
  const closedPageId = pageId;
  pageId = undefined;
  const after = pages(await call('list_pages'));
  assert.ok(!after.some(page => page.id === closedPageId));
  console.log('PASS close_page: smoke tab removed; browser stays connected');
} finally {
  try {
    if (pageId !== undefined) {
      await call('close_page', {pageId});
    }
  } finally {
    await client.close();
    fixture.closeAllConnections();
    await new Promise(resolve => fixture.close(resolve));
  }
}
