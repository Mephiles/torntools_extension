import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Job Specials",
	description: "Show all of the specials available for the company your are viewing.",
	version: "1.0.0",
	matches: ["https://*.torn.com/joblist.php*"],
	runAt: "document-end",
};

export default metadata;
