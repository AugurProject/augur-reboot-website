const editionRoutes = [
	{
		sourcePath: "/src/content/whitepaper-v2/",
		publicPath: "/whitepapers/augur-v2/",
	},
];

function rewriteLinks(node, publicPath) {
	if (!node || typeof node !== "object") return;

	if (
		node.type === "element" &&
		node.tagName === "a" &&
		typeof node.properties?.href === "string"
	) {
		const href = node.properties.href;
		const [path, fragment] = href.split("#");
		if (path.endsWith(".md")) {
			const slug = path.replace(/^\.\//, "").replace(/\.md$/, "");
			node.properties.href = `${publicPath}${slug}/${fragment ? `#${fragment}` : ""}`;
		}
	}

	if (
		node.type === "element" &&
		node.tagName === "img" &&
		typeof node.properties?.src === "string" &&
		node.properties.src.startsWith("figures/")
	) {
		node.properties.src = `${publicPath}${node.properties.src}`;
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			rewriteLinks(child, publicPath);
		}
	}
}

export default function rehypeWhitepaperLinks() {
	return (tree, file) => {
		if (typeof file?.path !== "string") return;

		const edition = editionRoutes.find(({ sourcePath }) =>
			file.path.includes(sourcePath),
		);
		if (edition) rewriteLinks(tree, edition.publicPath);
	};
}
