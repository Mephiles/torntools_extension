import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Racing Filter",
	description: "Filter the racing competition list.",
	version: "1.2.1",
	matches: ["https://*.torn.com/page.php?sid=racing*"],
	runAt: "document-end",
};

export default metadata;
