import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Item Values",
	description: "Display the value of items on various pages.",
	version: "1.0.1",
	matches: [
		"https://*.torn.com/item.php*",
		"https://*.torn.com/bazaar.php*",
		"https://*.torn.com/displaycase.php*",
		"https://*.torn.com/factions.php*",
		"https://*.torn.com/trade.php*",
		"https://*.torn.com/itemuseparcel.php*",
	],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
