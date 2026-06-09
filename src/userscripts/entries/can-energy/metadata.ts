import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Can Energy",
	description: "Show the amount of energy a can would give.",
	version: "1.0.2",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	staticItems: (item) => item.type === "Energy Drink",
};

export default metadata;
