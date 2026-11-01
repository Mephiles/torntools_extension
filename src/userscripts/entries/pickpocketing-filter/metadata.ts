import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Pickpocketing Filter",
	description: "Filter the pickpocketing targets by tier and by body type.",
	version: "1.0.1",
	matches: ["https://*.torn.com/page.php?sid=crimes*"],
	runAt: "document-end",
};

export default metadata;
