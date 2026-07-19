import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Opened Supply Pack Value",
	description: "Display the value of the supply pack you just opened.",
	version: "1.0.0",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
