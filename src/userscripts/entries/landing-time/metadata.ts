import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Landing Time",
	description: "Display at what local time your plane will be landing.",
	version: "1.0.1",
	matches: ["https://*.torn.com/page.php?sid=travel*"],
	runAt: "document-end",
};

export default metadata;
