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
  // Site URL is set via SITE_URL environment variable (GitHub Actions: vars.SITE_URL)
  // If not set, Astro will not generate sitemaps or canonical URLs
  ...(process.env.SITE_URL && { site: process.env.SITE_URL }),
  // Base path for deployment
  // - GitHub Pages subdirectory: set BASE_PATH to '/repo-name'
  // - Custom domain or root deployment: leave BASE_PATH unset or set to '/'
  base: process.env.BASE_PATH || '/',
  output: /** @type {'static'} */ ('static')
};

// Cloudflare specific configuration (for local development and preview)
const cloudflareConfig = {
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    imageService: "cloudflare"
  }),
  // Site URL for RSS feeds and canonical URLs (local development fallback)
  ...(process.env.SITE_URL && { site: process.env.SITE_URL }),
  output: /** @type {'server'} */ ('server')
};

// https://astro.build/config
export default defineConfig({
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
