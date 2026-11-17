import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Prevent Join Attacks",
	description: "Warn you before you join an attack.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=attack*"],
	runAt: "document-start",
};

export default metadata;
