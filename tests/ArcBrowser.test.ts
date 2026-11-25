/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';
import {describe, it} from 'node:test';

import sinon from 'sinon';

import {createArcPage} from '../src/ArcBrowser.js';
import {TargetType} from '../src/third_party/browser.js';

import {
  createMockPuppeteerBrowser,
  createMockPuppeteerPage,
  createMockPuppeteerTarget,
} from './mocks.js';

function mockNativeCommand() {
  sinon.stub(process, 'platform').value('darwin');
  return sinon
    .stub(childProcess, 'execFile')
    .yields(null, 'window-id\ntab-id\n', '');
}

describe('Arc native tabs', () => {
  for (const background of [false, true]) {
    it(`returns only the newly created target (background=${background})`, async () => {
      const execute = mockNativeCommand();
      const browser = createMockPuppeteerBrowser();
      const pptrPage = createMockPuppeteerPage();
      const target = createMockPuppeteerTarget({page: pptrPage});
      const existing = createMockPuppeteerTarget({url: 'about:blank'});
      browser.waitForTarget.callsFake(async (predicate, options) => {
        assert.deepEqual(options, {timeout: 10_000});
        const args = execute.firstCall.args[1];
        assert.ok(Array.isArray(args));
        const marker: string = args[2];
        assert.match(
          marker,
          /^http:\/\/127\.0\.0\.1:\d+\/chrome-devtools-mcp-/,
        );
        assert.equal(new URL(marker).hostname, '127.0.0.1');
        const response = await fetch(marker);
        assert.equal(response.status, 200);
        assert.equal(await predicate(existing), false);
        target.url.returns(marker);
        target.type.returns(TargetType.SERVICE_WORKER);
        assert.equal(await predicate(target), false);
        target.type.returns(TargetType.PAGE);
        assert.equal(await predicate(target), true);
        return target;
      });

      assert.equal(await createArcPage(browser, {background}), pptrPage);
      sinon.assert.callCount(execute, background ? 2 : 1);
      sinon.assert.calledWithExactly(
        execute.firstCall,
        '/usr/bin/osascript',
        execute.firstCall.args[1],
        {timeout: 10_000, maxBuffer: 4096, encoding: 'utf8'},
        sinon.match.func,
      );
      const finalArgs = execute.lastCall.args[1];
      assert.ok(Array.isArray(finalArgs));
      assert.deepEqual(
        finalArgs.slice(2),
        background
          ? ['window-id', 'tab-id']
          : execute.firstCall.args[1]?.slice(2),
      );
      sinon.assert.calledOnceWithExactly(target.page);
      sinon.assert.notCalled(browser.newPage);
      sinon.assert.notCalled(existing.page);
    });
  }

  it(
    'closes incomplete marker connections before returning',
    {timeout: 5000},
    async t => {
      const execute = mockNativeCommand();
      const browser = createMockPuppeteerBrowser();
      const pptrPage = createMockPuppeteerPage();
      const target = createMockPuppeteerTarget({page: pptrPage});
      const socket = new net.Socket();
      t.after(() => socket.destroy());
      const closed = once(socket, 'close').catch(
        (error: NodeJS.ErrnoException) => {
          assert.equal(error.code, 'ECONNRESET');
        },
      );
      browser.waitForTarget.callsFake(async () => {
        const args = execute.firstCall.args[1];
        assert.ok(Array.isArray(args));
        const marker = new URL(args[2]);
        socket.connect(Number(marker.port), marker.hostname);
        await once(socket, 'connect', {signal: t.signal});
        socket.write('GET / HTTP/1.1\r\n');
        return target;
      });
      assert.equal(await createArcPage(browser), pptrPage);
      await closed;
    },
  );

  it('does not fall back to CDP after Automation permission denial', async () => {
    const execute = mockNativeCommand();
    const denied = new Error('Not authorized to send Apple events (-1743)');
    execute.yields(denied, '', '');
    const browser = createMockPuppeteerBrowser();
    await assert.rejects(createArcPage(browser), error => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /Privacy & Security > Automation/);
      assert.equal(error.cause, denied);
      return true;
    });
    sinon.assert.notCalled(browser.waitForTarget);
    sinon.assert.notCalled(browser.newPage);
  });

  it('reports the orphan marker when the endpoint never exposes the tab', async () => {
    mockNativeCommand();
    const browser = createMockPuppeteerBrowser();
    browser.waitForTarget.rejects(new Error('Timed out'));
    await assert.rejects(
      createArcPage(browser),
      /Arc created http:\/\/127\.0\.0\.1:\d+\/chrome-devtools-mcp-.*left open/,
    );
    sinon.assert.notCalled(browser.newPage);
  });

  it('rejects a target without a page instead of adopting an existing tab', async () => {
    mockNativeCommand();
    const browser = createMockPuppeteerBrowser();
    const target = createMockPuppeteerTarget();
    target.page.resolves(null);
    browser.waitForTarget.resolves(target);
    await assert.rejects(createArcPage(browser), error => {
      assert.ok(error instanceof Error);
      assert.ok(error.cause instanceof Error);
      assert.equal(error.cause.message, 'The new Arc target has no page.');
      return true;
    });
    sinon.assert.notCalled(browser.newPage);
  });

  it('rejects isolatedContext before creating any native tab or context', async () => {
    const execute = mockNativeCommand();
    const browser = createMockPuppeteerBrowser();
    await assert.rejects(
      createArcPage(browser, {isolatedContextName: 'signed-out'}),
      /does not support new_page isolatedContext/,
    );
    sinon.assert.notCalled(execute);
    sinon.assert.notCalled(browser.createBrowserContext);
  });

  it('rejects a disconnected browser before creating a native tab', async () => {
    const execute = mockNativeCommand();
    const browser = createMockPuppeteerBrowser();
    sinon.stub(browser, 'connected').get(() => false);
    await assert.rejects(createArcPage(browser), /disconnected/);
    sinon.assert.notCalled(execute);
  });

  it('rejects unsupported platforms before starting osascript', async () => {
    const execute = sinon.stub(childProcess, 'execFile');
    sinon.stub(process, 'platform').value('linux');
    await assert.rejects(
      createArcPage(createMockPuppeteerBrowser()),
      /requires macOS/,
    );
    sinon.assert.notCalled(execute);
  });
});
