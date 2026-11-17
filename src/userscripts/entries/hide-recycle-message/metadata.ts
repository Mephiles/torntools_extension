import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Hide Recycle Message",
	description: "Hide the 'clear up your inventory' message on the item page.",
	version: "1.0.0",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
};

export default metadata;
