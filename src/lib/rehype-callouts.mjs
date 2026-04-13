/**
 * Rehype plugin that transforms paragraphs starting with 👉 into callouts.
 * Strips the emoji and adds a "callout" class for styling.
 */
import { visit } from "unist-util-visit";

// Regex to match leading emoji (including compound emojis like 👨‍💻)
const EMOJI_REGEX =
	/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji}\u200D\p{Emoji})+\s*/u;

function getLeadingEmoji(text) {
	const match = text.match(EMOJI_REGEX);
	if (!match) return null;
	return { emoji: match[0].trim(), length: match[0].length };
}

export default function rehypeCallouts() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "p") return;

			// Find the first text node
			const textNode = node.children.find((n) => n.type === "text");
			if (!textNode) return;

			const emojiInfo = getLeadingEmoji(textNode.value);
			if (!emojiInfo) return;

			// Strip emoji from text
			textNode.value = textNode.value.slice(emojiInfo.length);

			// Transform <p> into a callout <div>
			node.tagName = "div";
			node.properties.className = ["callout"];
		});
	};
}
