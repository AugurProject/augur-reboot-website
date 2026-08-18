import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import {
	getWhitepaperEditions,
	getWhitepaperEntries,
	getWhitepaperRawPath,
	getWhitepaperRoot,
	getWhitepaperTitle,
	sortWhitepaperEntries,
} from "../lib/whitepaper";
import { getLearnTopicCatalog } from "../lib/learn";

const basePath = import.meta.env.BASE_URL.endsWith("/")
	? import.meta.env.BASE_URL
	: `${import.meta.env.BASE_URL}/`;

const lituusWhitepaper = {
	shortTitle: "Augur Lituus Whitepaper",
	pdfUrl:
		"https://github.com/AugurProject/whitepaper/blob/master/Lituus/English/Augur_Lituus_Whitepaper.pdf",
	sourceUrl: "https://github.com/AugurProject/whitepaper/tree/master/Lituus/English",
};

function absoluteUrl(path: string, origin: string) {
	return new URL(`${basePath}${path.replace(/^\/+/, "")}`, origin).href;
}

function addInternalLink(
	lines: string[],
	label: string,
	path: string,
	origin: string,
	description?: string,
) {
	const suffix = description ? ` — ${description}` : "";
	lines.push(`- [${label}](${absoluteUrl(path, origin)})${suffix}`);
}

export const GET: APIRoute = async ({ site }) => {
	const origin = site?.origin ?? "https://www.augur.net";
	const learnEntries = await getCollection("learn");
	const learnTopics = getLearnTopicCatalog(learnEntries);
	const blogPosts = (await getCollection("blog")).sort(
		(left, right) => right.data.publishDate.valueOf() - left.data.publishDate.valueOf(),
	);
	const lines = [
		"# Augur",
		"> Augur is rebuilding decentralized prediction markets and oracle infrastructure. This index covers the site's human-readable knowledge, research, and public data surfaces.",
		"",
		"## Start here",
		"",
	];

	addInternalLink(lines, "Homepage and Fork Record", "/", origin, "current protocol state and fork history");
	addInternalLink(lines, "Learn", "/learn/", origin, "evergreen Augur protocol education");
	addInternalLink(lines, "FAQ", "/faq/", origin, "concise answers about Augur and the Moon Fork");
addInternalLink(lines, "Blog archive", "/blog/", origin, "dated announcements, progress, and editorial writing");
addInternalLink(lines, "Whitepapers", "/whitepapers/", origin, "published editions and upstream provenance");
addInternalLink(lines, "RSS feed", "/rss.xml", origin, "machine-readable blog feed");
addInternalLink(lines, "REP", "/rep/", origin, "current REP token reference");
	addInternalLink(lines, "Mission", "/mission/", origin, "Augur history and project direction");

	lines.push("", "## Learn", "");
	for (const topic of learnTopics) {
		lines.push(`### ${topic.topic.label}`);
		addInternalLink(lines, topic.topic.label, topic.topic.path, origin, topic.topic.description);
		for (const entry of topic.entries) {
			if (entry.path === topic.topic.path) continue;
			const status = entry.status === "archived" ? "archived" : entry.contentType;
			addInternalLink(
				lines,
				`${entry.label} (${status})`,
				entry.path,
				origin,
			);
		}
		lines.push("");
	}

	lines.push("## Blog posts", "");
	for (const post of blogPosts) {
		addInternalLink(lines, post.data.title, `/blog/${post.slug}/`, origin, post.data.description);
	}

	lines.push(
		"",
		"## Whitepapers",
		"",
	);

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

	lines.push(`### ${lituusWhitepaper.shortTitle}`);
	lines.push(`- [Original PDF (upstream publication)](${lituusWhitepaper.pdfUrl})`);
	lines.push(`- [Source directory (upstream)](${lituusWhitepaper.sourceUrl})`);
	lines.push("");

	lines.push("## Structured data", "");
	addInternalLink(lines, "Fork risk and lifecycle JSON", "/data/fork-risk.json", origin, "machine-readable fork monitoring record");
	addInternalLink(lines, "REP total supply", "/api/supply/total/", origin, "bare decimal supply endpoint");
	addInternalLink(lines, "REP circulating supply", "/api/supply/circulating/", origin, "bare decimal circulating-supply endpoint");
	addInternalLink(lines, "REP supply metadata", "/api/supply/meta.json", origin, "generation block and exact wei provenance");

	return new Response(`${lines.join("\n")}\n`, {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};
