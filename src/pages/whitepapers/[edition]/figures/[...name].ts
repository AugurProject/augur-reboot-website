import type { APIContext } from "astro";
import { readWhitepaperSource } from "../../../../lib/whitepaper-source";
import {
	getWhitepaperEditions,
	type WhitepaperEdition,
	type WhitepaperFigure,
} from "../../../../lib/whitepaper";

export const prerender = true;

export function getStaticPaths() {
	return getWhitepaperEditions().flatMap((edition) =>
		edition.figures.map((figure) => ({
			params: { edition: edition.slug, name: figure.name },
			props: { edition, figure },
		})),
	);
}

interface Props {
	edition: WhitepaperEdition;
	figure: WhitepaperFigure;
}

export async function GET({ props }: APIContext) {
	const { edition, figure } = props as Props;
	const source = await readWhitepaperSource(
		edition.sourceDirectory,
		figure.sourcePath,
	);

	return new Response(new Uint8Array(source), {
		headers: {
			"Content-Type": figure.contentType,
			"Cache-Control": "public, max-age=3600",
		},
	});
}
