import { type Dirent, promises as fs } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { isMap, isScalar, LineCounter, parseDocument } from "yaml";

export type Severity = "error" | "warning";

export interface Diagnostic {
	ruleId: string;
	severity: Severity;
	file: string;
	line: number;
	column: number;
	message: string;
}

export interface LintOptions {
	root: string;
	observationSlugs?: ReadonlySet<string>;
}

interface AstNode {
	type: string;
	value?: string;
	url?: string;
	alt?: string | null;
	name?: string;
	attributes?: Array<{ type?: string; name?: string; value?: unknown }>;
	children?: AstNode[];
	position?: { start: { line: number; column: number } };
	depth?: number;
	identifier?: string;
}

interface ParsedPost {
	slug: string;
	file: string;
	absoluteFile: string;
	postDirectory: string;
	body: string;
	bodyLineOffset: number;
	frontmatter: Record<string, unknown> | null;
	fieldLocations: Map<string, { line: number; column: number }>;
}

const BLOG_ROOT = "src/content/blog";
const REQUIRED_IMAGE_WIDTH = 1200;
const REQUIRED_IMAGE_HEIGHT = 630;
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_PARAGRAPH_WORDS = 90;
const MAX_SECTION_WORDS = 500;
const IMAGE_EXTENSIONS = new Set([
	".avif",
	".gif",
	".jpeg",
	".jpg",
	".png",
	".webp",
]);
const SKIP_WORD_NODES = new Set(["code", "inlineCode", "html", "mdxjsEsm"]);

function diagnostic(
	diagnostics: Diagnostic[],
	ruleId: string,
	severity: Severity,
	file: string,
	line: number,
	column: number,
	message: string,
): void {
	diagnostics.push({ ruleId, severity, file, line, column, message });
}

function toRepositoryPath(root: string, absolutePath: string): string {
	return path.relative(root, absolutePath).split(path.sep).join("/");
}

export function compareCodeUnits(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function isContainedPath(directory: string, target: string): boolean {
	const relative = path.relative(directory, target);
	return (
		relative === "" ||
		(!relative.startsWith(`..${path.sep}`) &&
			relative !== ".." &&
			!path.isAbsolute(relative))
	);
}

export function webpContainerError(bytes: Uint8Array): string | undefined {
	const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (buffer.length < 12)
		return "container is shorter than the 12-byte RIFF/WebP header";
	if (buffer.toString("ascii", 0, 4) !== "RIFF")
		return "missing RIFF signature";
	if (buffer.toString("ascii", 8, 12) !== "WEBP")
		return "missing WEBP form type";

	const declaredLength = buffer.readUInt32LE(4) + 8;
	if (declaredLength !== buffer.length) {
		return `RIFF declares ${declaredLength} bytes but the file contains ${buffer.length}`;
	}

	let offset = 12;
	let chunkCount = 0;
	while (offset < buffer.length) {
		if (buffer.length - offset < 8)
			return `truncated chunk header at byte ${offset}`;
		const chunkType = buffer.toString("ascii", offset, offset + 4);
		const chunkLength = buffer.readUInt32LE(offset + 4);
		const payloadEnd = offset + 8 + chunkLength;
		const paddedLength = chunkLength + (chunkLength % 2);
		const nextOffset = offset + 8 + paddedLength;
		if (nextOffset > buffer.length) {
			return `${chunkType} chunk at byte ${offset} declares ${chunkLength} payload bytes without complete payload and padding`;
		}
		if (chunkLength % 2 === 1 && buffer[payloadEnd] !== 0) {
			return `${chunkType} chunk at byte ${offset} has a nonzero padding byte`;
		}
		offset = nextOffset;
		chunkCount += 1;
	}
	return chunkCount === 0 ? "container has no chunks" : undefined;
}

function locationFor(
	node: AstNode,
	offset: number,
): { line: number; column: number } {
	return {
		line: (node.position?.start.line ?? 1) + offset,
		column: node.position?.start.column ?? 1,
	};
}

function walk(
	node: AstNode,
	visit: (node: AstNode, ancestors: AstNode[]) => void,
	ancestors: AstNode[] = [],
): void {
	visit(node, ancestors);
	for (const child of node.children ?? []) {
		walk(child, visit, [...ancestors, node]);
	}
}

function wordsIn(node: AstNode): number {
	let text = "";
	walk(node, (child, ancestors) => {
		if (
			child.type !== "text" ||
			ancestors.some((ancestor) => SKIP_WORD_NODES.has(ancestor.type))
		)
			return;
		text += ` ${child.value ?? ""}`;
	});
	return text.trim() === "" ? 0 : text.trim().split(/\s+/u).length;
}

function isStrictDate(value: unknown): value is string {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value))
		return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return (
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day
	);
}

