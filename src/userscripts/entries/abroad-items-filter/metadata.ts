import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Abroad Items Filter",
	description: "Filter the list of items available while abroad.",
	version: "1.1.1",
	matches: ["https://*.torn.com/page.php?sid=travel*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
