import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Jail Filter",
	description: "Filter the list of users currently in jail.",
	version: "1.1.0",
	matches: ["https://*.torn.com/jailview.php*"],
	runAt: "document-end",
};

export default metadata;