function fieldLocation(
	post: ParsedPost,
	field: string,
): { line: number; column: number } {
	return post.fieldLocations.get(field) ?? { line: 1, column: 1 };
}

async function parsePost(
	root: string,
	slug: string,
	absoluteFile: string,
	diagnostics: Diagnostic[],
): Promise<ParsedPost> {
	const file = toRepositoryPath(root, absoluteFile);
	const source = await fs.readFile(absoluteFile, "utf8");
	const lines = source.split(/\r?\n/u);
	const fieldLocations = new Map<string, { line: number; column: number }>();
	if (lines[0] !== "---") {
		diagnostic(
			diagnostics,
			"BLOG002",
			"error",
			file,
			1,
			1,
			"Frontmatter must begin with an opening --- delimiter.",
		);
		return {
			slug,
			file,
			absoluteFile,
			postDirectory: path.dirname(absoluteFile),
			body: source,
			bodyLineOffset: 0,
			frontmatter: null,
			fieldLocations,
		};
	}

	const closingIndex = lines.findIndex(
		(line, index) => index > 0 && line === "---",
	);
	if (closingIndex < 0) {
		diagnostic(
			diagnostics,
			"BLOG002",
			"error",
			file,
			1,
			1,
			"Frontmatter is missing its closing --- delimiter.",
		);
		return {
			slug,
			file,
			absoluteFile,
			postDirectory: path.dirname(absoluteFile),
			body: "",
			bodyLineOffset: 0,
			frontmatter: null,
			fieldLocations,
		};
	}

	const yamlSource = lines.slice(1, closingIndex).join("\n");
	const lineCounter = new LineCounter();
	const document = parseDocument(yamlSource, { lineCounter, uniqueKeys: true });
	if (isMap(document.contents)) {
		for (const item of document.contents.items) {
			if (!isScalar(item.key) || typeof item.key.value !== "string") continue;
			const start = item.key.range?.[0];
			if (start === undefined) continue;
			const position = lineCounter.linePos(start);
			fieldLocations.set(item.key.value, {
				line: position.line + 1,
				column: position.col,
			});
		}
	}
	if (document.errors.length > 0) {
		for (const error of document.errors) {
			const position = lineCounter.linePos(error.pos[0]);
			diagnostic(
				diagnostics,
				"BLOG002",
				"error",
				file,
				position.line + 1,
				position.col,
				`Frontmatter YAML is not parseable: ${error.message.split("\n")[0]}`,
			);
		}
		return {
			slug,
			file,
			absoluteFile,
			postDirectory: path.dirname(absoluteFile),
			body: lines.slice(closingIndex + 1).join("\n"),
			bodyLineOffset: closingIndex + 1,
			frontmatter: null,
			fieldLocations,
		};
	}

	const value: unknown = document.toJS();
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		diagnostic(
			diagnostics,
			"BLOG002",
			"error",
			file,
			2,
			1,
			"Frontmatter must be a YAML mapping.",
		);
	}
	return {
		slug,
		file,
		absoluteFile,
		postDirectory: path.dirname(absoluteFile),
		body: lines.slice(closingIndex + 1).join("\n"),
		bodyLineOffset: closingIndex + 1,
		frontmatter:
			value !== null && typeof value === "object" && !Array.isArray(value)
				? (value as Record<string, unknown>)
				: null,
		fieldLocations,
	};
}

