import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Hide Icons",
	description: "Hide selected icons in Torn's sidebar.",
	version: "1.0.1",
	matches: ["https://*.torn.com/*"],
	runAt: "document-end",
};

export default metadata;
