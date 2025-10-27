#!/bin/bash
# Initialize Astro project with Cloudflare Workers deployment
# Usage: ./init_astro_cloudflare.sh <project-name>

set -e

PROJECT_NAME="${1:-my-astro-app}"

echo "🚀 Creating Astro project with Cloudflare Workers..."
echo "Project name: $PROJECT_NAME"
echo ""

# Create project using create-cloudflare
npm create cloudflare@latest "$PROJECT_NAME" -- \
  --framework=astro \
  --deploy=false

cd "$PROJECT_NAME"

echo ""
echo "📦 Installing additional dependencies..."

# Install React for islands
npm install react react-dom @types/react @types/react-dom

# Install Tailwind CSS v4 (Vite plugin)
npm install -D tailwindcss @tailwindcss/vite

# Install Astro integrations
npx astro add react --yes

echo ""
echo "⚙️  Setting up Tailwind CSS v4..."

# Create global CSS with Tailwind v4
mkdir -p src/styles
cat > src/styles/global.css << 'EOF'
@import "tailwindcss";

/* Tailwind plugins */
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";

/* Dark mode */
@custom-variant dark (&:where(.dark, .dark *));

/* Theme customization */
@theme {
  --font-sans: system-ui, sans-serif;
  --font-serif: Georgia, serif;
}
EOF

# Update astro.config.mjs to include Tailwind Vite plugin
cat > astro.config.mjs << 'EOF'
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
EOF

# Import global CSS in base layout if it exists
if [ -f "src/layouts/Layout.astro" ]; then
  # Add import at the top of the frontmatter
  sed -i '2i import "../styles/global.css";' src/layouts/Layout.astro
elif [ -f "src/pages/index.astro" ]; then
  # Add import at the top of index page
  sed -i '2i import "../styles/global.css";' src/pages/index.astro
fi

echo ""
echo "✅ Project setup complete!"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npm run dev              # Start development server"
echo "  npm run build            # Build for production"
echo "  npx wrangler deploy      # Deploy to Cloudflare Workers"
echo ""
echo "📚 Reference files in the skill package:"
echo "  - references/cloudflare-workers.md   # Workers deployment guide"
echo "  - references/cloudflare-d1.md        # D1 database setup"
echo "  - references/react-integration.md    # React in Astro"
echo "  - references/tailwind-setup.md       # Tailwind v4 config"
