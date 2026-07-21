import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
	compareCodeUnits,
	duplicatePostIdentifiers,
	lintBlog,
	sortDiagnostics,
	webpContainerError,
} from "./core.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const fixtureRoot = path.join(repositoryRoot, "tests/fixtures/blog-lint");

async function makeCorpus(): Promise<{ root: string; post: string }> {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "blog-lint-"));
	const post = path.join(root, "src/content/blog/fixture-post");
	await fs.mkdir(path.dirname(post), { recursive: true });
	await fs.cp(path.join(fixtureRoot, "valid-post"), post, { recursive: true });
	return { root, post };
}

async function cleanup(root: string): Promise<void> {
	await fs.rm(root, { recursive: true, force: true });
}

function pngHeader(width: number, height: number): Buffer {
	const bytes = Buffer.alloc(24);
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
	bytes.writeUInt32BE(13, 8);
	bytes.write("IHDR", 12, "ascii");
	bytes.writeUInt32BE(width, 16);
	bytes.writeUInt32BE(height, 20);
	return bytes;
}

test("accepts a mechanically valid post, including a future publishDate", async () => {
	const { root } = await makeCorpus();
	try {
		assert.deepEqual(await lintBlog({ root }), []);
	} finally {
		await cleanup(root);
	}
});

test("detects duplicate case-insensitive post identifiers deterministically", () => {
	assert.deepEqual(
		duplicatePostIdentifiers(["other", "duplicate", "DUPLICATE"]),
		[["duplicate", "DUPLICATE"]],
	);
});

test("uses explicit code-unit ordering for diagnostics", () => {
	assert.deepEqual(["a", "ä", "Z"].sort(compareCodeUnits), ["Z", "a", "ä"]);
	const diagnostics = ["a.mdx", "ä.mdx", "Z.mdx"].map((file) => ({
		ruleId: "BLOG001",
		severity: "error" as const,
		file,
		line: 1,
		column: 1,
		message: "fixture",
	}));
	assert.deepEqual(
		sortDiagnostics(diagnostics).map((item) => item.file),
		["Z.mdx", "a.mdx", "ä.mdx"],
	);
});

test("reports entry, frontmatter, date, tag, and featured-image rules", async () => {
	const { root, post } = await makeCorpus();
	try {
		await fs.writeFile(
			path.join(root, "src/content/blog/stray.mdx"),
			"---\n---\n",
		);
		await fs.mkdir(path.join(root, "src/content/blog/Bad Slug"));
		const brokenPost = path.join(root, "src/content/blog/broken-post");
		await fs.mkdir(brokenPost);
		await fs.writeFile(
			path.join(brokenPost, "index.mdx"),
			"---\ntitle: [broken\n---\n",
		);
		await fs.writeFile(
			path.join(post, "index.mdx"),
			`---
title: ""
description: 7
author: "Author"
publishDate: 2025-02-30
updatedDate: 2025-01-01
tags: ["same", " Same "]
---
`,
		);
		await fs.copyFile(
			path.join(fixtureRoot, "wrong-size.webp"),
			path.join(post, "featured-image.webp"),
		);
		const diagnostics = await lintBlog({ root });
		const rules = new Set(diagnostics.map((item) => item.ruleId));
		for (const rule of [
			"BLOG001",
			"BLOG002",
			"BLOG003",
			"BLOG004",
			"BLOG006",
			"BLOG007",
			"BLOG008",
		])
			assert.ok(rules.has(rule), `expected ${rule}`);
		assert.equal(
			diagnostics.some((item) => /future/iu.test(item.message)),
			false,
		);
	} finally {
		await cleanup(root);
	}
});

test("locates validation errors on quoted YAML keys", async () => {
	const { root, post } = await makeCorpus();
	try {
		const source = await fs.readFile(path.join(post, "index.mdx"), "utf8");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			source.replace('title: "Fixture post"', '"title": ""'),
		);
		const diagnostic = (await lintBlog({ root })).find(
			(item) => item.ruleId === "BLOG003",
		);
		assert.deepEqual(
			diagnostic && { line: diagnostic.line, column: diagnostic.column },
			{ line: 2, column: 1 },
		);
	} finally {
		await cleanup(root);
	}
});

