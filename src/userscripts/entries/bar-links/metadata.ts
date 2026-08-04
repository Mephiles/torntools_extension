import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Bar Links",
	description: "Make the bars clickable.",
	version: "1.0.0",
	matches: ["https://*.torn.com/*"],
	runAt: "document-end",
};

export default metadata;
