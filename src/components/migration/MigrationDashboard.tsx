import type React from 'react'
import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'
import { cn } from '../../lib/utils'
import {
	getAddressRep,
	getMigrationSnapshot,
	MIGRATION_ADDRESSES,
	type AddressRep,
	type MigrationSnapshot,
} from './migrationReads'

// Official migration tool (as linked from the augur.net mission page).
const MIGRATION_TOOL_URL = 'https://6.augurfork.eth.limo/'

const EXCHANGES: { name: string; status: string; action: string }[] = [
	{ name: 'Kraken', status: 'UNKNOWN', action: 'Ask your exchange; if unsure, withdraw and migrate yourself' },
	{ name: 'Gate', status: 'UNKNOWN', action: 'Ask your exchange; if unsure, withdraw and migrate yourself' },
	{ name: 'Upbit', status: 'UNKNOWN', action: 'Ask your exchange; if unsure, withdraw and migrate yourself' },
	{ name: 'Coinbase', status: 'UNKNOWN', action: 'Ask your exchange; if unsure, withdraw and migrate yourself' },
	{ name: 'OKX', status: 'UNKNOWN', action: 'Ask your exchange; if unsure, withdraw and migrate yourself' },
	{ name: 'Bitpanda', status: 'UNKNOWN', action: 'Ask your exchange; if unsure, withdraw and migrate yourself' },
]

const CONTRACT_LINKS = [
	{ label: 'New universe REP', addr: MIGRATION_ADDRESSES.newUniverseRepToken },
	{ label: 'REPv2', addr: MIGRATION_ADDRESSES.repV2 },
	{ label: 'REPv1', addr: MIGRATION_ADDRESSES.repV1 },
]

const HOW_TO = [
	{ step: 'Open the tool', text: 'Open the migration tool and connect the wallet that holds your REP.' },
	{ step: 'Pick a universe', text: 'Choose the outcome you believe correctly resolves the forking market.' },
	{ step: 'Confirm', text: 'Confirm the transaction to migrate your REP — before the deadline.' },
]

// ---- small formatters ------------------------------------------------------
const compact = (n: number): string => {
	if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
	if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
	if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
	return n.toFixed(2)
}
const fmtNum = (n: number, d = 4): string => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const deadlineUTC = (d: Date): string => `${d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} UTC`
const deadlineLocal = (d: Date): string => d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

function useNow(intervalMs = 1000): number {
	const [now, setNow] = useState(() => Date.now())
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), intervalMs)
		return () => clearInterval(id)
	}, [intervalMs])
	return now
}

const card = 'border border-primary/30 bg-background'

