import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Hospital Filter",
	description: "Filter the list currently in the hospital.",
	version: "1.1.1",
	matches: ["https://*.torn.com/hospitalview.php*"],
	runAt: "document-end",
};

export default metadata;
