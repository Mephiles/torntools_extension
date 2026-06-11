import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Can Energy",
	description: "Show the amount of energy a can would give.",
	version: "1.1.1",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
