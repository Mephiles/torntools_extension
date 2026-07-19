import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Blackjack Strategy",
	description: "Display the best strategic option in blackjack.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=blackjack*"],
	runAt: "document-end",
};

export default metadata;
