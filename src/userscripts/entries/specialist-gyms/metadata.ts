import type { UserscriptMetadata } from "@@/tools/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Specialist Gyms",
	description: "Calculate your stat ratio for activating your specialist gyms.",
	version: "1.0.4",
	matches: ["https://*.torn.com/gym.php*"],
	runAt: "document-end",
};

export default metadata;
