export interface PreferenceSection {
	id: string;
	title: string;
}

export interface PreferenceGroup {
	id: PreferenceGroupId;
	title: string;
	sections?: readonly PreferenceSection[];
}

export type PreferenceGroupId = "internal" | "global";

export const PREFERENCE_GROUPS = [
	{
		id: "internal",
		title: "Internal",
		sections: [
			{ id: "internal", title: "Internal" },
			{ id: "popup", title: "Popup" },
			{ id: "notifications", title: "Notifications" },
			{ id: "api", title: "API" },
		],
	},
	{
		id: "global",
		title: "Global",
		sections: [
			{ id: "global", title: "Global" },
			{ id: "sidebar", title: "Sidebar" },
			{ id: "chat", title: "Chat" },
		],
	},
] as const satisfies readonly PreferenceGroup[];
export const DEFAULT_GROUP_ID: PreferenceGroupId = "internal";