function validateFrontmatter(
	post: ParsedPost,
	diagnostics: Diagnostic[],
): void {
	if (!post.frontmatter) return;
	for (const field of ["title", "description", "author"] as const) {
		const value = post.frontmatter[field];
		if (typeof value !== "string" || value.trim() === "") {
			const location = fieldLocation(post, field);
			diagnostic(
				diagnostics,
				"BLOG003",
				"error",
				post.file,
				location.line,
				location.column,
				`${field} is required and must be a nonempty string.`,
			);
		}
	}

	for (const field of ["publishDate", "updatedDate"] as const) {
		const value = post.frontmatter[field];
		if (field === "updatedDate" && value === undefined) continue;
		if (!isStrictDate(value)) {
			const location = fieldLocation(post, field);
			diagnostic(
				diagnostics,
				"BLOG004",
				"error",
				post.file,
				location.line,
				location.column,
				`${field} must be a real date in YYYY-MM-DD form.`,
			);
		}
	}
	if (
		isStrictDate(post.frontmatter.publishDate) &&
		isStrictDate(post.frontmatter.updatedDate) &&
		post.frontmatter.updatedDate < post.frontmatter.publishDate
	) {
		const location = fieldLocation(post, "updatedDate");
		diagnostic(
			diagnostics,
			"BLOG005",
			"error",
			post.file,
			location.line,
			location.column,
			"updatedDate must be on or after publishDate.",
		);
	}

	if (post.frontmatter.tags !== undefined) {
		const tags = post.frontmatter.tags;
		const location = fieldLocation(post, "tags");
		if (
			!Array.isArray(tags) ||
			tags.some((tag) => typeof tag !== "string" || tag.trim() === "")
		) {
			diagnostic(
				diagnostics,
				"BLOG006",
				"error",
				post.file,
				location.line,
				location.column,
				"tags must be an array of nonempty strings when present.",
			);
		} else {
			const normalized = tags.map((tag) =>
				tag.trim().toLocaleLowerCase("en-US"),
			);
			if (new Set(normalized).size !== normalized.length) {
				diagnostic(
					diagnostics,
					"BLOG006",
					"error",
					post.file,
					location.line,
					location.column,
					"tags must not contain duplicates (comparison ignores case and surrounding whitespace).",
				);
			}
		}
	}
}

async function validateFeaturedImage(
	root: string,
	post: ParsedPost,
	diagnostics: Diagnostic[],
): Promise<void> {
	const absoluteImage = path.join(post.postDirectory, "featured-image.webp");
	const imageFile = toRepositoryPath(root, absoluteImage);
	try {
		const imageStat = await fs.lstat(absoluteImage);
		if (imageStat.isSymbolicLink() || !imageStat.isFile()) {
			diagnostic(
				diagnostics,
				"BLOG008",
				"error",
				imageFile,
				1,
				1,
				"featured-image.webp must be a regular file inside the post directory, not a symbolic link.",
			);
			return;
		}
		const [realPostDirectory, realImage] = await Promise.all([
			fs.realpath(post.postDirectory),
			fs.realpath(absoluteImage),
		]);
		if (!isContainedPath(realPostDirectory, realImage)) {
			diagnostic(
				diagnostics,
				"BLOG008",
				"error",
				imageFile,
				1,
				1,
				"featured-image.webp must resolve inside the post directory.",
			);
			return;
		}
		const bytes = await fs.readFile(realImage);
		const dimensions = imageSize(bytes);
		if (dimensions.type !== "webp") {
			diagnostic(
				diagnostics,
				"BLOG008",
				"error",
				imageFile,
				1,
				1,
				`featured-image.webp must contain a WebP image; detected ${dimensions.type ?? "unknown"}.`,
			);
			return;
		}
		const containerError = webpContainerError(bytes);
		if (containerError) {
			diagnostic(
				diagnostics,
				"BLOG008",
				"error",
				imageFile,
				1,
				1,
				`featured-image.webp has an incomplete or invalid RIFF/WebP container: ${containerError}.`,
			);
			return;
		}
		if (
			dimensions.width !== REQUIRED_IMAGE_WIDTH ||
			dimensions.height !== REQUIRED_IMAGE_HEIGHT
		) {
			diagnostic(
				diagnostics,
				"BLOG008",
				"error",
				imageFile,
				1,
				1,
				`featured-image.webp must be ${REQUIRED_IMAGE_WIDTH}x${REQUIRED_IMAGE_HEIGHT} pixels; found ${dimensions.width ?? "unknown"}x${dimensions.height ?? "unknown"}.`,
			);
		}
	} catch (error) {
		const code = (error as NodeJS.ErrnoException).code;
		if (code === "ENOENT") {
			diagnostic(
				diagnostics,
				"BLOG007",
				"error",
				post.file,
				1,
				1,
				"Post is missing required featured-image.webp.",
			);
		} else {
			diagnostic(
				diagnostics,
				"BLOG008",
				"error",
				imageFile,
				1,
				1,
				`featured-image.webp could not be read as a WebP image: ${(error as Error).message}`,
			);
		}
	}
}

type MdxAttribute =
	| { kind: "missing" }
	| { kind: "static"; value: string }
	| { kind: "unverifiable" };

