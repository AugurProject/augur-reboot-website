import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
	const origin = site?.origin || "https://www.augur.net";

	const body = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${origin}/sitemap-index.xml
Sitemap: ${origin}/sitemap-0.xml

# Crawl delay (be respectful to server resources)
Crawl-delay: 1

# Block common bot paths
Disallow: /api/
Disallow: /_astro/
Disallow: /admin/
`;

	return new Response(body, {
		status: 200,
		headers: { "Content-Type": "text/plain" },
	});
};
