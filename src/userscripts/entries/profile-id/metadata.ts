import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Profile ID",
	description: "Display the user id on the profile besides the name.",
	version: "1.0.2",
	matches: ["https://*.torn.com/profiles.php*"],
	runAt: "document-end",
};

export default metadata;
