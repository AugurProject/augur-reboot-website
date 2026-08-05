import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
	getLearnEntryPath,
	getLearnNavigation,
	type LearnEntryLike,
	type LearnMetadata,
} from "../src/lib/learn.ts";

const forkContentDir = fileURLToPath(
	new URL("../src/content/learn/fork/", import.meta.url),
);

const expectedEntries = [
	{
		file: "index.mdx",
		slug: "fork/index",
		order: 1,
		contentType: "topic",
		label: "WHAT IS A FORK?",
		historical: false,
		status: "available",
	},
	{
		file: "disputes-and-bonds.mdx",
		slug: "fork/disputes-and-bonds",
		order: 2,
		contentType: "lesson",
		label: "HOW DISPUTES & BONDS WORK",
		historical: false,
		status: "available",
	},
	{
		file: "migration-mechanics.mdx",
		slug: "fork/migration-mechanics",
		order: 3,
		contentType: "lesson",
		label: "HOW FORK MIGRATION WORKS",
		historical: false,
		status: "available",
	},
	{
		file: "what-to-do.mdx",
		slug: "fork/what-to-do",
		order: 4,
		contentType: "guide",
		label: "WHAT TO DO AROUND FORK RISK",
		historical: false,
		status: "available",
	},
	{
		file: "moon-fork.mdx",
		slug: "fork/moon-fork",
		order: 5,
		contentType: "case-study",
		label: "THE MOON FORK",
		historical: true,
		status: "available",
	},
	{
		file: "migration.mdx",
		slug: "fork/migration",
		order: 6,
		contentType: "historical-record",
		label: "MOON FORK MIGRATION RECORD",
		historical: true,
		status: "archived",
	},
] as const;

function readFrontmatter(file: string): Record<string, string | boolean | number> {
	const content = readFileSync(`${forkContentDir}/${file}`, "utf8");
	const match = content.match(/^---\n([\s\S]*?)\n---/u);
	assert.ok(match, `${file} must have frontmatter`);

	return Object.fromEntries(
		match[1].split("\n").map((line) => {
			const separator = line.indexOf(":");
			assert.notEqual(separator, -1, `Invalid frontmatter line in ${file}: ${line}`);
			const key = line.slice(0, separator);
			const rawValue = line.slice(separator + 1).trim();
			const value = rawValue.replace(/^(['"])(.*)\1$/u, "$2");

			if (value === "true" || value === "false") {
				return [key, value === "true"];
			}
			if (/^\d+$/u.test(value)) {
				return [key, Number(value)];
			}
			return [key, value];
		}),
	);
}

function readContent(file: string): string {
	return readFileSync(`${forkContentDir}/${file}`, "utf8");
}

test("defines the ordered evergreen Fork sequence and preserves the archive URL", () => {
	const entries: LearnEntryLike[] = expectedEntries.map((expected) => ({
		slug: expected.slug,
		data: readFrontmatter(expected.file) as unknown as LearnMetadata,
	}));

	assert.deepEqual(
		entries.map(({ slug, data }) => ({
			slug,
			order: data.order,
			contentType: data.contentType,
			label: data.label,
			historical: data.historical,
			status: data.status,
		})),
		expectedEntries.map(({ slug, order, contentType, label, historical, status }) => ({
			slug,
			order,
			contentType,
			label,
			historical,
			status,
		})),
	);

	assert.deepEqual(
		getLearnNavigation(entries, "fork").map(({ label, path, order, contentType, historical, status }) => ({
			label,
			path,
			order,
			contentType,
			historical,
			status,
		})),
		[
			{
				label: "WHAT IS A FORK?",
				path: "/learn/fork/",
				order: 1,
				contentType: "topic",
				historical: false,
				status: "available",
			},
			{
				label: "HOW DISPUTES & BONDS WORK",
				path: "/learn/fork/disputes-and-bonds/",
				order: 2,
				contentType: "lesson",
				historical: false,
				status: "available",
			},
			{
				label: "HOW FORK MIGRATION WORKS",
				path: "/learn/fork/migration-mechanics/",
				order: 3,
				contentType: "lesson",
				historical: false,
				status: "available",
			},
			{
				label: "WHAT TO DO AROUND FORK RISK",
				path: "/learn/fork/what-to-do/",
				order: 4,
				contentType: "guide",
				historical: false,
				status: "available",
			},
			{
				label: "THE MOON FORK",
				path: "/learn/fork/moon-fork/",
				order: 5,
				contentType: "case-study",
				historical: true,
				status: "available",
			},
			{
				label: "MOON FORK MIGRATION RECORD",
				path: "/learn/fork/migration/",
				order: 6,
				contentType: "historical-record",
				historical: true,
				status: "archived",
			},
		],
	);

	for (const entry of expectedEntries) {
		assert.ok(existsSync(`${forkContentDir}/${entry.file}`), `${entry.file} must remain present`);
		assert.equal(getLearnEntryPath(entry.slug), `/learn/${entry.slug.replace(/\/index$/u, "")}/`);
	}
});

test("uses declarative presentation metadata for evergreen and archived entries", () => {
	for (const expected of expectedEntries) {
		const metadata = readFrontmatter(expected.file);

		assert.equal(metadata.topic, "fork");
		const expectedPresentation =
			expected.contentType === "case-study"
				? "case-study"
				: expected.contentType === "historical-record"
					? "historical-record"
					: "standard";
		assert.equal(metadata.presentation, expectedPresentation);
	}
});

test("connects evergreen lessons without importing live-event or Moon Fork facts", () => {
	const index = readContent("index.mdx");
	const disputes = readContent("disputes-and-bonds.mdx");
	const mechanics = readContent("migration-mechanics.mdx");
	const preparedness = readContent("what-to-do.mdx");
	const evergreen = [index, disputes, mechanics, preparedness].join("\n");

	assert.match(index, /disputes-and-bonds/u);
	assert.match(index, /migration-mechanics/u);
	assert.match(index, /what-to-do/u);
	assert.match(index, /\/learn\/fork\/moon-fork\//u);
	assert.match(disputes, /migration-mechanics/u);
	assert.match(mechanics, /what-to-do/u);
	assert.match(preparedness, /migration-mechanics/u);
	assert.match(preparedness, /historical migration record/u);

	assert.doesNotMatch(evergreen, /MigrationCta|isMigrationOpen|MIGRATION IMMINENT|Migrate your REP before/iu);
	assert.doesNotMatch(evergreen, /REPv2_Yes_1|0x[0-9a-f]{40}|Artemis II|June 11/iu);
	assert.match(mechanics, /Current-action boundary/u);
	assert.match(
		mechanics,
		/A child universe is created only when REP is migrated to that outcome/u,
	);
	assert.match(
		index,
		/each child is created only when migration first targets that outcome/u,
	);
	assert.doesNotMatch(
		[index, mechanics].join("\n"),
		/When the fork starts, Augur creates one child universe for each possible outcome|A fork creates a child universe for each possible outcome/u,
	);
	assert.match(preparedness, /not a live migration checklist/u);
});

test("anchors protocol education to maintained and pinned evidence", () => {
	const content = readContent("migration-mechanics.mdx");

	assert.match(content, /augur-v2-whitepaper-summary|augur-v2-protocol-glossary/u);
	assert.match(content, /Universe\.sol/u);
	assert.match(content, /ReputationToken\.sol/u);
	assert.match(content, /bd13a797016b373834e9414096c6086f35aa628f/u);
});
