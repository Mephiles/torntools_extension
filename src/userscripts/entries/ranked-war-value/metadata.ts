import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Ranked War Value",
	description: "Show the total value of the ranked war rewards..",
	version: "1.0.2",
	matches: ["https://*.torn.com/war.php?step=rankreport*"],
	runAt: "document-end",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
