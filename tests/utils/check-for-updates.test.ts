/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import child_process from 'node:child_process';
import {Stats} from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, it} from 'node:test';

import sinon from 'sinon';

import {
  checkForUpdates,
  resetUpdateCheckFlagForTesting,
} from '../../src/utils/check-for-updates.js';
import {PACKAGE_NAME, VERSION} from '../../src/version.js';

describe('checkForUpdates', () => {
  let writeFileStub: sinon.SinonStub;

  beforeEach(() => {
    sinon.stub(fs, 'mkdir').resolves();
    sinon.stub(fs, 'utimes').resolves();
    writeFileStub = sinon.stub(fs, 'writeFile').resolves();
  });

  afterEach(() => {
    resetUpdateCheckFlagForTesting();
  });

  it('does nothing if CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS is set', async () => {
    process.env['CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS'] = 'true';

    const warnStub = sinon.stub(console, 'warn');
    const spawnStub = sinon.stub(child_process, 'spawn');
    const readFileStub = sinon.stub(fs, 'readFile');
    const statStub = sinon.stub(fs, 'stat');

    await checkForUpdates('Run `npm update` to update.');

    sinon.assert.notCalled(warnStub);
    sinon.assert.notCalled(spawnStub);
    sinon.assert.notCalled(readFileStub);
    sinon.assert.notCalled(statStub);

    delete process.env['CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS'];
  });

  it('notifies if cache exists and version is different', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    sinon.stub(fs, 'stat').resolves({mtimeMs: Date.now()} as unknown as Stats);
    sinon.stub(fs, 'readFile').callsFake(async filePath => {
      if (filePath.toString().includes('latest.json')) {
        return JSON.stringify({
          version: '99.9.9',
        });
      }
      throw new Error(`File not found: ${filePath}`);
    });
    const warnStub = sinon.stub(console, 'warn');
    const spawnStub = sinon.stub(child_process, 'spawn');

    await checkForUpdates(
      `Run \`npm install ${PACKAGE_NAME}@latest\` to update.`,
    );

    sinon.assert.calledOnceWithExactly(
      warnStub,
      `\nUpdate available: ${VERSION} -> 99.9.9\nRun \`npm install @chenpx976/chrome-devtools-mcp@latest\` to update.\n`,
    );
    sinon.assert.notCalled(spawnStub);
  });

  it('does not notify if incoming version is older than current version', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    sinon.stub(fs, 'stat').resolves({mtimeMs: Date.now()} as unknown as Stats);
    sinon.stub(fs, 'readFile').callsFake(async filePath => {
      if (filePath.toString().includes('latest.json')) {
        return JSON.stringify({
          version: '0.0.1',
        });
      }
      throw new Error(`File not found: ${filePath}`);
    });
    const warnStub = sinon.stub(console, 'warn');
    const spawnStub = sinon.stub(child_process, 'spawn');

    await checkForUpdates('Run `npm update` to update.');

    sinon.assert.notCalled(warnStub);
    sinon.assert.notCalled(spawnStub);
  });

  it('does not spawn fetch process if cache is fresh', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    sinon.stub(fs, 'stat').resolves({mtimeMs: Date.now()} as unknown as Stats);
    sinon.stub(fs, 'readFile').callsFake(async filePath => {
      if (filePath.toString().includes('latest.json')) {
        return JSON.stringify({
          version: VERSION,
        });
      }
      throw new Error(`File not found: ${filePath}`);
    });
    const spawnStub = sinon.stub(child_process, 'spawn');

    await checkForUpdates('Run `npm update` to update.');

    sinon.assert.notCalled(spawnStub);
  });

  it('spawns detached process if cache is stale', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    sinon.stub(fs, 'stat').resolves({
      mtimeMs: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    } as unknown as Stats);
    sinon.stub(fs, 'readFile').callsFake(async filePath => {
      if (filePath.toString().includes('latest.json')) {
        return JSON.stringify({
          version: VERSION,
        });
      }
      throw new Error(`File not found: ${filePath}`);
    });

    const unrefSpy = sinon.spy();
    const spawnStub = sinon.stub(child_process, 'spawn').returns({
      unref: unrefSpy,
    } as unknown as child_process.ChildProcess);

    await checkForUpdates('Run `npm update` to update.');

    sinon.assert.calledOnce(spawnStub);
    assert.strictEqual(spawnStub.firstCall.args[0], process.execPath);
    assert.ok(
      spawnStub.firstCall.args[1][0]?.includes('check-latest-version.js'),
    );
    assert.ok(spawnStub.firstCall.args[1][1]?.includes('latest.json'));
    assert.strictEqual(spawnStub.firstCall.args[2]?.detached, true);
    assert.strictEqual(spawnStub.firstCall.args[2]?.windowsHide, true);
    sinon.assert.calledOnce(unrefSpy);
  });

  it('ignores a cached version that is not valid semver and refreshes it', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    sinon.stub(fs, 'stat').resolves({
      mtimeMs: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
    } as unknown as Stats);
    sinon.stub(fs, 'readFile').callsFake(async filePath => {
      if (filePath.toString().includes('latest.json')) {
        return JSON.stringify({
          version: 'not-a-version',
        });
      }
      throw new Error(`File not found: ${filePath}`);
    });
    const warnStub = sinon.stub(console, 'warn');
    const unrefSpy = sinon.spy();
    const spawnStub = sinon.stub(child_process, 'spawn').returns({
      unref: unrefSpy,
    } as unknown as child_process.ChildProcess);

    await checkForUpdates('Run `npm update` to update.');

    sinon.assert.notCalled(warnStub);
    sinon.assert.calledOnce(spawnStub);
    sinon.assert.calledOnce(unrefSpy);
  });

  it('spawns detached process if cache is missing', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    sinon.stub(fs, 'stat').rejects(new Error('File not found'));
    sinon.stub(fs, 'readFile').callsFake(async filePath => {
      throw new Error(`File not found: ${filePath}`);
    });

    const unrefSpy = sinon.spy();
    const spawnStub = sinon.stub(child_process, 'spawn').returns({
      unref: unrefSpy,
    } as unknown as child_process.ChildProcess);

    await checkForUpdates('Run `npm update` to update.');

    sinon.assert.calledOnce(spawnStub);
    assert.strictEqual(spawnStub.firstCall.args[0], process.execPath);
    assert.ok(
      spawnStub.firstCall.args[1][0]?.includes('check-latest-version.js'),
    );
    assert.ok(spawnStub.firstCall.args[1][1]?.includes('latest.json'));
    assert.strictEqual(spawnStub.firstCall.args[2]?.detached, true);
    assert.strictEqual(spawnStub.firstCall.args[2]?.windowsHide, true);
    sinon.assert.calledOnce(unrefSpy);
  });

  it('ignores the official package cache and initializes a separate fork cache', async () => {
    sinon.stub(os, 'homedir').returns('/home/user');
    const officialCachePath = path.join(
      '/home/user',
      '.cache',
      'chrome-devtools-mcp',
      'latest.json',
    );
    const forkCachePath = path.join(
      '/home/user',
      '.cache',
      '@chenpx976',
      'chrome-devtools-mcp',
      'latest.json',
    );
    const statStub = sinon
      .stub(fs, 'stat')
      .rejects(new Error('File not found'));
    const officialStats = sinon.createStubInstance(Stats);
    officialStats.mtimeMs = Date.now();
    statStub.withArgs(officialCachePath).resolves(officialStats);
    const readFileStub = sinon.stub(fs, 'readFile');
    readFileStub
      .withArgs(officialCachePath, 'utf8')
      .resolves(JSON.stringify({version: '99.9.9'}));
    const warnStub = sinon.stub(console, 'warn');
    const child = sinon.createStubInstance(child_process.ChildProcess);
    const spawnStub = sinon.stub(child_process, 'spawn').returns(child);

    await checkForUpdates(
      `Run \`npm install ${PACKAGE_NAME}@latest\` to update.`,
    );

    sinon.assert.calledOnceWithExactly(statStub, forkCachePath);
    sinon.assert.notCalled(readFileStub);
    sinon.assert.notCalled(warnStub);
    sinon.assert.calledOnceWithExactly(
      writeFileStub,
      forkCachePath,
      JSON.stringify({version: VERSION}),
    );
    sinon.assert.calledOnceWithExactly(
      spawnStub,
      process.execPath,
      [
        path.join(
          import.meta.dirname,
          '..',
          '..',
          'src',
          'bin',
          'check-latest-version.js',
        ),
        forkCachePath,
      ],
      {detached: true, stdio: 'ignore', windowsHide: true},
    );
    sinon.assert.calledOnceWithExactly(child.unref);
  });
});

