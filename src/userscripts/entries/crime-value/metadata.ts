import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Crime Value",
	description: "Display the value of the items part of the crime outcome.",
	version: "1.0.1",
	matches: ["https://*.torn.com/page.php?sid=crimes*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
