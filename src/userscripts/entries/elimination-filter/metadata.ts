import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Elimination Filter",
	description: "Filter the elimination rosters.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=elimination*"],
	runAt: "document-end",
};

export default metadata;
