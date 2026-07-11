import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Bounty Filter",
	description: "Filter the bounties list.",
	version: "1.0.1",
	matches: ["https://*.torn.com/bounties.php*"],
	runAt: "document-end",
};

export default metadata;
