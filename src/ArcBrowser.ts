/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import childProcess from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import http from 'node:http';

import type {Browser, Page} from './third_party/browser.js';
import {logger} from './utils/logger.js';

const TIMEOUT = 10_000;
const CREATE_TAB = `on run argv
  set markerURL to item 1 of argv
  set windowId to ""
  tell application id "company.thebrowser.Browser"
    if not running then error "Arc must already be running."
    if (count of windows) is 0 then error "Open an Arc window first."
    if incognito of front window then error "Select a regular Arc window first."
    tell front window
      set windowId to id
      set previousTabId to id of active tab
      make new tab with properties {URL:markerURL}
    end tell
  end tell
  return windowId & linefeed & previousTabId
end run`;

const RESTORE_TAB = `on run argv
  tell application id "company.thebrowser.Browser"
    repeat with windowIndex from 1 to count of windows
      if id of window windowIndex is item 1 of argv then
        tell window windowIndex
          repeat with tabIndex from 1 to count of tabs
            if id of tab tabIndex is item 2 of argv then
              tell tab tabIndex to select
              return
            end if
          end repeat
        end tell
      end if
    end repeat
    error "The previously selected Arc tab is no longer available."
  end tell
end run`;

async function runAppleScript(script: string, args: string[]): Promise<string> {
  const {promise, resolve, reject} = Promise.withResolvers<string>();
  childProcess.execFile(
    '/usr/bin/osascript',
    ['-e', script, ...args],
    {timeout: TIMEOUT, maxBuffer: 4096, encoding: 'utf8'},
    (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    },
  );
  return await promise;
}

/** Creates an Arc tab without sending the crash-prone Target.createTarget. */
export async function createArcPage(
  browser: Browser,
  options: {background?: boolean; isolatedContextName?: string} = {},
): Promise<Page> {
  if (process.platform !== 'darwin') {
    throw new Error('Arc native tab creation requires macOS.');
  }
  if (options.isolatedContextName !== undefined) {
    throw new Error(
      'Arc does not support new_page isolatedContext; use a regular Arc tab.',
    );
  }
  if (!browser.connected) {
    throw new Error('Arc disconnected before creating a tab.');
  }

  const markerPath = `/chrome-devtools-mcp-${randomUUID()}`;
  const markerServer = http.createServer((request, response) => {
    response.writeHead(request.url === markerPath ? 200 : 404, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end('<!doctype html><title></title>');
  });
  try {
    const listening = once(markerServer, 'listening');
    markerServer.listen(0, '127.0.0.1');
    await listening;
    const address = markerServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Could not bind the Arc marker server to loopback.');
    }
    const marker = `http://127.0.0.1:${address.port}${markerPath}`;
    let previousSelection: string;
    try {
      previousSelection = (await runAppleScript(CREATE_TAB, [marker])).trim();
      logger?.('Arc native tab created');
    } catch (cause) {
      throw new Error(
        `Arc could not create a tab within ${TIMEOUT}ms. ` +
          'Keep a regular Arc window open and allow your MCP host to automate ' +
          'Arc in macOS System Settings > Privacy & Security > Automation. ' +
          `A tab at ${marker} may remain if the command partially completed.`,
        {cause},
      );
    }

    try {
      const target = await browser.waitForTarget(
        target => target.type() === 'page' && target.url() === marker,
        {timeout: TIMEOUT},
      );
      logger?.('Arc native target discovered');
      const page = await target.page();
      logger?.('Arc native page attached');
      if (!page) {
        throw new Error('The new Arc target has no page.');
      }
      if (options.background) {
        const [windowId, tabId] = previousSelection.split('\n');
        if (!windowId || !tabId) {
          throw new Error(
            'Arc did not return the previous window and tab IDs.',
          );
        }
        await runAppleScript(RESTORE_TAB, [windowId, tabId]);
        logger?.('Arc previous selection restored');
      }
      return page;
    } catch (cause) {
      throw new Error(
        `Arc created ${marker}, but page attachment or selection restoration failed. ` +
          'Check that the endpoint belongs to this Arc instance and profile. ' +
          'The new blank tab was left open; no existing tab was reused.',
        {cause},
      );
    }
  } finally {
    if (markerServer.listening) {
      const closed = once(markerServer, 'close');
      markerServer.close();
      markerServer.closeAllConnections();
      await closed;
    }
  }
}