test("rejects wrong-format, truncated-container, and malformed featured images", async () => {
	const { root, post } = await makeCorpus();
	try {
		const featuredImage = path.join(post, "featured-image.webp");
		const validWebp = await fs.readFile(
			path.join(fixtureRoot, "valid-post/featured-image.webp"),
		);
		assert.equal(webpContainerError(validWebp), undefined);

		const chunkOverrun = Buffer.alloc(20);
		chunkOverrun.write("RIFF", 0, "ascii");
		chunkOverrun.writeUInt32LE(12, 4);
		chunkOverrun.write("WEBP", 8, "ascii");
		chunkOverrun.write("VP8 ", 12, "ascii");
		chunkOverrun.writeUInt32LE(1, 16);
		assert.match(
			webpContainerError(chunkOverrun) ?? "",
			/payload and padding/u,
		);

		const nonzeroPadding = Buffer.alloc(22);
		nonzeroPadding.write("RIFF", 0, "ascii");
		nonzeroPadding.writeUInt32LE(14, 4);
		nonzeroPadding.write("WEBP", 8, "ascii");
		nonzeroPadding.write("VP8 ", 12, "ascii");
		nonzeroPadding.writeUInt32LE(1, 16);
		nonzeroPadding[21] = 1;
		assert.match(webpContainerError(nonzeroPadding) ?? "", /nonzero padding/u);

		await fs.writeFile(featuredImage, pngHeader(1200, 630));
		let diagnostics = await lintBlog({ root });
		assert.ok(
			diagnostics.some(
				(item) =>
					item.ruleId === "BLOG008" && /detected png/u.test(item.message),
			),
		);

		const truncatedWebp = validWebp.subarray(0, 30);
		assert.match(webpContainerError(truncatedWebp) ?? "", /RIFF declares/u);
		await fs.writeFile(featuredImage, truncatedWebp);
		diagnostics = await lintBlog({ root });
		assert.ok(
			diagnostics.some(
				(item) =>
					item.ruleId === "BLOG008" && /RIFF declares/u.test(item.message),
			),
		);

		await fs.writeFile(featuredImage, Buffer.from("RIFF"));
		diagnostics = await lintBlog({ root });
		assert.ok(
			diagnostics.some(
				(item) => item.ruleId === "BLOG008" && /WebP image/u.test(item.message),
			),
		);
	} finally {
		await cleanup(root);
	}
});

test("rejects featured-image and relative-asset symlink escapes", async (context) => {
	const { root, post } = await makeCorpus();
	try {
		const outsideDirectory = path.join(root, "outside");
		await fs.mkdir(outsideDirectory);
		const outsideImage = path.join(outsideDirectory, "outside.webp");
		await fs.copyFile(
			path.join(fixtureRoot, "valid-post/featured-image.webp"),
			outsideImage,
		);
		try {
			await fs.rm(path.join(post, "featured-image.webp"));
			await fs.symlink(outsideImage, path.join(post, "featured-image.webp"));
			await fs.symlink(outsideImage, path.join(post, "escaped.webp"));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "EPERM") {
				context.skip("symbolic links are not permitted on this platform");
				return;
			}
			throw error;
		}
		const source = await fs.readFile(path.join(post, "index.mdx"), "utf8");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			`${source}\n![Escaped](./escaped.webp)\n`,
		);
		const diagnostics = await lintBlog({ root });
		assert.ok(
			diagnostics.some(
				(item) =>
					item.ruleId === "BLOG008" && /symbolic link/u.test(item.message),
			),
		);
		assert.ok(
			diagnostics.some(
				(item) =>
					item.ruleId === "BLOG009" && /resolves outside/u.test(item.message),
			),
		);
	} finally {
		await cleanup(root);
	}
});

test("rejects index and alternate MDX symlink escapes", async (context) => {
	const { root, post } = await makeCorpus();
	try {
		const outsideDirectory = path.join(root, "outside-mdx");
		await fs.mkdir(outsideDirectory);
		const outsideMdx = path.join(outsideDirectory, "outside.mdx");
		await fs.copyFile(path.join(post, "index.mdx"), outsideMdx);
		try {
			await fs.rm(path.join(post, "index.mdx"));
			await fs.symlink(outsideMdx, path.join(post, "index.mdx"));
			await fs.symlink(outsideMdx, path.join(post, "alternate.mdx"));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "EPERM") {
				context.skip("symbolic links are not permitted on this platform");
				return;
			}
			throw error;
		}
		const diagnostics = await lintBlog({ root });
		assert.ok(
			diagnostics.some(
				(item) =>
					item.ruleId === "BLOG001" &&
					item.file.endsWith("/index.mdx") &&
					/symbolic link/u.test(item.message),
			),
		);
		assert.ok(
			diagnostics.some(
				(item) =>
					item.ruleId === "BLOG001" && item.file.endsWith("/alternate.mdx"),
			),
		);
	} finally {
		await cleanup(root);
	}
});

