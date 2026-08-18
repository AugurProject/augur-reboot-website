import type { APIRoute } from "astro";
import {
	getWhitepaperEditions,
	getWhitepaperEntries,
	getWhitepaperRawPath,
	getWhitepaperRoot,
	getWhitepaperTitle,
	sortWhitepaperEntries,
} from "../lib/whitepaper";

const basePath = import.meta.env.BASE_URL.endsWith("/")
	? import.meta.env.BASE_URL
	: `${import.meta.env.BASE_URL}/`;

function absoluteUrl(path: string, origin: string) {
	return new URL(`${basePath}${path.replace(/^\/+/, "")}`, origin).href;
}

export const GET: APIRoute = async ({ site }) => {
	const origin = site?.origin ?? "https://www.augur.net";
	const lines = [
		"# Augur",
		"> The Augur website publishes decentralized prediction-market and oracle research, protocol education, and historical records.",
		"",
		"## Whitepapers",
		"",
	];

	for (const edition of getWhitepaperEditions()) {
		const entries = sortWhitepaperEntries(edition, await getWhitepaperEntries(edition));
		lines.push(`### ${edition.shortTitle}`);
		lines.push(`- [HTML edition](${absoluteUrl(getWhitepaperRoot(edition), origin)})`);
		for (const entry of entries) {
			const label = entry.slug === "index"
				? "Markdown index"
				: `Markdown section — ${getWhitepaperTitle(entry)}`;
			lines.push(`- [${label}](${absoluteUrl(getWhitepaperRawPath(edition, entry), origin)})`);
		}
		lines.push(`- [Original PDF (authoritative upstream)](${edition.pdfUrl})`);
		lines.push(`- [Source repository (authoritative upstream)](${edition.sourceRepositoryUrl})`);
		lines.push("");
	}

	return new Response(`${lines.join("\n")}\n`, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
