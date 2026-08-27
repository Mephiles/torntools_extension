import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Properties Filter",
	description: "Filter the properties you and your spouse own.",
	version: "1.0.5",
	matches: ["https://*.torn.com/properties.php*"],
	runAt: "document-end",
};

export default metadata;
