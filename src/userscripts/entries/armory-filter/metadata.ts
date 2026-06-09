import type { UserscriptMetadata } from "../userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Armory Filter",
	description: "Filter the list of items in a factions armory.",
	version: "1.0.0",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
	staticItems: (item) => item.type === "Weapon",
};

export default metadata;
