import { getCollection, type CollectionEntry } from "astro:content";

const WHITEPAPER_COLLECTIONS = ["whitepaper-v2"] as const;

type WhitepaperCollection = (typeof WHITEPAPER_COLLECTIONS)[number];

export interface WhitepaperFigure {
	name: string;
	sourcePath: string;
	contentType: "image/jpeg";
}

export interface WhitepaperEdition {
	slug: string;
	collection: WhitepaperCollection;
	sourceDirectory: string;
	title: string;
	shortTitle: string;
	description: string;
	release: string;
	sourceRevision: string;
	pdfUrl: string;
	sourceRepositoryUrl: string;
	sectionOrder: readonly string[];
	figures: readonly WhitepaperFigure[];
}

const WHITEPAPER_EDITIONS = [
	{
		slug: "augur-v2",
		collection: "whitepaper-v2",
		sourceDirectory: "src/content/whitepaper-v2",
		title: "Augur: a Decentralized Oracle and Prediction Market Platform (v2.0)",
		shortTitle: "Augur v2 Whitepaper",
		description:
			"The Augur v2 whitepaper: a decentralized oracle and prediction market platform.",
		release: "v2.0.16",
		sourceRevision: "69accf630d20af5aee5ff3d78fcf6560f069ccfd",
		pdfUrl:
			"https://github.com/AugurProject/whitepaper/releases/download/v2.0.16/augur-whitepaper-v2.pdf",
		sourceRepositoryUrl: "https://github.com/AugurProject/whitepaper",
		sectionOrder: [
			"abstract-and-introduction",
			"how-augur-works",
			"incentives-and-security",
			"potential-issues-and-risks",
			"acknowledgments",
			"references",
			"appendix-a-finalization-time-and-redistribution",
			"appendix-b-bond-size-adjustments",
		],
		figures: [
			{
				name: "figure-1-market-lifecycle.jpeg",
				sourcePath: "figures/figure-1-market-lifecycle.jpeg",
				contentType: "image/jpeg",
			},
			{
				name: "figure-2-reporting-flowchart.jpeg",
				sourcePath: "figures/figure-2-reporting-flowchart.jpeg",
				contentType: "image/jpeg",
			},
		],
	},
] as const satisfies readonly WhitepaperEdition[];

export type WhitepaperEntry = CollectionEntry<WhitepaperCollection>;

export interface WhitepaperNavigationLink {
	title: string;
	href: string;
}

export function getWhitepaperEditions(): readonly WhitepaperEdition[] {
	return WHITEPAPER_EDITIONS;
}

export function getWhitepaperRoot(edition: WhitepaperEdition) {
	return `/whitepapers/${edition.slug}/`;
}

export async function getWhitepaperEntries(edition: WhitepaperEdition) {
	return getCollection(edition.collection);
}

export function sortWhitepaperEntries(
	edition: WhitepaperEdition,
	entries: WhitepaperEntry[],
) {
	const order = new Map(
		edition.sectionOrder.map((id, index) => [id, index]),
	);

	return [...entries].sort((a, b) => {
		if (a.slug === "index") return -1;
		if (b.slug === "index") return 1;
		return (
			(order.get(a.slug) ?? Number.MAX_SAFE_INTEGER) -
			(order.get(b.slug) ?? Number.MAX_SAFE_INTEGER)
		);
	});
}

export function getWhitepaperTitle(entry: WhitepaperEntry) {
	const heading = entry.body.match(/^#\s+(.+)$/m)?.[1]?.trim();
	return heading ?? "References";
}

export function getWhitepaperBreadcrumbTitle(entry: WhitepaperEntry) {
	return entry.slug === "abstract-and-introduction"
		? "Abstract"
		: getWhitepaperTitle(entry);
}

export function getWhitepaperPagePath(
	edition: WhitepaperEdition,
	entry: WhitepaperEntry,
) {
	const root = getWhitepaperRoot(edition);
	return entry.slug === "index" ? root : `${root}${entry.slug}/`;
}

export function getWhitepaperRawPath(
	edition: WhitepaperEdition,
	entry: WhitepaperEntry,
) {
	return `${getWhitepaperRoot(edition)}${entry.slug}.md`;
}

export function getWhitepaperNavigation(
	edition: WhitepaperEdition,
	entries: WhitepaperEntry[],
	currentId: string,
) {
	const ordered = sortWhitepaperEntries(edition, entries).filter(
		(entry) => entry.slug !== "index",
	);
	const currentIndex = ordered.findIndex((entry) => entry.slug === currentId);

	const toLink = (entry: WhitepaperEntry): WhitepaperNavigationLink => ({
		title: getWhitepaperTitle(entry),
		href: getWhitepaperPagePath(edition, entry),
	});

	return {
		previous:
			currentIndex > 0 ? toLink(ordered[currentIndex - 1]) : undefined,
		next:
			currentIndex >= 0 && currentIndex < ordered.length - 1
				? toLink(ordered[currentIndex + 1])
				: undefined,
	};
}
