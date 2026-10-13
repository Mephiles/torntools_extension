import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Race Car Selector",
	description: "Recommend a car to use when entering a race.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=racing*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
