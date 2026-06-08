import type { UserscriptMetadata } from "@@/tools/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Ranked War Filter",
	description: "Filter the ranked war views.",
	version: "1.0.0",
	matches: ["https://*.torn.com/factions.php*"],
	runAt: "document-end",
};

export default metadata;
