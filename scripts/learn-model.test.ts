import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
	assertLearnEntries,
	getLearnEntryGroup,
	getLearnNavigation,
	getLearnPageContext,
	getLearnTopicCatalog,
	learnTopicRegistry,
	usesHistoricalPresentation,
	type LearnEntryLike,
	type LearnMetadata,
} from "../src/lib/learn.ts";

const entry = (slug: string, data: LearnMetadata): LearnEntryLike => ({
	slug,
	data,
});

test("orders navigation within each registered topic and omits planned entries", () => {
	const entries = [
		entry("fork/what-to-do", {
			topic: "fork",
			order: 3,
			contentType: "guide",
			label: "WHAT TO DO",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
		entry("fork/index", {
			topic: "fork",
			order: 1,
			contentType: "topic",
			label: "WHAT IS A FORK?",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
		entry("fork/future-lesson", {
			topic: "fork",
			order: 4,
			contentType: "lesson",
			label: "FUTURE LESSON",
			historical: false,
			status: "planned",
			presentation: "standard",
		}),
		entry("fork/disputes-and-bonds", {
			topic: "fork",
			order: 2,
			contentType: "lesson",
			label: "HOW DISPUTES & BONDS WORK",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
	];

	assert.deepEqual(
		getLearnNavigation(entries, "fork").map(({ label, path }) => ({ label, path })),
		[
			{ label: "WHAT IS A FORK?", path: "/learn/fork/" },
			{
				label: "HOW DISPUTES & BONDS WORK",
				path: "/learn/fork/disputes-and-bonds/",
			},
			{ label: "WHAT TO DO", path: "/learn/fork/what-to-do/" },
		],
	);
});

test("builds the landing catalog from available metadata", () => {
	const registry = {
		...learnTopicRegistry,
		oracle: {
			label: "Oracle",
			description: "Learn how the oracle works.",
		},
		future: {
			label: "Future",
			description: "Not published yet.",
		},
	};
	const entries = [
		entry("fork/index", {
			topic: "fork",
			order: 1,
			contentType: "topic",
			label: "WHAT IS A FORK?",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
		entry("fork/migration", {
			topic: "fork",
			order: 4,
			contentType: "historical-record",
			label: "MIGRATION GUIDE",
			historical: true,
			status: "archived",
			presentation: "historical-record",
		}),
		entry("fork/future-lesson", {
			topic: "fork",
			order: 5,
			contentType: "lesson",
			label: "FUTURE LESSON",
			historical: false,
			status: "planned",
			presentation: "standard",
		}),
		entry("oracle/index", {
			topic: "oracle",
			order: 1,
			contentType: "topic",
			label: "ORACLE BASICS",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
		entry("future/index", {
			topic: "future",
			order: 1,
			contentType: "topic",
			label: "FUTURE TOPIC",
			historical: false,
			status: "planned",
			presentation: "standard",
		}),
	];

	const catalog = getLearnTopicCatalog(entries, registry);

	assert.deepEqual(
		catalog.map(({ topic }) => topic.key),
		["fork", "oracle"],
	);
	assert.deepEqual(
		catalog[0].availableEntries.map(({ label, path }) => ({ label, path })),
		[{ label: "WHAT IS A FORK?", path: "/learn/fork/" }],
	);
	assert.deepEqual(
		catalog[0].archivedEntries.map(({ label, status }) => ({ label, status })),
		[{ label: "MIGRATION GUIDE", status: "archived" }],
	);
	assert.equal(getLearnEntryGroup(catalog[0].archivedEntries[0]), "historical-record");
	assert.deepEqual(
		catalog[1].availableEntries.map(({ label, path }) => ({ label, path })),
		[{ label: "ORACLE BASICS", path: "/learn/oracle/" }],
	);
});

test("rejects available child content without an available topic landing entry", () => {
	const registry = {
		...learnTopicRegistry,
		oracle: {
			label: "Oracle",
			description: "Learn how the oracle works.",
		},
	};

	assert.throws(
		() =>
			getLearnTopicCatalog(
				[
					entry("oracle/reference", {
						topic: "oracle",
						order: 1,
						contentType: "reference",
						label: "ORACLE REFERENCE",
						historical: false,
						status: "available",
						presentation: "reference",
					}),
				],
				registry,
			),
		/Learn topic oracle has available content but no available topic landing entry at \/learn\/oracle\//u,
	);
});

test("classifies historical case studies as case studies", () => {
	assert.equal(
		getLearnEntryGroup({ contentType: "case-study", historical: true }),
		"case-study",
	);
});

test("the landing route consumes the shared catalog and canonical topic paths", () => {
	const route = readFileSync(
		fileURLToPath(new URL("../src/pages/learn/index.astro", import.meta.url)),
		"utf8",
	);

	assert.match(route, /getCollection\("learn"\)/u);
	assert.match(route, /getLearnTopicCatalog\(learnCollection\)/u);
	assert.match(route, /href=\{entry\.path\}/u);
	assert.match(
		route,
		/const startTopic = topicCards\.find\(\(\{ topic \}\) => topic\.key === "fork"\)/u,
	);
	assert.doesNotMatch(route, /const startTopic = topicCards\[0\]/u);
	assert.match(route, /Understand how Augur resolves markets/u);
	assert.match(route, /const orderedTopicCards = \[/u);
	assert.match(route, /topicIndex === 0 \? "START HERE" : "LEARNING PATH"/u);
	assert.match(route, /String\(entryIndex \+ 1\)\.padStart\(2, "0"\)/u);
	assert.doesNotMatch(
		route,
		/>\s*Topics\s*<|GOOD FOR|CORE LEARNING PATH|learn-start-here|audienceByContentType|renderEntryAudience/u,
	);
	assert.doesNotMatch(
		route,
		/Only topics with available material|Planned topics stay out of the catalog|AVAILABLE TOPIC|No case studies are currently published|Explore topics|Choose a topic to explore/u,
	);
	assert.match(route, /Historical records/u);
});

test("links child Learn breadcrumbs to the Learn root", () => {
	const breadcrumbs = readFileSync(
		fileURLToPath(
			new URL("../src/components/content/learn-breadcrumbs.astro", import.meta.url),
		),
		"utf8",
	);

	assert.match(
		breadcrumbs,
		/<a href="\/learn\/" class="hover:text-primary transition-colors">LEARN<\/a>/u,
	);
	assert.match(
		breadcrumbs,
		/<span aria-current="page" class="text-foreground">\{currentLabel\}<\/span>/u,
	);
});

test("adds a second topic through the registry without layout changes", () => {
	const registry = {
		...learnTopicRegistry,
		oracle: {
			label: "Oracle",
			description: "Learn how the oracle works.",
		},
	};
	const entries = [
		entry("oracle/reference", {
			topic: "oracle",
			order: 2,
			contentType: "reference",
			label: "ORACLE REFERENCE",
			historical: false,
			status: "available",
			presentation: "reference",
		}),
		entry("oracle/index", {
			topic: "oracle",
			order: 1,
			contentType: "topic",
			label: "ORACLE BASICS",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
	];

	assertLearnEntries(entries, registry);
	const context = getLearnPageContext(entries[0], entries, registry);

	assert.deepEqual(context.topic, {
		key: "oracle",
		path: "/learn/oracle/",
		label: "Oracle",
		description: "Learn how the oracle works.",
	});
	assert.deepEqual(
		context.navigation.map(({ label, path }) => ({ label, path })),
		[
			{ label: "ORACLE BASICS", path: "/learn/oracle/" },
			{ label: "ORACLE REFERENCE", path: "/learn/oracle/reference/" },
		],
	);

	const layout = readFileSync(
		fileURLToPath(new URL("../src/layouts/LearnLayout.astro", import.meta.url)),
		"utf8",
	);
	assert.doesNotMatch(layout, /fork/u);
});

test("selects the specialized layout from declarative presentation metadata", () => {
	assert.equal(usesHistoricalPresentation("historical-record"), true);
	assert.equal(usesHistoricalPresentation("standard"), false);

	const route = readFileSync(
		fileURLToPath(new URL("../src/pages/learn/[...slug].astro", import.meta.url)),
		"utf8",
	);
	assert.match(route, /usesHistoricalPresentation\(presentation\)/u);
	assert.doesNotMatch(route, /entry\.slug.*fork\/migration/u);
});

test("rejects unknown topics and duplicate order values", () => {
	const invalidEntries = [
		entry("unknown/lesson", {
			topic: "unknown",
			order: 1,
			contentType: "lesson",
			label: "UNKNOWN",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
	];

	assert.throws(() => assertLearnEntries(invalidEntries), /Unknown Learn topic/u);
	assert.throws(
		() =>
			assertLearnEntries([
				entry("oracle/lesson", {
					topic: "fork",
					order: 1,
					contentType: "lesson",
					label: "MISROUTED",
					historical: false,
					status: "available",
					presentation: "standard",
				}),
			]),
		/routed under topic fork/u,
	);

	const duplicateEntries = [
		entry("fork/first", {
			topic: "fork",
			order: 1,
			contentType: "lesson",
			label: "FIRST",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
		entry("fork/second", {
			topic: "fork",
			order: 1,
			contentType: "lesson",
			label: "SECOND",
			historical: false,
			status: "available",
			presentation: "standard",
		}),
	];

	assert.throws(
		() => assertLearnEntries(duplicateEntries),
		/duplicate order 1/u,
	);
});
