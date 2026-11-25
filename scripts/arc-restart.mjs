/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';
import {promisify} from 'node:util';

assert.equal(process.platform, 'darwin', 'Arc restart requires macOS');
const execute = promisify(execFile);
const options = {timeout: 15_000, encoding: 'utf8'};
await execute(
  '/usr/bin/osascript',
  ['-e', 'tell application id "company.thebrowser.Browser" to quit'],
  options,
);
const deadline = Date.now() + 15_000;
while (true) {
  const {stdout} = await execute(
    '/usr/bin/osascript',
    ['-e', 'application id "company.thebrowser.Browser" is running'],
    options,
  );
  if (stdout.trim() === 'false') {
    break;
  }
  if (Date.now() >= deadline) {
    throw new Error('Arc did not quit within 15000ms; it was not force-quit.');
  }
  await setTimeout(250);
}
await execute(
  '/usr/bin/open',
  [
    '-a',
    'Arc',
    '--args',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=9222',
  ],
  options,
);
console.log('Arc restarted with loopback remote debugging on port 9222.');
