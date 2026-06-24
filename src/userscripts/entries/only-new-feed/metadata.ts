import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Only New Feed",
	description: "Only show unread items in your forum feeds.",
	version: "1.0.11",
	matches: ["https://*.torn.com/forums.php*"],
	runAt: "document-end",
};

export default metadata;
