import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Drug Details",
	description: "Display the full details of drugs on various pages.",
	version: "1.0.2",
	matches: [
		"https://*.torn.com/item.php*",
		"https://*.torn.com/bazaar.php*",
		"https://*.torn.com/displaycase.php*",
		"https://*.torn.com/factions.php*",
		"https://*.torn.com/page.php?sid=travel*",
		"https://*.torn.com/page.php?sid=ItemMarket*",
	],
	runAt: "document-end",
};

export default metadata;
