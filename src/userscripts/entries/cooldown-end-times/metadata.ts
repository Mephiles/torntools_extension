import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Cooldown End Times",
	description: "Show the end time of cooldowns in tooltips.",
	version: "1.0.0",
	matches: ["https://*.torn.com/*"],
	runAt: "document-end",
};

export default metadata;
