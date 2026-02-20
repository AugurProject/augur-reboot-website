// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// Check if building in GitHub Actions (for GitHub Pages)
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

// GitHub Pages specific configuration
const gitHubPagesConfig = {
  base: process.env.BASE_PATH || '/',
  output: /** @type {'static'} */ ('static')
};

// Cloudflare specific configuration (for local development and preview)
const cloudflareConfig = {
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  output: /** @type {'server'} */ ('server')
};

// https://astro.build/config
export default defineConfig({
  // Site URL for RSS feeds, canonical URLs, sitemap generation
  // Set via SITE_URL environment variable
  ...(process.env.SITE_URL && { site: process.env.SITE_URL }),
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: process.env.NODE_ENV === 'production' ? {
        "react-dom/server": "react-dom/server.edge"
      } : undefined
    }
  },
  integrations: [react(), sitemap(), mdx()],
  ...(isGitHubActions ? gitHubPagesConfig : cloudflareConfig)
});
