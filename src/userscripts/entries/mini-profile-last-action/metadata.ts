import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Mini Profile Last Action",
	description: "Display the last action in the mini profile.",
	version: "1.0.0",
	matches: ["https://*.torn.com/*"],
	runAt: "document-end",
};

export default metadata;
