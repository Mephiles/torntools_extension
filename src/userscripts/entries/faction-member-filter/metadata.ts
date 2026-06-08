import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Faction Member Filter",
	description: "Filter the list of members in a faction.",
	version: "1.0.0",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
};

export default metadata;
