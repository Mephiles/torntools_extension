import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Gym Disable Stats",
	description: "Disable certain stats to avoid training them accidentally.",
	version: "1.0.5",
	matches: ["https://*.torn.com/gym.php*"],
	runAt: "document-end",
};

export default metadata;
