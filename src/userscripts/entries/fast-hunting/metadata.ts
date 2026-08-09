import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Fast Hunting",
	description: "Don't move the hunt again button to be able to hunt faster.",
	version: "1.0.1",
	matches: ["https://*.torn.com/index.php?page=hunting*"],
	runAt: "document-end",
};

export default metadata;
