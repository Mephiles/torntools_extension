import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Forum Menu",
	description: "Adds a menu to hide, highlight and ignore threads and posts on the forums.",
	version: "1.0.0",
	matches: ["https://*.torn.com/forums.php*"],
	runAt: "document-end",
};

export default metadata;
