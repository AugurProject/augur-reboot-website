import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export async function readWhitepaperSource(
	sourceDirectory: string,
	relativePath: string,
) {
	const sourceRoot = resolve(process.cwd(), sourceDirectory);
	const candidate = resolve(sourceRoot, relativePath);
	const pathFromRoot = relative(sourceRoot, candidate);

	if (
		isAbsolute(pathFromRoot) ||
		pathFromRoot === ".." ||
		pathFromRoot.startsWith(`..${sep}`)
	) {
		throw new Error(`Whitepaper asset is outside the source directory: ${relativePath}`);
	}

	return readFile(candidate);
}
