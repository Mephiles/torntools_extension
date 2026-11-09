import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Clickable Balances",
	description: "Click a balance on a faction member to fill in the 'Give to user' form.",
	version: "1.0.0",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
};

export default metadata;
