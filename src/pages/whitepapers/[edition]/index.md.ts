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
		if (!entries.some(({ slug }) => slug === "index")) {
			throw new Error(`Missing index entry for ${edition.slug}`);
		}
		paths.push({ params: { edition: edition.slug }, props: { edition } });
	}

	return paths;
}

interface Props {
	edition: WhitepaperEdition;
}

export async function GET({ props }: APIContext) {
	const { edition } = props as Props;
	const source = await readWhitepaperSource(edition.sourceDirectory, "index.md");

	return new Response(new Uint8Array(source), {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
}
