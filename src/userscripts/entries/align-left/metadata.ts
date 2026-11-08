import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Align Left",
	description: "Align the content of Torn's pages to the left.",
	version: "1.0.0",
	matches: ["https://*.torn.com/*"],
	runAt: "document-start",
};

export default metadata;
