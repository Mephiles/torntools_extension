import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Persistent List Filter",
	description: "Remember the native sort and filter of the friends, enemies and targets lists, and apply them from the sidebar.",
	version: "1.0.0",
	// The sidebar is where the remembered filter is applied, so this has to run on every page, not only the lists.
	matches: ["https://*.torn.com/*"],
	runAt: "document-end",
};

export default metadata;
