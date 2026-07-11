import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Mission Hints",
	description: "Provide you with the task of the mission before accepting, and sometimes also an additional hint.",
	version: "1.0.2",
	matches: ["https://*.torn.com/page.php?sid=missions*"],
	runAt: "document-end",
};

export default metadata;
