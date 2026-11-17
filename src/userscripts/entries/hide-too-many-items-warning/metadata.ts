import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Hide Too Many Items Warning",
	description: "Hide the 'too many items' warning on the item page.",
	version: "1.0.0",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
};

export default metadata;
