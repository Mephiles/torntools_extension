import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata.ts";

const metadata: UserscriptMetadata = {
	name: "Quick Items",
	description: "Use your items faster.",
	version: "1.0.0",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
