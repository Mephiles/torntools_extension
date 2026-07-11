import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Effective Battle Stats",
	description: "Display your effective battle stats in the homepage.",
	version: "1.0.0",
	matches: ["https://*.torn.com/index.php*"],
	runAt: "document-end",
};

export default metadata;
