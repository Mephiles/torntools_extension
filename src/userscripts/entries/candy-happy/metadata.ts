import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Candy Happy",
	description: "Show the amount of happy candy would give.",
	version: "1.0.2",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["api.torn.com", "torntools.tornplayground.eu"],
};

export default metadata;
