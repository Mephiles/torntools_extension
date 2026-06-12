import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Travel Table",
	description: "Show the amount of items abroad, and sync this information.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=travel*"],
	runAt: "document-start",
	connect: ["torntools.tornplayground.eu", "yata.yt", "prombot.co.uk", "torn-intel.com"],
};

export default metadata;
