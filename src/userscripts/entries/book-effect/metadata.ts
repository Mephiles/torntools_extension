import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Book Effect",
	description: "Show the book effect for books.",
	version: "1.0.2",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