function staticExpressionString(value: unknown): string | undefined {
	if (value === null || typeof value !== "object") return undefined;
	const expression = (
		value as {
			data?: {
				estree?: {
					body?: Array<{
						expression?: { type?: string; value?: unknown };
					}>;
				};
			};
		}
	).data?.estree?.body?.[0]?.expression;
	return expression?.type === "Literal" && typeof expression.value === "string"
		? expression.value
		: undefined;
}

function mdxAttribute(node: AstNode, name: string): MdxAttribute {
	const attribute = node.attributes?.find(
		(candidate) =>
			candidate.type === "mdxJsxAttribute" && candidate.name === name,
	);
	if (!attribute) return { kind: "missing" };
	if (typeof attribute.value === "string")
		return { kind: "static", value: attribute.value };
	const expressionValue = staticExpressionString(attribute.value);
	return expressionValue === undefined
		? { kind: "unverifiable" }
		: { kind: "static", value: expressionValue };
}

async function nestedMdxFiles(directory: string): Promise<string[]> {
	const files: string[] = [];
	for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await nestedMdxFiles(entryPath)));
		else if (
			(entry.isFile() || entry.isSymbolicLink()) &&
			entry.name.endsWith(".mdx")
		)
			files.push(entryPath);
	}
	return files;
}

