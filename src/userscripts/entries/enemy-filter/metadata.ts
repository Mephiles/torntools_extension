import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Enemy Filter",
	description: "Filter the enemy list.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=list&type=enemies*"],
	runAt: "document-end",
};

export default metadata;
