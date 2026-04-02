/**
 * Rehype plugin that replaces leading emojis in headings with Phosphor SVG icons.
 * If no emoji is found, a default "plus" icon is used.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(
	__dirname,
	"../../node_modules/@phosphor-icons/core/assets/regular",
);

// Emoji → Phosphor icon name mapping
const EMOJI_MAP = {
	"🔮": "crystal-ball",
	"⚖️": "scales",
	"🧪": "flask",
	"📈": "chart-line-up",
	"🌍": "globe",
	"🔥": "fire",
	"⚙️": "gear",
	"💡": "lightbulb",
	"🏛️": "bank",
	"💸": "currency-circle-dollar",
	"🌀": "spiral",
	"🧠": "brain",
	"🔄": "arrows-clockwise",
	"🌉": "bridge",
	"💼": "briefcase",
	"🧩": "puzzle-piece",
	"💰": "coins",
	"📅": "calendar",
	"👉": "arrow-right",
	"👨‍💻": "user-gear",
	"⛩️": "castle-turret",
	"📣": "megaphone",
};

const DEFAULT_ICON = "plus";

// Fallback icons by heading level (when no emoji is present)
const FALLBACK_ICONS_BY_LEVEL = {
	2: "plus",
	3: "dots-six-vertical",
	4: "equals",
};

// Cache loaded SVGs
const svgCache = new Map();

function loadSvgNode(iconName) {
	if (svgCache.has(iconName)) return svgCache.get(iconName);

	try {
		const svgPath = join(ICONS_DIR, `${iconName}.svg`);
		const raw = readFileSync(svgPath, "utf-8");
		const tree = fromHtml(raw, { fragment: true, space: "svg" });
		// Get the <svg> element from the parsed tree
		const svgNode = tree.children.find((n) => n.tagName === "svg");
		if (svgNode) {
			svgNode.properties.className = ["heading-icon"];
			svgNode.properties.ariaHidden = "true";
		}
		svgCache.set(iconName, svgNode);
		return svgNode;
	} catch {
		return null;
	}
}

// Regex to match leading emoji (including compound emojis like 👨‍💻)
const EMOJI_REGEX =
	/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji}\u200D\p{Emoji})+\s*/u;

function getLeadingEmoji(text) {
	const match = text.match(EMOJI_REGEX);
	if (!match) return null;
	return { emoji: match[0].trim(), length: match[0].length };
}

export default function rehypeHeadingIcons() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (!/^h[2-6]$/.test(node.tagName)) return;

			// Track heading level for fallback icon selection
			const headingLevel = parseInt(node.tagName.slice(1));

			// Find the first text node
			const firstChild = node.children[0];
			if (!firstChild || firstChild.type !== "text") return;

			const text = firstChild.value;
			const emojiInfo = getLeadingEmoji(text);

			let iconName = DEFAULT_ICON;
			if (emojiInfo) {
				iconName = EMOJI_MAP[emojiInfo.emoji] || DEFAULT_ICON;
				// Strip emoji from text
				firstChild.value = text.slice(emojiInfo.length);
			} else {
				// Use level-specific fallback when no emoji is present
				iconName = FALLBACK_ICONS_BY_LEVEL[headingLevel] || DEFAULT_ICON;
			}

			const svgNode = loadSvgNode(iconName);
			if (!svgNode) return;

			// Deep clone so each heading gets its own node
			const clone = JSON.parse(JSON.stringify(svgNode));

			// Insert SVG before the text
			node.children.unshift(clone);
		});
	};
}
