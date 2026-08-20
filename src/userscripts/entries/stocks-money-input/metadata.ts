import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Stocks Money Input",
	description: "Easier money parking in stocks.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=stocks*"],
	runAt: "document-end",
};

export default metadata;
