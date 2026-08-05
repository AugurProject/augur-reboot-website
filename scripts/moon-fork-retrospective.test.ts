import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const read = (file: string) =>
	readFileSync(path.join(repositoryRoot, file), "utf8");

const retrospective = read("src/content/learn/fork/moon-fork.mdx");
const topic = read("src/content/learn/fork/index.mdx");
const migrationArchive = read("src/content/learn/fork/migration.mdx");
const finalRecord = read("docs/moon-fork-final-record.md");

const requiredFinalValues = [
	"25,677,103",
	"0x963EED85778CC23E2D4636Cd4f29eECDF9827E9e",
	"0x281171519Fb41540528398d8ED3EA257f0F32A9f",
	"REPv2_Yes_1",
	"0xCf6A0A7826fa124B7705d6f3c675eAD76f1e540D",
	"6398081413681494610869400",
	"1786227400866527400056",
	"2026-08-03T01:00:59Z",
];

test("publishes the canonical Moon Fork case study in the Learn sequence", () => {
	assert.match(retrospective, /^title: "The Moon Fork"$/mu);
	assert.match(retrospective, /^topic: fork$/mu);
	assert.match(retrospective, /^order: 5$/mu);
	assert.match(retrospective, /^contentType: case-study$/mu);
	assert.match(retrospective, /^historical: true$/mu);
	assert.match(retrospective, /^status: available$/mu);
	assert.match(retrospective, /^presentation: case-study$/mu);

	assert.match(topic, /\/learn\/fork\/moon-fork\//u);
	assert.match(migrationArchive, /\/learn\/fork\/moon-fork\//u);
	assert.match(retrospective, /\/learn\/fork\/migration\//u);
	assert.match(retrospective, /\/learn\/fork\/migration-mechanics\//u);
});

test("matches the verified final record and identifies current REP unambiguously", () => {
	for (const value of requiredFinalValues) {
		assert.match(retrospective, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
		assert.match(finalRecord, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
	}

	assert.match(retrospective, /Winning outcome:\*\* index 1, \*\*Yes\*\*/u);
	assert.match(retrospective, /current REP/iu);
	assert.match(retrospective, /not ERC-20 `totalSupply\(\)` values/u);
});

test("separates observations, evidence boundaries, and interpretation", () => {
	assert.match(retrospective, /^## What the final record showed$/mu);
	assert.match(retrospective, /^## Expected behavior compared with observation$/mu);
	assert.match(retrospective, /^## Interpretation and lessons$/mu);
	assert.match(retrospective, /^## Implications for future Augur and Lituus work$/mu);
	assert.match(retrospective, /^## Sources and provenance$/mu);
	assert.match(retrospective, /These are interpretations, not additional protocol facts/u);
	assert.match(retrospective, /does not, by itself, prove the security or economics/u);
});

test("preserves lazy child creation and closed-migration safety", () => {
	assert.match(
		retrospective,
		/A child universe and its REP token are created only when migration first targets that outcome/u,
	);
	assert.match(retrospective, /Invalid \| No child existed at the evidence block/u);
	assert.match(retrospective, /migration deadline was `2026-08-03T01:00:59Z`/u);
	assert.match(retrospective, /it cannot be reopened/u);
	assert.doesNotMatch(retrospective, /MigrationCta|isMigrationOpen|MIGRATION IMMINENT/iu);
	assert.doesNotMatch(retrospective, /augurfork\.eth\.limo/iu);
	assert.doesNotMatch(
		retrospective,
		/creates? (?:one )?child universe for each possible outcome|created a new REP token for each universe/iu,
	);
});
