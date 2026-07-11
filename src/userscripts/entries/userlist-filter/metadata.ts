import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Userlist Filter",
	description: "Filter the (advanced) search userlist.",
	version: "1.1.2",
	matches: ["https://*.torn.com/page.php?sid=UserList*"],
	runAt: "document-end",
};

export default metadata;
