import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Fill Max",
	description: "Show a button to fill the amount input to the maximum amount.",
	version: "1.0.6",
	matches: [
		"https://*.torn.com/page.php?sid=ItemMarket*",
		"https://*.torn.com/page.php?sid=travel*",
		"https://*.torn.com/bazaar.php*",
		"https://*.torn.com/bigalgunshop.php.php*",
		"https://*.torn.com/shops.php*",
	],
	runAt: "document-end",
};

export default metadata;
