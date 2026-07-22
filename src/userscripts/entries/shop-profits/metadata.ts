import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Shop Profits",
	description: "Display the amount of profit per city shop item.",
	version: "1.0.1",
	matches: ["https://*.torn.com/bigalgunshop.php*", "https://*.torn.com/shops.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
