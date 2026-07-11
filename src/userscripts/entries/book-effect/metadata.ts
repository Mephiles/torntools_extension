import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Book Effect",
	description: "Show the book effect for books.",
	version: "1.0.1",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
};

export default metadata;
