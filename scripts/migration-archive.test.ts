import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const migrationPath = resolve(root, "src/content/learn/fork/migration.mdx");
const layoutPath = resolve(root, "src/layouts/MigrationGuideLayout.astro");
const migration = readFileSync(migrationPath, "utf8");
const layout = readFileSync(layoutPath, "utf8");

const historicalAssets = [
	"step-01.png",
	"step-02.png",
	"step-03.png",
	"step-04.png",
	"step-05.png",
	"step-06.png",
];

test("keeps the migration route as an archived historical record", () => {
	assert.match(migration, /contentType: historical-record/u);
	assert.match(migration, /historical: true/u);
	assert.match(migration, /status: archived/u);
	assert.match(migration, /presentation: historical-record/u);
	assert.match(migration, /MIGRATION CLOSED/u);
	assert.match(migration, /2026-08-03T01:00:59Z/u);
	assert.match(migration, /this page contains no active migration call to action/iu);
	assert.match(migration, /generalized migration-mechanics lesson.*Moon Fork retrospective/isu);
	assert.match(migration, /not available on this branch/iu);
});

test("preserves final evidence and unambiguous REP identities", () => {
	for (const value of [
		"0x49244BD018Ca9fd1f06ecC07B9E9De773246e5AA",
		"0x963EED85778CC23E2D4636Cd4f29eECDF9827E9e",
		"0x281171519Fb41540528398d8ED3EA257f0F32A9f",
		"0x1985365e9f78359a9B6AD760e32412f4a445E862",
		"0x221657776846890989a759BA2973e427DfF5C9bB",
		"0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D",
		"REPv2_Yes_1",
		"Kraken `AUGUR`",
		"25,677,103",
		"getTotalMigrated()",
	]) {
		assert.match(migration, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
	}

	assert.match(migration, /not a separate token or address/u);
	assert.match(migration, /not current REP/u);
});

test("keeps every historical screenshot and archived tool reference", () => {
	for (const asset of historicalAssets) {
		assert.ok(
			existsSync(resolve(root, "src/assets/learn/migration", asset)),
			`missing preserved migration asset: ${asset}`,
		);
	}

	assert.equal(
		(migration.match(/<Image /gu) ?? []).length,
		historicalAssets.length,
	);
	assert.match(migration, /archived (?:Augur Fork )?migration site/u);
	assert.match(migration, /archived reporting interface/u);
	assert.match(migration, /archived migration page/u);
});

test("uses an archive-only presentation and avoids unpublished site links", () => {
	assert.match(layout, /ARCHIVE · MIGRATION CLOSED/u);
	assert.match(layout, /Historical procedure and evidence only/u);
	assert.doesNotMatch(layout, /isMigrationOpen|isMigrationClosed|MIGRATION IMMINENT/u);
	assert.doesNotMatch(migration, /The migration deadline will be established/u);
	assert.doesNotMatch(migration, /If the window is still open/u);
	assert.doesNotMatch(migration, /migration instructions will be available/u);

	const internalLinks = new Set(
	[...migration.matchAll(/\]\((\/[^)]+)\)/gu)].map(([, path]) => path),
);
assert.deepEqual(internalLinks, new Set([
	"/blog/the-augur-fork-is-here/",
	"/learn/fork/",
	"/learn/fork/disputes-and-bonds/",
]));

for (const [route, source] of [
	["/blog/the-augur-fork-is-here/", "src/content/blog/the-augur-fork-is-here/index.mdx"],
	["/learn/fork/", "src/content/learn/fork/index.mdx"],
	["/learn/fork/disputes-and-bonds/", "src/content/learn/fork/disputes-and-bonds.mdx"],
] as const) {
	assert.ok(existsSync(resolve(root, source)), `missing source for ${route}`);
}
});
