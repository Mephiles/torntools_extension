import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Travel Item Profits",
	description: "Show the profit of each item abroad.",
	version: "1.0.4",
	matches: ["https://*.torn.com/page.php?sid=travel*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
