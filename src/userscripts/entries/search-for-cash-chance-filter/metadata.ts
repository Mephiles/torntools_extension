import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Search for Cash Chance Filter",
	description: "Disable the Search for Cash places below a minimum success chance.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=crimes*"],
	runAt: "document-end",
};

export default metadata;
