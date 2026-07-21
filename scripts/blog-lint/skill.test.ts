import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");

test("blogging skill preserves its mechanical and human authority contract", async () => {
	const skill = await fs.readFile(
		path.join(root, ".agents/skills/blogging/SKILL.md"),
		"utf8",
	);
	const agents = await fs.readFile(path.join(root, "AGENTS.md"), "utf8");
	const packageJson = JSON.parse(
		await fs.readFile(path.join(root, "package.json"), "utf8"),
	) as { scripts?: Record<string, string> };
	const referencedCommands = [...skill.matchAll(/npm run ([a-z0-9:-]+)/gu)].map(
		(match) => match[1],
	);
	assert.ok(referencedCommands.includes("lint:blog"));
	assert.ok(referencedCommands.includes("test:blog-lint"));
	for (const command of new Set(referencedCommands))
		assert.ok(
			packageJson.scripts?.[command],
			`missing package script ${command}`,
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

	for (const clause of [
		"Humans own prose, facts, tone, approval, and publication decisions.",
		"`src/content/config.ts` is the runtime schema authority.",
		"`npm run lint:blog` is the mechanical diagnostics authority.",
		"Editorial writing and corpus style imitation are outside this integration skill.",
		"Never read neighboring posts to derive or imitate tone",
		"Require human-supplied copy or standalone explicit instructions",
		"`publishDate` is ordinary metadata. A future date does not schedule, hide, publish, or otherwise change post availability.",
		"Diagnostics observations are nonblocking measurements and never authorize automatic rewriting.",
		"Passing diagnostics, typechecks, previews, or builds validates integration only; it never approves or authorizes publication.",
		"Learn content is outside this workflow.",
	]) {
		assert.ok(skill.includes(clause), `missing authority clause: ${clause}`);
	}

	for (const contradictoryAuthorization of [
		"imitate neighboring posts unless",
		"unless the user explicitly requests that work",
		"read neighboring posts for tone when requested",
		"publishDate schedules publication",
		"future dates hide posts",
		"observations authorize automatic rewriting",
		"passing diagnostics authorizes publication",
		"a successful build approves publication",
		"Add a Learn Article",
	]) {
		assert.equal(
			skill.includes(contradictoryAuthorization),
			false,
			`contradictory authorization present: ${contradictoryAuthorization}`,
		);
	}

	const routingLine =
		"- For blog content work, follow `.agents/skills/blogging/SKILL.md`.";
	assert.equal(
		agents.split("\n").filter((line) => line === routingLine).length,
		1,
		"AGENTS.md must contain exactly the minimal blog routing line",
	);
});
