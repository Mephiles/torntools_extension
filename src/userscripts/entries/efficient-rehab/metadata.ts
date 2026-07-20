import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Efficient Rehab",
	description: "Select how many rehabs are efficient at your current level.",
	version: "dev-0.0.1",
	matches: ["https://*.torn.com/index.php?page=rehab*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
