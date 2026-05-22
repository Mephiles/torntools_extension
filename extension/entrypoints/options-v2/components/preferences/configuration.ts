export interface PreferenceSection {
	id: string;
	title: string;
}

export interface PreferenceGroup {
	id: PreferenceGroupId;
	title: string;
	sections?: readonly PreferenceSection[];
}

export type PreferenceGroupId = "internal" | "global" | "financial" | "qol";

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
			{ id: "advanced", title: "Advanced" },
		],
	},
	{
		id: "financial",
		title: "Financial",
		sections: [
			{ id: "money", title: "Money" },
			{ id: "markets", title: "Markets" },
			{ id: "items", title: "Items" },
		],
	},
	{
		id: "qol",
		title: "QoL",
		sections: [
			{ id: "information", title: "Information" },
			{ id: "combat", title: "Combat" },
			{ id: "travel", title: "Travel" },
			{ id: "faction", title: "Faction" },
			{ id: "profile", title: "Profile" },
			{ id: "companies", title: "Companies" },
			{ id: "gym", title: "Gym" },
			{ id: "speed", title: "Speed" },
		],
	},
] as const satisfies readonly PreferenceGroup[];
export const DEFAULT_GROUP_ID: PreferenceGroupId = "internal";
