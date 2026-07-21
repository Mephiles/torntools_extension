import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Friend Filter",
	description: "Filter the friend list.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=list&type=friends*"],
	runAt: "document-end",
};

export default metadata;
