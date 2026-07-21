import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const skillPath = path.join(root, ".agents/skills/blogging/SKILL.md");

async function readSkill(): Promise<string> {
	return fs.readFile(skillPath, "utf8");
}

test("blogging skill stays concise and has an operational shape", async () => {
	const skill = await readSkill();
	const words = skill.trim().split(/\s+/u);
	assert.ok(
		words.length <= 350,
		`skill has ${words.length} words; expected at most 350`,
	);

	assert.match(skill, /^name: blogging$/mu);
	assert.match(skill, /^description: Use when .+blog.+$/mu);
	for (const heading of [
		"# Blog Content Integration and Validation",
		"## Authority",
		"## Workflow",
		"## Verification",
		"## Boundaries",
	]) {
		assert.ok(skill.includes(heading), `missing skill section: ${heading}`);
	}
});

test("blogging skill references existing mechanical authorities", async () => {
	const skill = await readSkill();
	const packageJson = JSON.parse(
		await fs.readFile(path.join(root, "package.json"), "utf8"),
	) as { scripts?: Record<string, string> };
	const referencedCommands = [...skill.matchAll(/npm run ([a-z0-9:-]+)/gu)].map(
		(match) => match[1],
	);

	for (const command of new Set(referencedCommands)) {
		assert.ok(
			packageJson.scripts?.[command],
			`missing package script ${command}`,
		);
	}
	for (const requiredCommand of [
		"lint:blog",
		"test:blog-lint",
		"typecheck:scripts",
		"typecheck",
		"lint",
		"build",
	]) {
		assert.ok(
			referencedCommands.includes(requiredCommand),
			`skill must route to npm run ${requiredCommand}`,
		);
	}
	assert.ok(
		skill.includes("npm run lint:blog -- --changed"),
		"ordinary blog work must use changed-post diagnostics",
	);

	for (const repositoryPath of [
		"src/content/blog",
		"src/content/config.ts",
		"docs/blog-feature.md",
	]) {
		assert.ok(
			skill.includes(repositoryPath),
			`skill must reference ${repositoryPath}`,
		);
		await fs.access(path.join(root, repositoryPath));
	}
	assert.equal(skill.includes("src/content/learn"), false);
});

test("AGENTS.md routes blog work to the skill exactly once", async () => {
	const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
	const routingLine =
		"- For blog content work, follow `.agents/skills/blogging/SKILL.md`.";
	assert.equal(
		agents.split("\n").filter((line) => line === routingLine).length,
		1,
		"AGENTS.md must contain exactly the minimal blog routing line",
	);
});