describe('check-latest-version', () => {
  // Module-loading tests must stub dependencies before importing the executable.
  for (const registry of [undefined, 'https://registry.example.com/npm/']) {
    it(`fetches the scoped package from ${registry ?? 'the default registry'}`, async () => {
      const cachePath = path.join('/cache', 'scoped-latest.json');
      sinon
        .stub(process, 'argv')
        .value(['node', 'check-latest-version', cachePath]);
      const registryStub = sinon.stub(child_process, 'execSync');
      if (registry) {
        registryStub.returns(`${registry}\n`);
      } else {
        registryStub.throws(new Error('npm not on PATH'));
      }
      const fetchStub = sinon
        .stub(globalThis, 'fetch')
        .resolves(new Response(JSON.stringify({version: '99.9.9'})));
      sinon.stub(fs, 'mkdir').resolves();
      const writeFileStub = sinon.stub(fs, 'writeFile').resolves();

      await import(
        new URL(
          `../../src/bin/check-latest-version.js?registry=${registry ? 'custom' : 'default'}`,
          import.meta.url,
        ).href
      );

      sinon.assert.calledOnceWithExactly(
        fetchStub,
        `${registry ? 'https://registry.example.com/npm' : 'https://registry.npmjs.org'}/%40chenpx976%2Fchrome-devtools-mcp/latest`,
      );
      sinon.assert.calledOnceWithExactly(
        writeFileStub,
        cachePath,
        JSON.stringify({version: '99.9.9'}),
      );
    });
  }

  it('leaves the fork cache unchanged when the scoped package is unpublished', async () => {
    sinon
      .stub(process, 'argv')
      .value(['node', 'check-latest-version', '/cache/latest.json']);
    sinon.stub(child_process, 'execSync').returns('https://registry.npmjs.org');
    const fetchStub = sinon
      .stub(globalThis, 'fetch')
      .resolves(new Response(null, {status: 404}));
    const writeFileStub = sinon.stub(fs, 'writeFile').resolves();

    await import(
      new URL(
        '../../src/bin/check-latest-version.js?registry=unpublished',
        import.meta.url,
      ).href
    );

    sinon.assert.calledOnceWithExactly(
      fetchStub,
      'https://registry.npmjs.org/%40chenpx976%2Fchrome-devtools-mcp/latest',
    );
    sinon.assert.notCalled(writeFileStub);
  });
});
