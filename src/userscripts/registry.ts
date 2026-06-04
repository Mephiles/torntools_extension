import type { MonkeyUserScript } from "vite-plugin-monkey";

export interface UserscriptDefinition {
	name: string;
	description: string;
	version: string;
	matches: string[];
	runAt: "document-start" | "document-body" | "document-end" | "document-idle";
	grants?: MonkeyUserScript["grant"];
}

export const USERSCRIPTS: UserscriptDefinition[] = [
	{
		name: "Only New Feed",
		description: "Only show unread items in your forum feeds.",
		version: "1.0.0",
		matches: ["https://*.torn.com/forums.php*"],
		runAt: "document-start",
		grants: ["GM.getValue", "GM.getValues", "GM.setValue", "GM.setValues", "GM_addStyle", "unsafeWindow"],
	},
];
