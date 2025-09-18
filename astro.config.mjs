// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Check if building in GitHub Actions (for GitHub Pages)
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]; // Extract repo name from "owner/repo"

// Base configuration shared by both environments
const baseConfig = {
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: process.env.NODE_ENV === 'production' ? {
        "react-dom/server": "react-dom/server.edge"
      } : undefined
    }
  },
  integrations: [react(), sitemap()]
};

// GitHub Pages specific configuration
const gitHubPagesConfig = {
  site: 'https://augur.net',
  // No base path needed for custom domain - apex domain serves from root
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
  output: /** @type {'server'} */ ('server')
};

// https://astro.build/config
export default defineConfig({
  ...baseConfig,
  ...(isGitHubActions ? gitHubPagesConfig : cloudflareConfig)
});