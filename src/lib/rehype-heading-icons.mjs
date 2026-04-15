/**
 * Rehype plugin that replaces leading emojis in headings with Phosphor SVG icons.
 * If no emoji is found, a default "plus" icon is used.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Icons from "@phosphor-icons/react";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";

// Emoji → Phosphor icon component mapping
const EMOJI_MAP = {
	"🔮": Icons.MagicWandIcon,
	"⚖️": Icons.ScalesIcon,
	"🧪": Icons.FlaskIcon,
	"📈": Icons.ChartLineUpIcon,
	"🌍": Icons.GlobeIcon,
	"🔥": Icons.FireIcon,
	"⚙️": Icons.GearIcon,
	"💡": Icons.LightbulbIcon,
	"🏛️": Icons.BankIcon,
	"💸": Icons.CurrencyCircleDollarIcon,
	"🌀": Icons.SpiralIcon,
	"🧠": Icons.BrainIcon,
	"🔄": Icons.ArrowsClockwiseIcon,
	"🌉": Icons.BridgeIcon,
	"💼": Icons.BriefcaseIcon,
	"🧩": Icons.PuzzlePieceIcon,
	"💰": Icons.CoinsIcon,
	"📅": Icons.CalendarIcon,
	"👉": Icons.ArrowRightIcon,
	"👨‍💻": Icons.UserGearIcon,
	"⛩️": Icons.CastleTurretIcon,
	"📣": Icons.MegaphoneIcon,
};

// Fallback icons by heading level (when no emoji is present)
const FALLBACK_ICONS_BY_LEVEL = {
	2: Icons.PlusIcon,
	3: Icons.DotsSixVerticalIcon,
	4: Icons.EqualsIcon,
};

// Cache loaded SVG HAST nodes
const svgCache = new Map();

function loadSvgNode(IconComponent) {
	if (svgCache.has(IconComponent)) return svgCache.get(IconComponent);

	const html = renderToStaticMarkup(
		createElement(IconComponent, {
			weight: "regular",
			className: "heading-icon",
			"aria-hidden": true,
		}),
	);
	const tree = fromHtml(html, { fragment: true, space: "svg" });
	const svgNode = tree.children.find((n) => n.tagName === "svg");
	svgCache.set(IconComponent, svgNode ?? null);
	return svgNode ?? null;
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

			const headingLevel = parseInt(node.tagName.slice(1), 10);

			// Find the first text node
			const firstChild = node.children[0];
			if (!firstChild || firstChild.type !== "text") return;

			const text = firstChild.value;
			const emojiInfo = getLeadingEmoji(text);

			let IconComponent;
			if (emojiInfo) {
				IconComponent = EMOJI_MAP[emojiInfo.emoji] ?? Icons.PlusIcon;
				// Strip emoji from text
				firstChild.value = text.slice(emojiInfo.length);
			} else {
				IconComponent = FALLBACK_ICONS_BY_LEVEL[headingLevel] ?? Icons.PlusIcon;
			}

			const svgNode = loadSvgNode(IconComponent);
			if (!svgNode) return;

			// Deep clone so each heading gets its own node
			const clone = JSON.parse(JSON.stringify(svgNode));

			// Insert SVG before the text
			node.children.unshift(clone);
		});
	};
}
