import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Ranked War Filter",
	description: "Filter the ranked war views.",
	version: "1.0.8",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
};

export default metadata;
