import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Shop Filters",
	description: "Show filters in the various city item shops.",
	version: "1.0.4",
	matches: ["https://*.torn.com/bigalgunshop.php*", "https://*.torn.com/shops.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
