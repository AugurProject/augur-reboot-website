import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
	blogSlugsFromChanges,
	changedBlogSlugs,
	parseNameStatus,
} from "./changed.ts";

test("parses modified, deleted, renamed, and untracked name-status records", () => {
	const changes = parseNameStatus(
		"M\0src/content/blog/edited/index.mdx\0D\0src/content/blog/deleted/index.mdx\0R100\0src/content/blog/old/index.mdx\0src/content/blog/new/index.mdx\0?\0src/content/blog/untracked/featured-image.webp\0",
	);
	assert.deepEqual(changes, [
		{ status: "M", paths: ["src/content/blog/edited/index.mdx"] },
		{ status: "D", paths: ["src/content/blog/deleted/index.mdx"] },
		{
			status: "R100",
			paths: [
				"src/content/blog/old/index.mdx",
				"src/content/blog/new/index.mdx",
			],
		},
		{ status: "?", paths: ["src/content/blog/untracked/featured-image.webp"] },
	]);
});

test("maps blog entries and assets while excluding Learn and unrelated files", () => {
	const slugs = blogSlugsFromChanges([
		{ status: "M", paths: ["src/content/blog/post/index.mdx"] },
		{ status: "M", paths: ["src/content/blog/asset-post/diagram.webp"] },
		{ status: "D", paths: ["src/content/blog/deleted/index.mdx"] },
		{
			status: "R100",
			paths: [
				"src/content/blog/old/index.mdx",
				"src/content/blog/new/index.mdx",
			],
		},
		{ status: "?", paths: ["src/content/blog/untracked/featured-image.webp"] },
		{ status: "M", paths: ["src/content/learn/fork/article.mdx"] },
		{ status: "M", paths: ["docs/blog-feature.md"] },
	]);
	assert.deepEqual([...slugs].sort(), [
		"asset-post",
		"deleted",
		"new",
		"old",
		"post",
		"untracked",
	]);
});

test("discovers untracked blog assets from git without selecting Learn", async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "blog-changes-"));
	try {
		execFileSync("git", ["init", "-q"], { cwd: root });
		execFileSync("git", ["config", "user.email", "test@example.com"], {
			cwd: root,
		});
		execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
		await fs.writeFile(path.join(root, "tracked.txt"), "tracked\n");
		execFileSync("git", ["add", "tracked.txt"], { cwd: root });
		execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
		await fs.mkdir(path.join(root, "src/content/blog/new-post"), {
			recursive: true,
		});
		await fs.writeFile(
			path.join(root, "src/content/blog/new-post/featured-image.webp"),
			"fixture",
		);
		await fs.mkdir(path.join(root, "src/content/learn/topic"), {
			recursive: true,
		});
		await fs.writeFile(
			path.join(root, "src/content/learn/topic/article.mdx"),
			"fixture",
		);
		assert.deepEqual([...changedBlogSlugs(root)], ["new-post"]);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
