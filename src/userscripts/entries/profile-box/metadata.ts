import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Profile Box: Personal Stats",
	description: "Compare personal stats from the profile you are currently viewing.",
	version: "1.0.0",
	matches: ["https://*.torn.com/profiles.php*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
