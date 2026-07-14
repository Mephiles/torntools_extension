import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Company Stock Fill",
	description: "Fill your company stock based on the previous day.",
	version: "1.0.2",
	matches: ["https://*.torn.com/companies.php*"],
	runAt: "document-end",
};

export default metadata;
