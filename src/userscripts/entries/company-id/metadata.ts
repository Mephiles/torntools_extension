import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Company ID",
	description: "Display the company id besides the name.",
	version: "1.0.1",
	matches: ["https://*.torn.com/joblist.php*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
