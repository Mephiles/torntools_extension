import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Bazaar Market",
	description: "Additionally display bazaar entries in the item market.",
	version: "1.2.1",
	matches: ["https://*.torn.com/page.php?sid=ItemMarket*", "https://*.torn.com/bazaar.php*"],
	runAt: "document-end",
	connect: ["weav3r.dev", "torntools.tornplayground.eu"],
};

export default metadata;
