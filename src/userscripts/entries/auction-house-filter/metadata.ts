import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Auction House Filter",
	description: "Filter the list of items in the auction house.",
	version: "1.0.0",
	matches: ["https://*.torn.com/amarket.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
