import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const footer = read("src/components/shell/footer.astro");
const forkRecord = read("src/features/fork-monitor/post-fork-record.tsx");
const faq = read("src/pages/faq.astro");
const learnTopic = read("src/content/learn/fork/index.mdx");
const migrationMechanics = read("src/content/learn/fork/migration-mechanics.mdx");
const moonFork = read("src/content/learn/fork/moon-fork.mdx");
const migrationArchive = read("src/content/learn/fork/migration.mdx");
const legacyForkPost = read(
	"src/content/blog/augur-cryptos-first-algorithmic-fork/index.mdx",
);
const phaseOnePost = read("src/content/blog/phase-1-the-escalation-game/index.mdx");
const testingPastPost = read(
	"src/content/blog/augur-testing-past-building-future/index.mdx",
);
const oneYearPost = read("src/content/blog/augur-one-year-in/index.mdx");
const micahForkPost = read("src/content/blog/micahs-augur-fork/index.mdx");
const augursRisingPost = read("src/content/blog/augurs-rising/index.mdx");
const repReference = read("src/pages/rep.astro");
const architectureDocumentation = read("docs/public-knowledge-architecture.md");
const faqDocumentation = read("docs/faq-feature.md");

const routeSources = new Map([
	["/", "src/pages/index.astro"],
	["/learn/", "src/pages/learn/index.astro"],
	["/faq/", "src/pages/faq.astro"],
	["/mission/", "src/pages/mission.astro"],
	["/team/", "src/pages/team.astro"],
	["/rep/", "src/pages/rep.astro"],
	["/blog/", "src/pages/blog/index.astro"],
	["/blog/micahs-augur-fork/", "src/content/blog/micahs-augur-fork/index.mdx"],
	["/learn/fork/", "src/content/learn/fork/index.mdx"],
	["/learn/fork/disputes-and-bonds/", "src/content/learn/fork/disputes-and-bonds.mdx"],
	["/learn/fork/migration-mechanics/", "src/content/learn/fork/migration-mechanics.mdx"],
	["/learn/fork/what-to-do/", "src/content/learn/fork/what-to-do.mdx"],
	["/learn/fork/moon-fork/", "src/content/learn/fork/moon-fork.mdx"],
	["/learn/fork/migration/", "src/content/learn/fork/migration.mdx"],
]);

function canonicalPath(value: string): string {
	const withoutSuffix = value.split(/[?#]/u)[0];
	return withoutSuffix.endsWith("/") ? withoutSuffix : `${withoutSuffix}/`;
}

test("documents the implemented public knowledge model", () => {
	assert.match(architectureDocumentation, /Settled and implemented/u);
	assert.doesNotMatch(architectureDocumentation, /Proposed for review/u);
	assert.match(faqDocumentation, /AUGUR LEARN.*AUGUR FAQ.*WHITEPAPERS/su);
});

test("keeps Learn and FAQ in persistent knowledge navigation", () => {
	assert.match(footer, /href="\/learn"/u);
	assert.match(footer, /AUGUR LEARN/u);
	assert.match(footer, /href="\/faq"/u);
	assert.match(footer, /AUGUR FAQ/u);
});

test("sends the homepage Fork Record to the canonical Moon Fork case study", () => {
	assert.match(forkRecord, /const MOON_FORK_URL = "\/learn\/fork\/moon-fork\/"/u);
	assert.match(forkRecord, /href=\{MOON_FORK_URL\}/u);
	assert.match(forkRecord, /Read the Moon Fork case study/u);
});

test("preserves the critical Learn, FAQ, case-study, and archive link graph", () => {
	for (const [file, content, requiredLinks] of [
		[
			"FAQ",
			faq,
			["/learn/", "/learn/fork/moon-fork/", "/learn/fork/migration-mechanics/", "/learn/fork/migration/"],
		],
		["Fork topic", learnTopic, ["/learn/fork/migration-mechanics/", "/learn/fork/moon-fork/", "/learn/fork/migration/"]],
		["Migration mechanics", migrationMechanics, ["/learn/fork/what-to-do/", "/learn/fork/migration/"]],
		["Moon Fork", moonFork, ["/learn/fork/migration-mechanics/", "/learn/fork/migration/", "/learn/"]],
		["Migration archive", migrationArchive, ["/learn/fork/migration-mechanics/", "/learn/fork/moon-fork/", "/learn/fork/"]],
	] as const) {
		for (const link of requiredLinks) {
			assert.match(content, new RegExp(link.replaceAll("/", "\\/"), "u"), `${file} should link to ${link}`);
			assert.ok(routeSources.has(canonicalPath(link)), `missing route source for ${link}`);
		}
	}
});

test("qualifies expired blog instructions without rewriting their historical copy", () => {
	assert.doesNotMatch(legacyForkPost, /@lituusfoundation\/micahs-augur-fork-0a1494868d97/u);
	assert.match(legacyForkPost, /\/learn\/fork\//u);
	assert.match(legacyForkPost, /MIGRATION CLOSED/u);
	assert.match(phaseOnePost, /ARCHIVED RECORD/u);
	assert.match(phaseOnePost, /not current instructions/u);
	assert.match(phaseOnePost, /\/learn\/fork\/moon-fork\//u);

	for (const [name, post] of [
		["testing past", testingPastPost],
		["one year", oneYearPost],
		["Micah's fork", micahForkPost],
	] as const) {
		assert.match(post, /MIGRATION CLOSED|ARCHIVED RECORD/u, `${name} needs an archive banner`);
		assert.match(post, /August 3, 2026/u, `${name} needs the finalized closure date`);
		assert.match(post, /not current guidance/u, `${name} needs a current-guidance warning`);
	}
});

test("uses the preserved local route for the Augur's Rising fork reference", () => {
	assert.doesNotMatch(augursRisingPost, /https:\/\/medium\.com\/p\/0a1494868d97/u);
	assert.match(augursRisingPost, /\]\(\/blog\/micahs-augur-fork\/\)/u);
	assert.ok(routeSources.has(canonicalPath("/blog/micahs-augur-fork/")));
});

test("keeps current and historical REP identities explicitly separated", () => {
	assert.match(repReference, /Current token/u);
	assert.match(repReference, /REPv2_Yes_1/u);
	assert.match(repReference, /earlier REPv2 and REPv1 contracts are now legacy contracts/u);
	assert.match(migrationArchive, /Current REP/u);
	assert.match(migrationArchive, /not current REP/u);
	assert.match(moonFork, /getTotalMigrated\(\)/u);
	assert.match(moonFork, /not ERC-20 `totalSupply\(\)` values/u);
});
