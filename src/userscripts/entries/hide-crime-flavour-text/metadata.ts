import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Hide Crime Flavour Text",
	description: "Hide the flavour text of successful crimes 2 outcomes.",
	version: "1.0.1",
	matches: ["https://*.torn.com/page.php?sid=crimes*"],
	runAt: "document-start",
};

export default metadata;
