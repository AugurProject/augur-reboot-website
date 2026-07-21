#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { changedBlogSlugs } from "./changed.ts";
import { type Diagnostic, lintBlog } from "./core.ts";

interface CliIo {
	cwd: string;
	env: NodeJS.ProcessEnv;
	stdout: (text: string) => void;
	stderr: (text: string) => void;
}

const HELP = `Usage: npm run lint:blog -- [--changed [--base <git-ref>]]

Without flags, validates the full blog corpus and reports observations for every post.
--changed reports observations only for blog posts changed in the working tree.
--base also includes changes from <git-ref>...HEAD (used by pull-request CI).
Mechanical collection-wide errors are always reported.
`;

function escapeCommandData(value: string): string {
	return value
		.replaceAll("%", "%25")
		.replaceAll("\r", "%0D")
		.replaceAll("\n", "%0A");
}

export function escapeCommandProperty(value: string): string {
	return escapeCommandData(value).replaceAll(":", "%3A").replaceAll(",", "%2C");
}

export function formatHuman(diagnostic: Diagnostic): string {
	return `${diagnostic.file}:${diagnostic.line}:${diagnostic.column} [${diagnostic.severity} ${diagnostic.ruleId}] ${diagnostic.message}`;
}

export function formatAnnotation(diagnostic: Diagnostic): string {
	const properties = [
		`file=${escapeCommandProperty(diagnostic.file)}`,
		`line=${diagnostic.line}`,
		`col=${diagnostic.column}`,
		`title=${escapeCommandProperty(diagnostic.ruleId)}`,
	].join(",");
	return `::${diagnostic.severity} ${properties}::${escapeCommandData(diagnostic.message)}`;
}

function parseArguments(args: string[]): {
	changed: boolean;
	base?: string;
	help?: boolean;
} {
	let changed = false;
	let base: string | undefined;
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--changed") changed = true;
		else if (argument === "--base") {
			base = args[index + 1];
			if (!base) throw new Error("--base requires a git ref");
			index += 1;
		} else if (argument === "--help" || argument === "-h")
			return { changed, base, help: true };
		else throw new Error(`Unknown argument: ${argument}`);
	}
	if (base && !changed) throw new Error("--base requires --changed");
	return { changed, base };
}

export async function runCli(args: string[], io: CliIo): Promise<number> {
	let options: ReturnType<typeof parseArguments>;
	try {
		options = parseArguments(args);
	} catch (error) {
		io.stderr(`${(error as Error).message}\n${HELP}`);
		return 2;
	}
	if (options.help) {
		io.stdout(HELP);
		return 0;
	}

	let observationSlugs: Set<string> | undefined;
	try {
		observationSlugs = options.changed
			? changedBlogSlugs(io.cwd, options.base)
			: undefined;
	} catch (error) {
		io.stderr(
			`Unable to determine changed blog posts: ${(error as Error).message}\n`,
		);
		return 2;
	}

	const diagnostics = await lintBlog({ root: io.cwd, observationSlugs });
	for (const diagnostic of diagnostics) {
		io.stdout(`${formatHuman(diagnostic)}\n`);
		if (io.env.GITHUB_ACTIONS === "true")
			io.stdout(`${formatAnnotation(diagnostic)}\n`);
	}
	const errors = diagnostics.filter((item) => item.severity === "error").length;
	const warnings = diagnostics.length - errors;
	io.stdout(
		`Blog diagnostics: ${errors} error(s), ${warnings} observation(s).\n`,
	);
	return errors > 0 ? 1 : 0;
}

const isMain =
	process.argv[1] !== undefined &&
	import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
	process.exitCode = await runCli(process.argv.slice(2), {
		cwd: process.cwd(),
		env: process.env,
		stdout: (text) => process.stdout.write(text),
		stderr: (text) => process.stderr.write(text),
	});
}
