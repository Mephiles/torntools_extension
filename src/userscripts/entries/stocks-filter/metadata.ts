import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Stocks Filter",
	description: "Filter the stocks lists.",
	version: "1.1.4",
	matches: ["https://*.torn.com/page.php?sid=stocks*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
