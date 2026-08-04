import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) =>
	readFileSync(path.join(repositoryRoot, file), "utf8");

const faq = read("src/pages/faq.astro");
const faqItem = read("src/features/faq/item.astro");
const footer = read("src/components/shell/footer.astro");
const featureDocumentation = read("docs/faq-feature.md");

const faqAnchorIds = [
	"what-is-augur",
	"what-is-a-prediction-market",
	"what-is-rep-used-for",
	"how-are-markets-resolved",
	"what-is-a-dispute-bond",
	"when-does-augur-fork",
	"what-is-a-fork",
	"is-rep-migration-reversible",
	"what-happens-to-unmigrated-rep",
	"what-was-the-moon-fork",
	"which-outcome-won-the-moon-fork",
	"where-is-the-moon-fork-record",
	"what-is-lituus",
	"how-does-lituus-relate-to-augur",
	"how-do-i-verify-a-token",
	"where-should-i-learn-more",
];

test("keeps the FAQ general and the Moon Fork subsection historical", () => {
	assert.match(faq, /title="Augur FAQ \| Augur"/u);
	assert.match(faq, /<PageTitle prefix="FAQ" title="AUGUR"/u);
	assert.match(faq, /Moon Fork · Historical Record/u);
	assert.match(faq, /archived migration record/u);
	assert.doesNotMatch(faq, /MigrationCta|isMigrationOpen|migrationOpen/u);
	assert.doesNotMatch(
		faq,
		/migration-open|migration window is open|Open now|active migration|must migrate/iu,
	);
});

test("uses native disclosure controls with unique, documented question anchors", () => {
	assert.match(faqItem, /<details[^>]*id=\{id\}/u);
	assert.match(faqItem, /<summary/u);
	assert.doesNotMatch(faqItem, /client:|<script/u);

	const ids = [...faq.matchAll(/<FaqItem id="([^"]+)"/gu)].map(
		(match) => match[1],
	);
	assert.deepEqual(ids, faqAnchorIds);
	assert.equal(new Set(ids).size, ids.length);
	for (const id of faqAnchorIds) {
		assert.match(featureDocumentation, new RegExp(`#${id}\\b`, "u"));
	}
});

test("links FAQ readers only to existing Learn routes and updates the footer label", () => {
	const learnLinks = [
		...new Set(
			[...faq.matchAll(/href="([^"]+)"/gu)]
				.map((match) => match[1])
				.filter((href) => href.startsWith("/learn/")),
		),
	];
	assert.deepEqual(learnLinks.sort(), [
		"/learn/fork/",
		"/learn/fork/disputes-and-bonds/",
		"/learn/fork/migration/",
		"/learn/fork/what-to-do/",
	].sort());
	assert.ok(
		existsSync(path.join(repositoryRoot, "src/content/learn/fork/migration.mdx")),
	);
	assert.match(footer, /AUGUR FAQ/u);
	assert.doesNotMatch(footer, /FORK & MIGRATION FAQ/u);
});
