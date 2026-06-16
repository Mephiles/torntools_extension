import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Alcohol Nerve",
	description: "Show the amount of nerve alcohol would give.",
	version: "1.0.0",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["api.torn.com", "torntools.tornplayground.eu"],
};

export default metadata;
