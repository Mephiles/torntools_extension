import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "OC2 Filter",
	description: "Filter the OC2 list.",
	version: "1.0.0",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
};

export default metadata;
