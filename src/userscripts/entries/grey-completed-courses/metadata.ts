import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Grey Completed Courses",
	description: "Grey out education categories you have already completed.",
	version: "1.0.0",
	matches: ["https://*.torn.com/page.php?sid=education*"],
	runAt: "document-end",
};

export default metadata;
