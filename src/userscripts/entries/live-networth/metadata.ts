import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Live Networth",
	description: "Compare your daily networth with the 'live' networth.",
	version: "1.0.1",
	matches: ["https://*.torn.com/index.php*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
