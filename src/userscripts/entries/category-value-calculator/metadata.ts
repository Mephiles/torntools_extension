import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Category Value Calculator",
	description: "Calculate the value of an entire item category.",
	version: "1.0.1",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["api.torn.com", "torntools.tornplayground.eu"],
};

export default metadata;
