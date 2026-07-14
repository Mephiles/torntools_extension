import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Abroad People Filter",
	description: "Filter the list of people abroad.",
	version: "1.1.4",
	matches: ["https://*.torn.com/index.php?page=people*"],
	runAt: "document-end",
};

export default metadata;
