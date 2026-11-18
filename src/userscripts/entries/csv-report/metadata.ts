import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "CSV Report",
	description: "Download the faction chain, war, ranked war, raid and challenge contribution reports as CSV.",
	version: "1.0.1",
	matches: [
		"https://*.torn.com/factions.php*",
		"https://*.torn.com/war.php?step=chainreport*",
		"https://*.torn.com/war.php?step=raidreport*",
		"https://*.torn.com/war.php?step=rankreport*",
		"https://*.torn.com/war.php?step=warreport*",
	],
	runAt: "document-end",
};

export default metadata;
