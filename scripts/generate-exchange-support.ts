#!/usr/bin/env node

/**
 * Exchange Migration Support List
 *
 * Source of truth for CEX exchange migration support status.
 * Edit the EXCHANGES array below to add or update exchanges.
 *
 * Dual purpose:
 *   - Named exports for build-time imports (MDX content files)
 *   - CLI mode: writes public/data/exchange-support.json for public serving
 *
 * Run: npm run build:exchange-data
 * Import: import { exchanges } from 'scripts/generate-exchange-support'
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __root = path.resolve(__dirname, '..')

// ──────────────────────────────────────────────
// DATA — single source of truth
// Status values: pending | confirmed | supporting | completed | declined
// Edit this array. That's it.
// Later: can be replaced with dynamic API calls.
// ──────────────────────────────────────────────

export type ExchangeStatus = 'pending' | 'confirmed' | 'supporting' | 'completed' | 'declined'

export interface Exchange {
	name: string
	url: string
	status: ExchangeStatus
	notes: string | null
}

const EXCHANGES: Exchange[] = [
	{
		name: 'Kraken',
		url: 'https://kraken.com',
		status: 'pending',
		notes: 'In discussions; support not yet confirmed',
	},
	{
		name: 'Gate.io',
		url: 'https://gate.com',
		status: 'pending',
		notes: 'In discussions; support not yet confirmed',
	},
	{
		name: 'Upbit',
		url: 'https://upbit.com',
		status: 'pending',
		notes: 'In discussions; support not yet confirmed',
	},
	{
		name: 'Coinbase',
		url: 'https://coinbase.com',
		status: 'pending',
		notes: 'In discussions; support not yet confirmed',
	},
	{
		name: 'OKX',
		url: 'https://okx.com',
		status: 'pending',
		notes: 'In discussions; support not yet confirmed',
	},
	{
		name: 'Bitpanda',
		url: 'https://bitpanda.com',
		status: 'pending',
		notes: 'In discussions; support not yet confirmed',
	},
]

const DESCRIPTION =
	'Exchange migration support status for the Augur Moon Fork. REP holders should withdraw to their own wallet and migrate if their exchange is not listed as supporting.'
const SCHEMA_VERSION = '1.0.0'

export { EXCHANGES as exchanges, DESCRIPTION as description, SCHEMA_VERSION as schemaVersion }

// ──────────────────────────────────────────────
// CLI — writes public/data/exchange-support.json
// ──────────────────────────────────────────────

if (process.argv[1]?.endsWith('generate-exchange-support.ts')) {
	const outputDir = path.resolve(__root, 'public', 'data')
	const outputFile = path.resolve(outputDir, 'exchange-support.json')

	mkdirSync(outputDir, { recursive: true })

	const data = {
		generatedAt: new Date().toISOString(),
		description: DESCRIPTION,
		exchanges: EXCHANGES,
		schemaVersion: SCHEMA_VERSION,
	}

	writeFileSync(outputFile, `${JSON.stringify(data, null, 2)}\n`)
}
