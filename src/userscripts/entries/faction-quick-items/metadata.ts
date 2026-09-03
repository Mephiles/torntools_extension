import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata.ts";

const metadata: UserscriptMetadata = {
	name: "Faction Quick Items",
	description: "Use items from the faction armory faster.",
	version: "1.0.2",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
