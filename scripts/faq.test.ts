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
	"what-is-live-today",
	"is-this-a-trading-interface",
	"what-is-the-reboot-building",
	"which-rep-token-is-current",
	"why-are-there-multiple-rep-contracts",
	"is-another-rep-migration-required",
	"what-happened-to-other-rep",
	"how-do-i-verify-rep",
	"why-did-the-moon-fork-happen",
	"is-the-moon-fork-complete",
	"which-universe-won",
	"where-is-the-on-chain-evidence",
	"where-is-the-complete-record",
	"what-causes-an-augur-fork",
	"what-is-a-universe",
	"why-is-rep-migration-irreversible",
];

test("keeps the FAQ general and the Moon Fork subsection historical", () => {
	assert.match(faq, /title="Augur FAQ \| Augur"/u);
	assert.match(faq, /<PageTitle prefix="FAQ" title="AUGUR"/u);
	assert.match(faq, /<SectionHeading text="Augur Today"/u);
	assert.match(faq, /<SectionHeading text="REP After the Moon Fork"/u);
	assert.match(faq, /<SectionHeading text="The Moon Fork"/u);
	assert.match(faq, /<SectionHeading text="Protocol Questions"/u);
	assert.match(faq, /archived Moon Fork record/u);
	assert.doesNotMatch(faq, /question="What is Augur\?"|What is a prediction market\?|Where should I learn more\?|Safety & Participation/u);
	assert.doesNotMatch(faq, /MigrationCta|isMigrationOpen|migrationOpen/u);
	assert.doesNotMatch(faq, /Lituus|lituus/u);
	assert.doesNotMatch(featureDocumentation, /\*\*Lituus\*\*|what-is-lituus|how-does-lituus/u);
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
		"/learn/fork/migration/",
	].sort());
	assert.ok(
		existsSync(path.join(repositoryRoot, "src/content/learn/fork/migration.mdx")),
	);
	assert.match(footer, /AUGUR FAQ/u);
	assert.doesNotMatch(footer, /FORK & MIGRATION FAQ/u);
});