test("reports MDX parse failures as collection-wide blocking errors", async () => {
	const { root, post } = await makeCorpus();
	try {
		const source = await fs.readFile(path.join(post, "index.mdx"), "utf8");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			`${source.split("---", 3).join("---")}\n<Image`,
		);
		const diagnostics = await lintBlog({
			root,
			observationSlugs: new Set(),
		});
		const parseDiagnostic = diagnostics.find(
			(item) => item.ruleId === "BLOG012",
		);
		assert.equal(parseDiagnostic?.severity, "error");
		assert.ok((parseDiagnostic?.line ?? 0) > 1);
	} finally {
		await cleanup(root);
	}
});

test("reports date ordering independently of date syntax", async () => {
	const { root, post } = await makeCorpus();
	try {
		const source = await fs.readFile(path.join(post, "index.mdx"), "utf8");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			source.replace("updatedDate: 2099-12-31", "updatedDate: 2099-12-30"),
		);
		const diagnostics = await lintBlog({ root });
		assert.ok(
			diagnostics.some((item) => item.ruleId === "BLOG005" && item.line === 6),
		);
	} finally {
		await cleanup(root);
	}
});

test("uses the MDX AST for image containment, existence, alt text, and observations", async () => {
	const { root, post } = await makeCorpus();
	try {
		const words = Array.from(
			{ length: 501 },
			(_, index) => `word${index}`,
		).join(" ");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			`---
title: "Fixture"
description: "Fixture"
author: "Author"
publishDate: 2025-01-01
---

## Long section

${words}

![](../outside.webp)
![Missing](./missing.webp)

[Insecure](http://example.com)
`,
		);
		await fs.writeFile(
			path.join(post, "large-image.png"),
			Buffer.alloc(1024 * 1024 + 1),
		);
		const diagnostics = await lintBlog({ root });
		const rules = new Set(diagnostics.map((item) => item.ruleId));
		for (const rule of [
			"BLOG009",
			"BLOG010",
			"BLOG101",
			"BLOG102",
			"BLOG103",
			"BLOG104",
		])
			assert.ok(rules.has(rule), `expected ${rule}`);
		assert.deepEqual(diagnostics, sortDiagnostics(diagnostics));
	} finally {
		await cleanup(root);
	}
});

test("checks static MDX JSX expressions and blocks unverifiable image attributes", async () => {
	const { root, post } = await makeCorpus();
	try {
		const source = await fs.readFile(path.join(post, "index.mdx"), "utf8");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			`${source}\n<Image src={"../outside.webp"} alt={""} />\n<Image src={asset} alt={description} />\n`,
		);
		const diagnostics = await lintBlog({ root });
		assert.ok(diagnostics.some((item) => item.ruleId === "BLOG009"));
		assert.ok(diagnostics.some((item) => item.ruleId === "BLOG010"));
		assert.equal(
			diagnostics.filter((item) => item.ruleId === "BLOG013").length,
			2,
		);
		assert.ok(
			diagnostics
				.filter((item) => item.ruleId === "BLOG013")
				.every((item) => /without executing code/u.test(item.message)),
		);
	} finally {
		await cleanup(root);
	}
});

test("limits observations, but not errors, to selected changed posts", async () => {
	const { root, post } = await makeCorpus();
	try {
		const source = await fs.readFile(path.join(post, "index.mdx"), "utf8");
		await fs.writeFile(
			path.join(post, "index.mdx"),
			source
				.replace("A short paragraph", `${"word ".repeat(91)}.`)
				.replace('title: "Fixture post"', 'title: ""'),
		);
		const diagnostics = await lintBlog({ root, observationSlugs: new Set() });
		assert.ok(diagnostics.some((item) => item.ruleId === "BLOG003"));
		assert.equal(
			diagnostics.some((item) => item.severity === "warning"),
			false,
		);
	} finally {
		await cleanup(root);
	}
});
