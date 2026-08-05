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

const faqSections = [
	"Augur Today",
	"The Moon Fork",
	"Timeline",
	"How the Fork Played Out",
	"Tokens",
	"Exchanges",
	"Scams & Safety",
];

const faqAnchorIds = [
	"can-i-use-augur-today",
	"what-is-the-reboot-building",
	"i-own-repv2-what-happened",
	"i-didnt-migrate-in-time-is-there-anything-i-can-do",
	"why-did-augur-fork",
	"what-is-a-fork-in-simple-terms",
	"when-did-the-fork-start-and-end",
	"what-happened-during-the-escalation-game-phase-1",
	"what-happened-during-the-migration-window-phase-2",
	"what-happened-if-someone-migrated-to-the-no-universe",
	"is-there-a-new-rep-token",
	"is-augur-on-kraken-the-same-as-repv2-yes-1",
	"does-the-old-rep-token-still-exist",
	"the-new-token-doesnt-appear-in-my-wallet-yet-is-something-wrong",
	"my-rep-was-on-kraken-did-i-need-to-do-anything",
	"what-about-rep-on-other-exchanges-gate-upbit",
	"what-happened-to-rep-left-on-an-exchange",
	"someone-offered-to-migrate-or-recover-my-rep-is-that-real",
];

test("renders the finalized Augur FAQ without active-migration state", () => {
	assert.match(faq, /title="Augur FAQ \| Augur"/u);
	assert.match(faq, /<PageTitle prefix="FAQ" title="AUGUR"/u);

	const sections = [...faq.matchAll(/<SectionHeading text="([^"]+)"/gu)].map(
		(match) => match[1],
	);
	assert.deepEqual(sections, faqSections);
	assert.doesNotMatch(
		faq,
		/MigrationCta|getForkLifecycleAtBuild|isMigrationOpen|migrationOpen|migration-open|must migrate/iu,
	);
	assert.doesNotMatch(
		faq,
		/question="What is Augur\?"|question="What is a prediction market\?"/u,
	);
});

test("uses native disclosure controls with unique, documented anchors", () => {
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

test("preserves lazy child-universe creation in reader-facing answers", () => {
	assert.match(faq, /each child universe was created when REP first migrated to it/u);
	assert.match(
		faq,
		/A child universe and its REP token were created when REP first migrated to that outcome/u,
	);
	assert.doesNotMatch(
		faq,
		/created a (?:child universe|new REP token) for every possible outcome|created a new REP token for each universe/iu,
	);
});

test("keeps finalized FAQ destinations and the combined footer updates", () => {
	for (const file of [
		"src/content/learn/fork/index.mdx",
		"src/pages/mission.astro",
		"src/pages/team.astro",
		"src/content/blog/the-augur-fork-is-here/index.mdx",
		"src/content/blog/phase-1-the-escalation-game/index.mdx",
		"src/content/blog/phase-2-the-fork-migration/index.mdx",
	]) {
		assert.ok(existsSync(path.join(repositoryRoot, file)), `${file} must exist`);
	}

	assert.match(faq, /https:\/\/v3\.augur\.net\//u);
	assert.match(faq, /https:\/\/support\.kraken\.com\/articles\/augur-migration/u);
	assert.match(faq, /REPv2_Yes_1/u);
	assert.match(faq, /0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D/u);

	assert.match(footer, /AUGUR FAQ/u);
	assert.doesNotMatch(footer, /FORK & MIGRATION FAQ/u);
	assert.match(footer, /https:\/\/github\.com\/darkflorist/u);
	assert.match(footer, /AUGUR V2 WHITEPAPER/u);
	assert.match(footer, /AUGUR LITUUS WHITEPAPER/u);
});
