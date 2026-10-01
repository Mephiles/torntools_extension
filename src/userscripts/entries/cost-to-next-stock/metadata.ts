import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Cost To Next Stock",
	description: "Show Next BB cost under Dividend on the stock exchange.",
	version: "1.0.1",
	matches: ["https://*.torn.com/page.php?sid=stocks*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
