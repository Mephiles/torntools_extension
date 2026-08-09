import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Bank Investment Info",
	description: "Display an overview of the bank profit per period.",
	version: "1.0.4",
	matches: ["https://*.torn.com/bank.php*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
