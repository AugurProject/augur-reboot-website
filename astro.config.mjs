// @ts-check

import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import rehypeCallouts from "./src/lib/rehype-callouts.mjs";
import rehypeHeadingIcons from "./src/lib/rehype-heading-icons.mjs";

// Check if building in GitHub Actions (for GitHub Pages)
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";

// GitHub Pages specific configuration
const gitHubPagesConfig = {
	base: process.env.BASE_PATH || "/",
	output: /** @type {'static'} */ ("static"),
};

// Cloudflare specific configuration (for local development and preview)
const cloudflareConfig = {
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	output: /** @type {'server'} */ ("server"),
};

// https://astro.build/config
export default defineConfig({
	// Site URL for RSS feeds, canonical URLs, sitemap generation
	// Set via SITE_URL environment variable
	...(process.env.SITE_URL && { site: process.env.SITE_URL }),
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias:
				process.env.NODE_ENV === "production"
					? {
							"react-dom/server": "react-dom/server.edge",
						}
					: undefined,
		},
	},
	integrations: [
		react(),
		sitemap(),
		mdx({ rehypePlugins: [rehypeHeadingIcons, rehypeCallouts] }),
	],
	...(isGitHubActions ? gitHubPagesConfig : cloudflareConfig),
});
