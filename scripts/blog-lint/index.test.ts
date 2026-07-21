import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import type { Diagnostic } from "./core.ts";
import {
	escapeCommandProperty,
	formatAnnotation,
	formatHuman,
	runCli,
} from "./index.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

async function makeCorpus(): Promise<{ root: string; indexFile: string }> {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "blog-cli-"));
	const post = path.join(root, "src/content/blog/fixture-post");
	await fs.mkdir(path.dirname(post), { recursive: true });
	await fs.cp(
		path.join(repositoryRoot, "tests/fixtures/blog-lint/valid-post"),
		post,
		{ recursive: true },
	);
	return { root, indexFile: path.join(post, "index.mdx") };
}

const sample: Diagnostic = {
	ruleId: "BLOG999",
	severity: "error",
	file: "src/content/blog/a:b,c%/index.mdx",
	line: 4,
	column: 2,
	message: "first%\nsecond\rline",
};

test("formats stable human-readable diagnostics", () => {
	assert.equal(
		formatHuman(sample),
		"src/content/blog/a:b,c%/index.mdx:4:2 [error BLOG999] first%\nsecond\rline",
	);
});

test("escapes GitHub annotation properties and message data", () => {
	assert.equal(escapeCommandProperty("a:b,c%\n"), "a%3Ab%2Cc%25%0A");
	assert.equal(
		formatAnnotation(sample),
		"::error file=src/content/blog/a%3Ab%2Cc%25/index.mdx,line=4,col=2,title=BLOG999::first%25%0Asecond%0Dline",
	);
});

test("warnings do not fail, errors do, and GitHub mode emits native annotations", async () => {
	const { root, indexFile } = await makeCorpus();
	try {
		const original = await fs.readFile(indexFile, "utf8");
		await fs.writeFile(
			indexFile,
			original.replace("https://example.com", "http://example.com"),
		);
		let output = "";
		const warningExit = await runCli([], {
			cwd: root,
			env: { GITHUB_ACTIONS: "true" },
			stdout: (text) => {
				output += text;
			},
			stderr: () => {},
		});
		assert.equal(warningExit, 0);
		assert.match(output, /\[warning BLOG104\]/u);
		assert.match(output, /::warning file=/u);

		await fs.writeFile(
			indexFile,
			original.replace('title: "Fixture post"', 'title: ""'),
		);
		const errorExit = await runCli([], {
			cwd: root,
			env: {},
			stdout: () => {},
			stderr: () => {},
		});
		assert.equal(errorExit, 1);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});

test("MDX parse failures produce exit code 1", async () => {
	const { root, indexFile } = await makeCorpus();
	try {
		const source = await fs.readFile(indexFile, "utf8");
		await fs.writeFile(indexFile, `${source}\n<Image`);
		let output = "";
		const exit = await runCli([], {
			cwd: root,
			env: {},
			stdout: (text) => {
				output += text;
			},
			stderr: () => {},
		});
		assert.equal(exit, 1);
		assert.match(output, /\[error BLOG012\]/u);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});

test("invalid CLI arguments use exit code 2", async () => {
	let stderr = "";
	const exit = await runCli(["--base", "main"], {
		cwd: repositoryRoot,
		env: {},
		stdout: () => {},
		stderr: (text) => {
			stderr += text;
		},
	});
	assert.equal(exit, 2);
	assert.match(stderr, /--base requires --changed/u);
});
