import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "City Items",
	description: "List all available items in your city and allow you to collect them with a single click.",
	version: "beta-1.0.7",
	matches: ["https://*.torn.com/city.php*"],
	runAt: "document-start",
	connect: ["torntools.tornplayground.eu"],
};

export default metadata;
