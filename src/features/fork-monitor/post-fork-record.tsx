import type React from "react";
import { useState } from "react";
import Button from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useForkData } from "./data-provider";
import { getForkRecord } from "./derive-fork-lifecycle";
import type { ForkOutcome, ForkRecordData } from "./types";

const shortenAddress = (address: string | null | undefined): string => {
	if (!address) return "Not available";
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatRep = (value: number): string => Math.round(value).toLocaleString();

const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp * 1000);
	if (Number.isNaN(date.getTime())) return "Not available";
	return date.toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

const formatShortDate = (timestamp: number): string => {
	const date = new Date(timestamp * 1000);
	if (Number.isNaN(date.getTime())) return "date unavailable";
	return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const etherscanAddress = (address: string): string =>
	`https://etherscan.io/address/${address}`;

const FORKWATCH_URL = "https://v3.augur.net/";
const FAQ_URL = "/faq/";

const AddressValue = ({
	address,
	label,
}: {
	address: string | null | undefined;
	label: string;
}) => {
	if (!address) {
		return (
			<div className="flex items-center justify-between gap-4">
				<span className="text-muted-foreground">{label}</span>
				<span>Not available</span>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground">{label}</span>
			<a
				href={etherscanAddress(address)}
				target="_blank"
				rel="noopener noreferrer"
				className="text-primary hover:text-loud-foreground hover:underline focus:underline"
				title={address}
			>
				{shortenAddress(address)}
			</a>
		</div>
	);
};

const OutcomeRow = ({
	outcome,
	isWinner,
}: {
	outcome: ForkOutcome;
	isWinner: boolean;
}) => (
	<div
		className={cn(
			"grid grid-cols-[1fr_auto] gap-3 border-t border-foreground/15 py-3",
			isWinner && "text-primary",
		)}
	>
		<div>
			<div className="uppercase tracking-wider">
				{outcome.label}
				{isWinner && (
					<span className="ml-2 inline-flex items-center bg-primary px-1.5 py-0.5 align-middle text-[9px] leading-none tracking-widest text-background">
						WINNER
					</span>
				)}
			</div>
			{outcome.childUniverse && (
				<a
					href={etherscanAddress(outcome.childUniverse)}
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:underline"
					title={outcome.childUniverse}
				>
					{shortenAddress(outcome.childUniverse)}
				</a>
			)}
		</div>
		<div className="text-right tabular-nums">
			<div>{formatRep(outcome.migratedRep)} REP</div>
			<div className="text-[10px] text-muted-foreground">MIGRATED</div>
		</div>
	</div>
);

const ForkResolutionDialog = ({ record }: { record: ForkRecordData }) => (
	<DialogContent className="max-h-[85vh] overflow-y-auto bg-background border border-foreground/20 backdrop-blur-sm">
		<DialogTitle className="font-display uppercase tracking-widest text-primary">
			Fork resolution
		</DialogTitle>
		<DialogDescription>
			The migration window closed with a verified winning child universe. The
			addresses and migration totals below are the recorded protocol data.
		</DialogDescription>

		<div className="space-y-2 border-y border-foreground/20 py-4 text-sm font-mono">
			<AddressValue label="Parent universe" address={record.parentUniverse} />
			<AddressValue label="Forking market" address={record.forkingMarket} />
			<AddressValue
				label="Canonical universe"
				address={record.winningChildUniverse}
			/>
			<div className="flex items-center justify-between gap-4">
				<span className="text-muted-foreground">Migration closed</span>
				<span>{formatDate(record.migrationDeadline)}</span>
			</div>
			{record.observedBlock && (
				<div className="flex items-center justify-between gap-4">
					<span className="text-muted-foreground">Observed block</span>
					<span>{record.observedBlock.toLocaleString()}</span>
				</div>
			)}
		</div>

		<div>
			<div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
				Recorded outcomes
			</div>
			{record.outcomes.map((outcome) => (
				<OutcomeRow
					key={`${outcome.index}-${outcome.childUniverse ?? "invalid"}`}
					outcome={outcome}
					isWinner={
						outcome.childUniverse?.toLowerCase() ===
						record.winningChildUniverse?.toLowerCase()
					}
				/>
			))}
		</div>

		<div className="space-y-2">
			<Button
				variant="outline"
				href={
					record.winningChildUniverse
						? etherscanAddress(record.winningChildUniverse)
						: "https://etherscan.io/"
				}
				target="_blank"
				rel="noopener noreferrer"
				className="w-full uppercase"
			>
				Verify on Etherscan
			</Button>
			<Button
				variant="outline"
				href={FORKWATCH_URL}
				target="_blank"
				rel="noopener noreferrer"
				className="w-full uppercase"
			>
				Open ForkWatch
			</Button>
			<Button variant="outline" href={FAQ_URL} className="w-full uppercase">
				Read the FAQ
			</Button>
		</div>
	</DialogContent>
);

export const ForkRecord = (): React.JSX.Element | null => {
	const { rawData } = useForkData();
	const record = getForkRecord(rawData);
	const [isOpen, setIsOpen] = useState(false);

	if (!record?.winningChildUniverse) return null;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<div className="mx-auto w-full max-w-xl px-8 text-left font-mono text-sm">
				<DialogTrigger asChild>
					<button
						type="button"
						className="group block w-full cursor-pointer text-left focus:outline-none"
						aria-label="View fork resolution"
					>
						<div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide">
							<span className="text-muted-foreground">fork resolution</span>
							<span className="text-muted-foreground group-hover:text-loud-foreground">
								what's this
								<span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-current leading-none tracking-tight group-hover:fx-glow-sm group-focus:fx-glow-sm">
									?
								</span>
							</span>

						</div>

						<div
							className="bg-muted-foreground/40 p-px transition-colors group-hover:bg-foreground/50 group-focus:bg-foreground/50"
							style={{
								clipPath:
									"polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
							}}
						>
							<div
								className="bg-background py-4 text-center"
								style={{
									clipPath:
										"polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)",
								}}
							>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Canonical universe
								</div>
								<div className="break-all font-display text-xl text-foreground sm:text-xl">
									<span className="sm:hidden">
										{shortenAddress(record.winningChildUniverse)}
									</span>
									<span className="hidden sm:inline">
										{record.winningChildUniverse}
									</span>
								</div>
								<div className="text-muted-foreground text-xs">
									Updated {formatShortDate(record.migrationDeadline)}
								</div>
								</div>
							</div>

            <div className={cn(
              "pt-2 text-center text-xs text-muted-foreground group-hover:text-loud-foreground group-focus:text-loud-foreground group-hover:fx-glow-sm group-focus:fx-glow-sm",
              "before:content-[''] before:border-b before:border-muted-foreground/60 before:w-8 before:inline-block before:align-middle before:mr-1",
              "after:content-[''] after:border-b after:border-muted-foreground/60 after:w-8 after:inline-block after:align-middle after:ml-1"
            )}>
								Click to view resolution details
						</div>
					</button>
				</DialogTrigger>
			</div>
			<ForkResolutionDialog record={record} />
		</Dialog>
	);
};

export const ForkResolutionPending = (): React.JSX.Element => (
	<div className="mx-auto w-full max-w-xl px-8 text-left font-mono text-sm">
		<div className="border border-orange-500/40 bg-orange-500/5 p-5">
			<div className="mb-2 text-xs uppercase tracking-wide text-orange-400">
				THE FORK RECORD
			</div>
			<div className="font-display text-2xl uppercase text-orange-300">
				Resolution pending
			</div>
			<p className="mt-3 font-prose text-sm text-muted-foreground">
				Migration has closed. The final winner is not verified in fork JSON data
				yet, so the site is withholding a canonical-universe claim.
			</p>
		</div>
	</div>
);
