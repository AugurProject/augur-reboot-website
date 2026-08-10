import type { APIContext } from "astro";
import { readWhitepaperSource } from "../../../lib/whitepaper-source";
import {
	getWhitepaperEditions,
	getWhitepaperEntries,
	type WhitepaperEdition,
} from "../../../lib/whitepaper";

export const prerender = true;

export async function getStaticPaths() {
	const paths = [];

	for (const edition of getWhitepaperEditions()) {
		const entries = await getWhitepaperEntries(edition);
		for (const entry of entries) {
			if (entry.slug === "index") continue;
			paths.push({
				params: { edition: edition.slug, slug: entry.slug },
				props: { edition, sourcePath: `${entry.slug}.md` },
			});
		}
	}

	return paths;
}

interface Props {
	edition: WhitepaperEdition;
	sourcePath: string;
}

export async function GET({ props }: APIContext) {
	const { edition, sourcePath } = props as Props;
	const source = await readWhitepaperSource(
		edition.sourceDirectory,
		sourcePath,
	);

	return new Response(new Uint8Array(source), {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