async function validateAst(
	post: ParsedPost,
	diagnostics: Diagnostic[],
	includeObservations: boolean,
): Promise<void> {
	let tree: AstNode;
	try {
		tree = unified()
			.use(remarkParse)
			.use(remarkMdx)
			.parse(post.body) as AstNode;
	} catch (error) {
		const parseError = error as Error & {
			line?: number;
			column?: number;
			place?: {
				line?: number;
				column?: number;
				start?: { line?: number; column?: number };
			};
		};
		const line =
			parseError.place?.line ??
			parseError.place?.start?.line ??
			parseError.line ??
			1;
		const column =
			parseError.place?.column ??
			parseError.place?.start?.column ??
			parseError.column ??
			1;
		diagnostic(
			diagnostics,
			"BLOG012",
			"error",
			post.file,
			post.bodyLineOffset + line,
			column,
			`MDX could not be parsed, so image integrity checks could not run: ${parseError.message}`,
		);
		return;
	}

	const definitions = new Map<string, string>();
	walk(tree, (node) => {
		if (node.type === "definition" && node.identifier && node.url)
			definitions.set(node.identifier.toLocaleLowerCase("en-US"), node.url);
	});

	const checkedTargets = new Set<string>();
	const checkTarget = async (
		node: AstNode,
		url: string,
		alt: string | null | undefined,
	): Promise<void> => {
		const location = locationFor(node, post.bodyLineOffset);
		if ((alt ?? "").trim() === "") {
			diagnostic(
				diagnostics,
				"BLOG010",
				"error",
				post.file,
				location.line,
				location.column,
				"Images must have nonempty alt text.",
			);
		}
		if (/^http:\/\//iu.test(url)) {
			if (includeObservations)
				diagnostic(
					diagnostics,
					"BLOG104",
					"warning",
					post.file,
					location.line,
					location.column,
					`External URL uses HTTP: ${url}`,
				);
			return;
		}
		if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/iu.test(url)) return;
		let target: string;
		try {
			target = decodeURIComponent(url.split(/[?#]/u, 1)[0]);
		} catch {
			diagnostic(
				diagnostics,
				"BLOG009",
				"error",
				post.file,
				location.line,
				location.column,
				`Relative image target is not valid URI encoding: ${url}`,
			);
			return;
		}
		const absoluteTarget = path.resolve(post.postDirectory, target);
		if (!isContainedPath(post.postDirectory, absoluteTarget)) {
			diagnostic(
				diagnostics,
				"BLOG009",
				"error",
				post.file,
				location.line,
				location.column,
				`Relative image target must stay inside the post directory: ${url}`,
			);
			return;
		}
		if (checkedTargets.has(absoluteTarget)) return;
		checkedTargets.add(absoluteTarget);
		try {
			await fs.lstat(absoluteTarget);
			const [realPostDirectory, realTarget] = await Promise.all([
				fs.realpath(post.postDirectory),
				fs.realpath(absoluteTarget),
			]);
			if (!isContainedPath(realPostDirectory, realTarget)) {
				diagnostic(
					diagnostics,
					"BLOG009",
					"error",
					post.file,
					location.line,
					location.column,
					`Relative image target resolves outside the post directory: ${url}`,
				);
				return;
			}
			const stat = await fs.stat(realTarget);
			if (!stat.isFile()) throw new Error("target is not a file");
		} catch (error) {
			if ((error as Error).message === "target is not a file") {
				diagnostic(
					diagnostics,
					"BLOG009",
					"error",
					post.file,
					location.line,
					location.column,
					`Relative image target is not a file: ${url}`,
				);
			} else {
				diagnostic(
					diagnostics,
					"BLOG009",
					"error",
					post.file,
					location.line,
					location.column,
					`Relative image target does not exist or cannot be resolved: ${url}`,
				);
			}
		}
	};

	const pending: Promise<void>[] = [];
	walk(tree, (node) => {
		if (node.type === "image" && node.url)
			pending.push(checkTarget(node, node.url, node.alt));
		if (node.type === "imageReference" && node.identifier) {
			const url = definitions.get(node.identifier.toLocaleLowerCase("en-US"));
			if (url) pending.push(checkTarget(node, url, node.alt));
			else if ((node.alt ?? "").trim() === "") {
				const location = locationFor(node, post.bodyLineOffset);
				diagnostic(
					diagnostics,
					"BLOG010",
					"error",
					post.file,
					location.line,
					location.column,
					"Images must have nonempty alt text.",
				);
			}
		}
		if (
			(node.type === "mdxJsxFlowElement" ||
				node.type === "mdxJsxTextElement") &&
			(node.name === "img" || node.name === "Image")
		) {
			const location = locationFor(node, post.bodyLineOffset);
			const src = mdxAttribute(node, "src");
			const alt = mdxAttribute(node, "alt");
			if (src.kind === "missing" || src.kind === "unverifiable") {
				diagnostic(
					diagnostics,
					"BLOG013",
					"error",
					post.file,
					location.line,
					location.column,
					src.kind === "missing"
						? "MDX JSX images must have a statically verifiable src attribute."
						: "MDX JSX image src expressions must be string literals so containment and existence can be verified without executing code.",
				);
			} else {
				pending.push(checkTarget(node, src.value, "verified"));
			}
			if (
				alt.kind === "missing" ||
				(alt.kind === "static" && alt.value.trim() === "")
			) {
				diagnostic(
					diagnostics,
					"BLOG010",
					"error",
					post.file,
					location.line,
					location.column,
					"Images must have nonempty alt text.",
				);
			} else if (alt.kind === "unverifiable") {
				diagnostic(
					diagnostics,
					"BLOG013",
					"error",
					post.file,
					location.line,
					location.column,
					"MDX JSX image alt expressions must be string literals so nonempty alt text can be verified without executing code.",
				);
			}
		}
		if (
			includeObservations &&
			(node.type === "link" || node.type === "definition") &&
			node.url &&
			/^http:\/\//iu.test(node.url)
		) {
			const location = locationFor(node, post.bodyLineOffset);
			diagnostic(
				diagnostics,
				"BLOG104",
				"warning",
				post.file,
				location.line,
				location.column,
				`External URL uses HTTP: ${node.url}`,
			);
		}
		if (includeObservations && node.type === "paragraph") {
			const count = wordsIn(node);
			if (count > MAX_PARAGRAPH_WORDS) {
				const location = locationFor(node, post.bodyLineOffset);
				diagnostic(
					diagnostics,
					"BLOG101",
					"warning",
					post.file,
					location.line,
					location.column,
					`Paragraph contains ${count} words (observation threshold: >${MAX_PARAGRAPH_WORDS}).`,
				);
			}
		}
	});
	await Promise.all(pending);

	if (includeObservations) {
		const children = tree.children ?? [];
		let segmentStart = 0;
		for (let index = 0; index <= children.length; index += 1) {
			if (index < children.length && children[index].type !== "heading")
				continue;
			const segment = children.slice(segmentStart, index);
			const count = segment.reduce((total, node) => total + wordsIn(node), 0);
			if (count > MAX_SECTION_WORDS) {
				const anchor = segment[0] ?? tree;
				const location = locationFor(anchor, post.bodyLineOffset);
				diagnostic(
					diagnostics,
					"BLOG102",
					"warning",
					post.file,
					location.line,
					location.column,
					`Section contains ${count} words without a subheading (observation threshold: >${MAX_SECTION_WORDS}).`,
				);
			}
			segmentStart = index;
		}
	}
}

async function observeLargeImages(
	root: string,
	post: ParsedPost,
	diagnostics: Diagnostic[],
): Promise<void> {
	for (const entry of (
		await fs.readdir(post.postDirectory, { withFileTypes: true })
	).sort((left, right) => compareCodeUnits(left.name, right.name))) {
		if (
			!entry.isFile() ||
			!IMAGE_EXTENSIONS.has(path.extname(entry.name).toLocaleLowerCase("en-US"))
		)
			continue;
		const absoluteFile = path.join(post.postDirectory, entry.name);
		const stat = await fs.stat(absoluteFile);
		if (stat.size > MAX_IMAGE_BYTES) {
			diagnostic(
				diagnostics,
				"BLOG103",
				"warning",
				toRepositoryPath(root, absoluteFile),
				1,
				1,
				`Image is ${stat.size} bytes (observation threshold: >${MAX_IMAGE_BYTES} bytes / 1 MiB).`,
			);
		}
	}
}

export function duplicatePostIdentifiers(names: Iterable<string>): string[][] {
	const identifiers = new Map<string, string[]>();
	for (const name of names) {
		const identifier = name.toLocaleLowerCase("en-US");
		identifiers.set(identifier, [...(identifiers.get(identifier) ?? []), name]);
	}
	return [...identifiers.values()].filter((group) => group.length > 1);
}

export function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
	return [...diagnostics].sort(
		(left, right) =>
			compareCodeUnits(left.file, right.file) ||
			left.line - right.line ||
			left.column - right.column ||
			compareCodeUnits(left.ruleId, right.ruleId) ||
			compareCodeUnits(left.message, right.message),
	);
}

export async function lintBlog(options: LintOptions): Promise<Diagnostic[]> {
	const root = path.resolve(options.root);
	const blogRoot = path.join(root, BLOG_ROOT);
	const diagnostics: Diagnostic[] = [];
	let entries: Dirent<string>[];
	try {
		entries = await fs.readdir(blogRoot, { withFileTypes: true });
	} catch (error) {
		diagnostic(
			diagnostics,
			"BLOG001",
			"error",
			BLOG_ROOT,
			1,
			1,
			`Blog directory cannot be read: ${(error as Error).message}`,
		);
		return diagnostics;
	}

	const posts: ParsedPost[] = [];
	const identifierNames: string[] = [];
	for (const entry of entries.sort((left, right) =>
		compareCodeUnits(left.name, right.name),
	)) {
		const entryPath = path.join(blogRoot, entry.name);
		if (!entry.isDirectory()) {
			diagnostic(
				diagnostics,
				"BLOG001",
				"error",
				toRepositoryPath(root, entryPath),
				1,
				1,
				"Blog root may contain only post directories.",
			);
			continue;
		}
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(entry.name)) {
			diagnostic(
				diagnostics,
				"BLOG001",
				"error",
				toRepositoryPath(root, entryPath),
				1,
				1,
				"Post directory names must be lowercase kebab-case.",
			);
		}
		identifierNames.push(entry.name);
		const indexFile = path.join(entryPath, "index.mdx");
		try {
			const stat = await fs.lstat(indexFile);
			if (stat.isSymbolicLink() || !stat.isFile()) {
				diagnostic(
					diagnostics,
					"BLOG001",
					"error",
					toRepositoryPath(root, indexFile),
					1,
					1,
					"Post index.mdx must be a regular file, not a symbolic link.",
				);
			} else {
				posts.push(await parsePost(root, entry.name, indexFile, diagnostics));
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				diagnostic(
					diagnostics,
					"BLOG001",
					"error",
					toRepositoryPath(root, entryPath),
					1,
					1,
					"Post directory must contain index.mdx.",
				);
			} else throw error;
		}
		for (const mdxFile of await nestedMdxFiles(entryPath)) {
			if (mdxFile === indexFile) continue;
			diagnostic(
				diagnostics,
				"BLOG001",
				"error",
				toRepositoryPath(root, mdxFile),
				1,
				1,
				"Each post directory must have a single index.mdx entry.",
			);
		}
	}

	for (const names of duplicatePostIdentifiers(identifierNames)) {
		for (const name of names) {
			diagnostic(
				diagnostics,
				"BLOG011",
				"error",
				`${BLOG_ROOT}/${name}`,
				1,
				1,
				`Duplicate case-insensitive post identifier: ${names.join(", ")}.`,
			);
		}
	}

	for (const post of posts) {
		validateFrontmatter(post, diagnostics);
		await validateFeaturedImage(root, post, diagnostics);
		const includeObservations =
			options.observationSlugs === undefined ||
			options.observationSlugs.has(post.slug);
		await validateAst(post, diagnostics, includeObservations);
		if (includeObservations) await observeLargeImages(root, post, diagnostics);
	}
	return sortDiagnostics(diagnostics);
}
