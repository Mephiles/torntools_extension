import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Trade Values",
	description: "Display the value of items on your trades.",
	version: "1.0.1",
	matches: ["https://*.torn.com/trade.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
