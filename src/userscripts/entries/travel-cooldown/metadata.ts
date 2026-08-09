import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Travel Cooldown",
	description: "Receive cooldown information before flying.",
	version: "1.0.2",
	matches: ["https://*.torn.com/page.php?sid=travel*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
