import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Gym Steadfast",
	description: "Show the amount of steadfast for every stats.",
	version: "1.0.6",
	matches: ["https://*.torn.com/gym.php*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
