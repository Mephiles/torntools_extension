import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Armory Filter",
	description: "Filter the list of items in a factions armory.",
	version: "1.2.3",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
