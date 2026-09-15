import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Average Personal Stats",
	description: "Calculate the average personal stat increase.",
	version: "1.0.0",
	matches: ["https://*.torn.com/personalstats.php*"],
	runAt: "document-start",
};

export default metadata;
