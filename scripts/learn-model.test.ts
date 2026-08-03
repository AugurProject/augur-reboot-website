import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
	assertLearnEntries,
	getLearnNavigation,
	getLearnPageContext,
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
