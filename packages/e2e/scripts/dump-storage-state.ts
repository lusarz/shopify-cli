/* eslint-disable no-console */

/**
 * One-off helper: attaches to an already-running, manually-logged-in Chrome
 * instance over CDP and saves its cookies/localStorage as a Playwright
 * storageState file, so the e2e scripts can reuse that session instead of
 * automating login themselves.
 *
 * Usage:
 *   1. Launch Chrome yourself: google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-e2e-profile
 *   2. Log in manually in that window (accounts.shopify.com, admin.shopify.com, dev.shopify.com).
 *   3. Run: pnpm --filter e2e exec tsx scripts/dump-storage-state.ts
 */

import * as path from 'path'
import * as fs from 'fs'
import {fileURLToPath} from 'url'
import {chromium} from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, '../../../.e2e-tmp/global-auth/browser-storage-state.json')

async function main() {
  const browser = await chromium.connectOverCDP('http://localhost:9222')
  const [context] = browser.contexts()
  if (!context) {
    throw new Error('No browser context found — is Chrome running with --remote-debugging-port=9222?')
  }

  fs.mkdirSync(path.dirname(outputPath), {recursive: true})
  await context.storageState({path: outputPath})
  console.log(`Saved storage state to ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
