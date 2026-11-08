import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Company Specials",
	description: "Show the potential mug amount and help with stat spies on company specials.",
	version: "1.0.0",
	matches: ["https://*.torn.com/companies.php*"],
	runAt: "document-end",
	connect: ["api.torn.com", "www.tornstats.com"],
};

export default metadata;
