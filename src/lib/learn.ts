export const LEARN_CONTENT_TYPES = [
	"topic",
	"lesson",
	"guide",
	"reference",
	"case-study",
	"historical-record",
] as const;

export const LEARN_STATUSES = ["available", "archived", "planned"] as const;

export const LEARN_PRESENTATIONS = [
	"standard",
	"reference",
	"case-study",
	"historical-record",
] as const;

export type LearnContentType = (typeof LEARN_CONTENT_TYPES)[number];
export type LearnStatus = (typeof LEARN_STATUSES)[number];
export type LearnPresentation = (typeof LEARN_PRESENTATIONS)[number];

export interface LearnMetadata {
	topic: string;
	order: number;
	contentType: LearnContentType;
	label: string;
	historical: boolean;
	status: LearnStatus;
	presentation: LearnPresentation;
}

export interface LearnTopicDefinition {
	label: string;
	description: string;
}

export type LearnTopicRegistry = Record<string, LearnTopicDefinition>;

export const learnTopicRegistry = {
	fork: {
		label: "Fork",
		description: "Learn about Augur protocol forks and fork mechanics.",
	},
} as const satisfies LearnTopicRegistry;

export interface LearnTopicContext extends LearnTopicDefinition {
	key: string;
	path: string;
}

export interface LearnEntryLike {
	slug: string;
	data: LearnMetadata;
}

export interface LearnNavigationItem {
	label: string;
	path: string;
	order: number;
	contentType: LearnContentType;
	historical: boolean;
	status: LearnStatus;
}

export function getLearnTopic(
	topicKey: string,
	registry: LearnTopicRegistry = learnTopicRegistry,
): LearnTopicContext {
	const definition = registry[topicKey];

	if (!definition) {
		throw new Error(`Unknown Learn topic: ${topicKey}`);
	}

	return {
		key: topicKey,
		path: `/learn/${topicKey}/`,
		...definition,
	};
}

export function getLearnEntryPath(slug: string): string {
	const normalizedSlug = slug.replace(/^\/+|\/+$/gu, "").replace(/\/index$/u, "");
	return `/learn/${normalizedSlug}/`;
}

export function assertLearnEntries(
	entries: readonly LearnEntryLike[],
	registry: LearnTopicRegistry = learnTopicRegistry,
): void {
	const orders = new Map<string, Set<number>>();

	for (const entry of entries) {
		getLearnTopic(entry.data.topic, registry);

		const routeTopic = entry.slug.split("/")[0];
		if (routeTopic !== entry.data.topic) {
			throw new Error(
				`Learn entry ${entry.slug} must be routed under topic ${entry.data.topic}`,
			);
		}

		if (!Number.isInteger(entry.data.order) || entry.data.order < 0) {
			throw new Error(
				`Learn entry ${entry.slug} must have a non-negative integer order`,
			);
		}

		const topicOrders = orders.get(entry.data.topic) ?? new Set<number>();
		if (topicOrders.has(entry.data.order)) {
			throw new Error(
				`Learn topic ${entry.data.topic} has duplicate order ${entry.data.order}`,
			);
		}
		topicOrders.add(entry.data.order);
		orders.set(entry.data.topic, topicOrders);
	}
}

export function getLearnNavigation(
	entries: readonly LearnEntryLike[],
	topicKey: string,
): LearnNavigationItem[] {
	return entries
		.filter(
			(entry) =>
				entry.data.topic === topicKey && entry.data.status !== "planned",
		)
		.sort((left, right) => left.data.order - right.data.order)
		.map((entry) => ({
			label: entry.data.label,
			path: getLearnEntryPath(entry.slug),
			order: entry.data.order,
			contentType: entry.data.contentType,
			historical: entry.data.historical,
			status: entry.data.status,
		}));
}

export function getLearnPageContext(
	entry: LearnEntryLike,
	entries: readonly LearnEntryLike[],
	registry: LearnTopicRegistry = learnTopicRegistry,
) {
	const topic = getLearnTopic(entry.data.topic, registry);

	return {
		topic,
		navigation: getLearnNavigation(entries, topic.key),
	};
}

export function usesHistoricalPresentation(
	presentation: LearnPresentation,
): boolean {
	return presentation === "historical-record";
}
