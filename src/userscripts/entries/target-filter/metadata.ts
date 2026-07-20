import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Target Filter",
	description: "Filter the target list.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=list&type=targets*"],
	runAt: "document-end",
};

export default metadata;
