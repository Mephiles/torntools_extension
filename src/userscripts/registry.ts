export interface UserscriptDefinition {
	name: string;
	description: string;
	version: string;
	matches: string[];
	runAt: "document-start" | "document-body" | "document-end" | "document-idle";
}

export const USERSCRIPTS: UserscriptDefinition[] = [
	{
		name: "Only New Feed",
		description: "Only show unread items in your forum feeds.",
		version: "1.0.4",
		matches: ["https://*.torn.com/forums.php*"],
		runAt: "document-end",
	},
	{
		name: "Specialist Gyms",
		description: "Calculate your stat ratio for activating your specialist gyms.",
		version: "1.0.2",
		matches: ["https://*.torn.com/gym.php*"],
		runAt: "document-end",
	},
];
