import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Cost To Next Stock",
	description: "Show Next BB cost under Dividend on the stock exchange, with cheapest/second/most-expensive highlights.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=stocks*"],
	runAt: "document-end",
};

export default metadata;
