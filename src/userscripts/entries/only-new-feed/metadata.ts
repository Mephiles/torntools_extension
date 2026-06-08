import type { UserscriptMetadata } from "@@/tools/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Only New Feed",
	description: "Only show unread items in your forum feeds.",
	version: "1.0.7",
	matches: ["https://*.torn.com/forums.php*"],
	runAt: "document-end",
};

export default metadata;
