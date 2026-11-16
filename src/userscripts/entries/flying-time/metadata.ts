import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Flying Time",
	description: "Display your arrival and return time on the travel page.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=travel*"],
	runAt: "document-end",
};

export default metadata;
