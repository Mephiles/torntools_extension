import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "High Low Helper",
	description: "Display the best strategic option in high-low.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=highlow*"],
	runAt: "document-end",
};

export default metadata;
