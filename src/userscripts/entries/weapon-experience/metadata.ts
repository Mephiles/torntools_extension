import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Weapon Experience",
	description: "Show your weapon experience while attacking.",
	version: "1.0.1",
	matches: ["https://*.torn.com/page.php?sid=attack*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
