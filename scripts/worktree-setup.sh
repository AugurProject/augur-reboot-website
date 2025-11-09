#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}✓${NC} Setting up Augur website workspace..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "Please install Node.js (via Homebrew: brew install node)"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗${NC} npm is not installed"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm found: $(npm --version)"

# Install dependencies
echo -e "${YELLOW}⚠${NC} Installing dependencies..."
npm install

echo -e "${GREEN}✓${NC} Workspace setup complete!"
echo ""
echo "Ready to develop. Run 'npm run dev' to start the dev server on localhost:4321"
echo ""
echo "Optional checks:"
echo "  npm run typecheck    # Type validation"
echo "  npm run lint         # Code linting"