// ---- main island -----------------------------------------------------------
export default function MigrationDashboard(): React.JSX.Element {
	const [data, setData] = useState<MigrationSnapshot | undefined>()
	const [error, setError] = useState<string>()

	useEffect(() => {
		getMigrationSnapshot().then(setData).catch((e) => setError(e instanceof Error ? e.message : String(e)))
	}, [])

	if (error && !data) {
		return (
			<div className={cn(card, 'mx-auto max-w-xl p-8 text-center')}>
				<p className="font-display text-xl text-red-500">COULDN’T REACH THE NETWORK</p>
				<p className="mt-2 text-muted-foreground">Public RPC endpoints were unreachable. Try again in a moment.</p>
			</div>
		)
	}
	if (!data) {
		return <p className="py-12 text-center text-muted-foreground">Reading on-chain state…</p>
	}
	if (!data.isForking) {
		return (
			<div className="mx-auto max-w-2xl py-12 text-center">
				<p className="text-xs uppercase tracking-widest text-muted-foreground">No active fork</p>
				<h1 className="mt-3 font-display text-3xl text-loud-foreground">Nothing to migrate right now</h1>
				<p className="mt-3 text-muted-foreground">The Augur Genesis universe is healthy. This page lights up when a fork opens a migration window.</p>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-3xl">
			<Hero data={data} />
			<Progress data={data} />
			<HowToMigrate />
			<VerifyContracts />
			<Exchanges />
			<RepChecker forkEndTime={data.forkEndTime} />
		</div>
	)
}

function Hero({ data }: { data: MigrationSnapshot }): React.JSX.Element {
	const now = useNow()
	const [confirmOpen, setConfirmOpen] = useState(false)
	const deadline = data.forkEndTime ? new Date(data.forkEndTime * 1000) : undefined
	const left = deadline ? Math.max(0, Math.floor((deadline.getTime() - now) / 1000)) : 0
	const days = Math.floor(left / 86400)
	const hrs = Math.floor((left % 86400) / 3600)
	const mins = Math.floor((left % 3600) / 60)

	return (
		<section className="py-10 text-center">
			<p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-red-500">
				<span className="inline-block h-2 w-2 rounded-full bg-primary" /> Fork active · Migration open
			</p>
			<h1 className="mt-3 font-display text-3xl text-loud-foreground sm:text-4xl">Migrate your REP before the window closes</h1>
			<p className="mx-auto mt-4 max-w-xl text-foreground">
				The Moon Fork is live. To keep your REP you must migrate it to the universe you believe is the correct
				outcome before the deadline. <span className="text-yellow-400">REP that isn’t migrated is expected to become worthless.</span>
			</p>

			<div className="mt-8 flex items-baseline justify-center gap-3">
				<span className="font-display text-7xl leading-none text-primary fx-glow-sm">{days}</span>
				<span className="font-display text-2xl uppercase tracking-wider text-foreground">{days === 1 ? 'day' : 'days'}</span>
				<span className="text-muted-foreground">{hrs}h {mins}m left</span>
			</div>
			{deadline && (
				<p className="mt-2 text-sm text-muted-foreground">
					Closes <span className="text-loud-foreground">{deadlineUTC(deadline)}</span> · {deadlineLocal(deadline)} your time
				</p>
			)}

			<div className="mt-8">
				<Button size="lg" onClick={() => setConfirmOpen(true)}>Migrate your REP →</Button>
			</div>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-yellow-400">⚠ You’re leaving for the migration tool</DialogTitle>
						<DialogDescription>
							Scammers run fake copies of the migration tool. Check the address below is exactly what you expect,
							and never enter your seed phrase anywhere.
						</DialogDescription>
					</DialogHeader>
					<div className="break-all border border-primary/30 bg-background p-3 font-prose text-sm text-loud-foreground">{MIGRATION_TOOL_URL}</div>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
						<Button onClick={() => { setConfirmOpen(false); window.open(MIGRATION_TOOL_URL, '_blank', 'noopener,noreferrer') }}>Continue →</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	)
}

function Progress({ data }: { data: MigrationSnapshot }): React.JSX.Element {
	const pct = data.totalRep > 0 ? Math.min(100, (data.migratedRep / data.totalRep) * 100) : 0
	return (
		<section className="mx-auto mb-12 max-w-2xl">
			<div className="mb-1 flex items-baseline justify-between text-xs uppercase tracking-wider text-muted-foreground">
				<span>REP migrated</span>
				<span className="text-lg text-primary">{pct.toFixed(1)}%</span>
			</div>
			<div className="h-2.5 overflow-hidden border border-primary/40 bg-background">
				<div className="h-full bg-primary" style={{ width: `${pct}%` }} />
			</div>
			<div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
				<span>{compact(data.migratedRep)} migrated</span>
				<span>{compact(data.totalRep)} total</span>
			</div>
		</section>
	)
}

function SectionTitle({ children }: { children: React.ReactNode }): React.JSX.Element {
	return <h2 className="mb-3 mt-8 font-display text-sm uppercase tracking-wider text-loud-foreground">— {children}</h2>
}

function HowToMigrate(): React.JSX.Element {
	return (
		<section>
			<SectionTitle>How to migrate</SectionTitle>
			<div className="grid gap-3 sm:grid-cols-3">
				{HOW_TO.map((s, i) => (
					<div key={s.step} className={cn(card, 'flex items-start gap-3 p-4')}>
						<span className="flex h-7 w-7 shrink-0 items-center justify-center border border-primary text-primary">{i + 1}</span>
						<div>
							<div className="text-sm uppercase tracking-wide text-loud-foreground">{s.step}</div>
							<p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
						</div>
					</div>
				))}
			</div>
			<div className="mt-4 flex items-start gap-3 border border-yellow-400 border-l-4 bg-yellow-400/10 p-4 text-sm">
				<span className="shrink-0 text-xl text-yellow-400">⚠</span>
				<div>
					<span className="text-yellow-400">Scams are already circulating.</span> Fake migration sites, impersonators,
					and DMs are out there. Only use the official tool linked on this page, never share your seed phrase, and
					ignore anyone who messages you first — the team won’t DM you.
				</div>
			</div>
		</section>
	)
}

function VerifyContracts(): React.JSX.Element {
	return (
		<section>
			<SectionTitle>Verify token contracts</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">Confirm you’re interacting with the real tokens — open each on Etherscan.</p>
			<div className="grid gap-3 sm:grid-cols-3">
				{CONTRACT_LINKS.map((c) => (
					<a
						key={c.addr}
						href={`https://etherscan.io/token/${c.addr}#balances`}
						target="_blank"
						rel="noopener noreferrer"
						className={cn(card, 'p-3 text-center text-sm uppercase tracking-wide text-foreground hover:border-primary hover:text-loud-foreground')}
					>
						{c.label} ↗
					</a>
				))}
			</div>
		</section>
	)
}

function Exchanges(): React.JSX.Element {
	return (
		<section>
			<SectionTitle>Exchange support</SectionTitle>
			<p className="mb-3 text-sm text-muted-foreground">Don’t assume your exchange will migrate for you — confirm directly. Statuses are maintained by hand.</p>
			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr className="border-b border-primary/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
							<th className="py-2 pr-4">Exchange</th>
							<th className="py-2 pr-4">Status</th>
							<th className="py-2">What to do</th>
						</tr>
					</thead>
					<tbody>
						{EXCHANGES.map((x) => (
							<tr key={x.name} className="border-b border-primary/15">
								<td className="py-2 pr-4 text-foreground">{x.name}</td>
								<td className="py-2 pr-4"><span className="border border-muted-foreground/50 px-2 py-0.5 text-xs uppercase text-muted-foreground">{x.status}</span></td>
								<td className="py-2 text-muted-foreground">{x.action}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	)
}

// ---- live address checker --------------------------------------------------
function RepChecker({ forkEndTime }: { forkEndTime: number | undefined }): React.JSX.Element {
	const [input, setInput] = useState('')
	const [checking, setChecking] = useState(false)
	const [err, setErr] = useState<string>()
	const [rep, setRep] = useState<AddressRep | undefined>()

	const check = async (): Promise<void> => {
		const a = input.trim().toLowerCase()
		if (!/^0x[0-9a-f]{40}$/.test(a)) { setErr('Enter a valid 0x… address (40 hex chars).'); setRep(undefined); return }
		setErr(undefined); setChecking(true)
		try { setRep(await getAddressRep(a)) }
		catch (e) { setErr(e instanceof Error ? e.message : String(e)); setRep(undefined) }
		finally { setChecking(false) }
	}

	return (
		<section>
			<SectionTitle>Check your address</SectionTitle>
			<div className="flex flex-col gap-2 sm:flex-row">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => { if (e.key === 'Enter') check() }}
					placeholder="0x… wallet address"
					className="flex-1 border border-primary/40 bg-background px-3 py-2 font-prose text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
				/>
				<Button onClick={check} disabled={checking}>{checking ? 'Checking…' : 'Check'}</Button>
			</div>
			<p className="mt-2 text-xs text-muted-foreground">
				Some wallets don’t display legacy REPv1, so you may be holding it without realising. This reads the token
				contracts directly — public, read-only, nothing is signed.
			</p>

			{err && <p className="mt-3 text-sm text-red-500">{err}</p>}
			{rep && <RepVerdict rep={rep} forkEndTime={forkEndTime} />}
		</section>
	)
}

function RepVerdict({ rep, forkEndTime }: { rep: AddressRep; forkEndTime: number | undefined }): React.JSX.Element {
	const deadline = forkEndTime ? new Date(forkEndTime * 1000) : undefined
	let title: string
	let body: React.ReactNode
	let tone = 'text-foreground'
	if (rep.repV1 > 0) {
		tone = 'text-yellow-400'
		title = 'ACTION NEEDED — you hold legacy REPv1'
		body = (
			<ol className="mt-2 list-decimal space-y-1 pl-5 text-foreground">
				<li>Migrate REPv1 → REPv2 (Rep V1 Migration).</li>
				<li>Migrate that REPv2 into the universe you believe is the correct outcome — before the deadline.</li>
			</ol>
		)
	} else if (rep.repV2 > 0) {
		tone = 'text-yellow-400'
		title = 'ACTION NEEDED — migrate your REPv2'
		body = <p className="mt-2 text-foreground">This address holds REPv2 in the Genesis universe. Migrate it into the universe you believe is the correct outcome before the window closes.</p>
	} else if (rep.newUniverse > 0) {
		tone = 'text-primary'
		title = '✓ Already migrated'
		body = <p className="mt-2 text-foreground">This address holds REP in the new universe and nothing in REPv1 or the Genesis universe. Nothing more to migrate.</p>
	} else {
		title = 'No REP found at this address'
		body = <p className="mt-2 text-muted-foreground">No REPv1, no Genesis-universe REPv2, and nothing in the new universe were found.</p>
	}
	return (
		<div className={cn(card, 'mt-4 p-4')}>
			<div className={cn('font-display uppercase tracking-wide', tone)}>{title}</div>
			{body}
			{deadline && rep.repV1 + rep.repV2 > 0 && (
				<p className="mt-2 text-sm text-muted-foreground">Window closes {deadlineUTC(deadline)}.</p>
			)}
			<div className="mt-3 grid gap-3 sm:grid-cols-3">
				<Balance label="REPv1 (legacy)" value={rep.repV1} unit="REPv1" />
				<Balance label="REPv2 (Genesis)" value={rep.repV2} unit="REPv2" />
				<Balance label="New universe" value={rep.newUniverse} unit="REP" />
			</div>
		</div>
	)
}

function Balance({ label, value, unit }: { label: string; value: number; unit: string }): React.JSX.Element {
	return (
		<div className="border border-primary/20 bg-background p-3">
			<div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
			<div className="mt-1 text-loud-foreground">{fmtNum(value)} <span className="text-xs text-muted-foreground">{unit}</span></div>
		</div>
	)
}
