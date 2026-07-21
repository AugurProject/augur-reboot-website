import { execFileSync } from "node:child_process";

export interface FileChange {
	status: string;
	paths: string[];
}

export function parseNameStatus(output: string): FileChange[] {
	const tokens = output.split("\0").filter((token) => token !== "");
	const changes: FileChange[] = [];
	for (let index = 0; index < tokens.length; ) {
		let status = tokens[index++];
		let firstPath: string | undefined;
		const tab = status.indexOf("\t");
		if (tab >= 0) {
			firstPath = status.slice(tab + 1);
			status = status.slice(0, tab);
		}
		const pathCount = /^[RC]/u.test(status) ? 2 : 1;
		const paths =
			firstPath === undefined
				? tokens.slice(index, index + pathCount)
				: [firstPath, ...tokens.slice(index, index + pathCount - 1)];
		index += firstPath === undefined ? pathCount : pathCount - 1;
		if (paths.length === pathCount) changes.push({ status, paths });
	}
	return changes;
}

export function blogSlugsFromChanges(
	changes: Iterable<FileChange>,
): Set<string> {
	const slugs = new Set<string>();
	for (const change of changes) {
		for (const file of change.paths) {
			const normalized = file.replaceAll("\\", "/");
			const match = /^src\/content\/blog\/([^/]+)(?:\/|$)/u.exec(normalized);
			if (match) slugs.add(match[1]);
		}
	}
	return slugs;
}

function git(root: string, args: string[]): string {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
}

export function changedBlogSlugs(root: string, base?: string): Set<string> {
	const changes: FileChange[] = [];
	if (base)
		changes.push(
			...parseNameStatus(
				git(root, [
					"diff",
					"--name-status",
					"-z",
					"--find-renames",
					`${base}...HEAD`,
					"--",
				]),
			),
		);
	changes.push(
		...parseNameStatus(
			git(root, [
				"diff",
				"--name-status",
				"-z",
				"--find-renames",
				"HEAD",
				"--",
			]),
		),
	);
	const untracked = git(root, [
		"ls-files",
		"--others",
		"--exclude-standard",
		"-z",
	]);
	for (const file of untracked.split("\0").filter(Boolean))
		changes.push({ status: "?", paths: [file] });
	return blogSlugsFromChanges(changes);
}
