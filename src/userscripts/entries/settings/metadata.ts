import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Settings",
	description: "Shared settings for TornTools userscripts.",
	version: "1.0.0",
	matches: ["https://*.torn.com/preferences.php*"],
	runAt: "document-end",
};

export default metadata;
