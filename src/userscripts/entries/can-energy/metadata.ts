import type { UserscriptMetadata } from "@@/tools/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Can Energy",
	description: "Show the amount of energy a can would give.",
	version: "1.0.0",
	matches: ["https://*.torn.com/item.php*"],
	runAt: "document-end",
};

export default metadata;
