import legacyOptionsHtml from "../options/index.html?raw";
import type {
	PreferenceFieldDefinition,
	PreferenceGroupDefinition,
	PreferenceGroupId,
	PreferenceSectionDefinition,
	PreferenceSectionId,
	PreferenceSubgroupDefinition,
} from "./types";
import { PREFERENCE_GROUP_IDS, PREFERENCE_SECTION_IDS } from "./types";

type SectionCategory = PreferenceSectionDefinition["category"];

const GROUP_DEFINITIONS: PreferenceGroupDefinition[] = [
	{
		id: "general",
		title: "General",
		description: "Extension-wide defaults, presentation, and formatting preferences.",
	},
	{
		id: "interface",
		title: "Interface",
		description: "How TornTools looks and behaves across the main UI, chat, sidebar, and popup.",
	},
	{
		id: "notifications",
		title: "Notifications",
		description: "Browser notifications, delivery behavior, sounds, timers, and alert thresholds.",
	},
	{
		id: "data-api",
		title: "Data & API",
		description: "Torn API credentials, polling cadence, and API-related page behavior.",
	},
	{
		id: "integrations",
		title: "Integrations",
		description: "Third-party service connections, permissions, and alternative API keys.",
	},
	{
		id: "automation",
		title: "Automation",
		description: "Workflow helpers, automation toggles, scripts, and custom aliases.",
	},
	{
		id: "pages",
		title: "Pages",
		description: "Page-specific enhancements organized by gameplay domain instead of legacy page routes.",
	},
] as const;

export const EXTERNAL_SERVICES = [
	{
		id: "tornstats",
		name: "TornStats",
		origin: "https://www.tornstats.com/*",
		description: "Your API key is used to authenticate.",
		links: [
			{ label: "Website", href: "https://tornstats.com/" },
			{ label: "Terms of Service", href: "https://tornstats.com/tos" },
		],
	},
	{
		id: "yata",
		name: "YATA",
		origin: "https://yata.yt/*",
		description: "Your API key is used to authenticate.",
		links: [
			{ label: "Website", href: "https://yata.yt/" },
			{ label: "Terms of Service", href: "https://yata.yt/tos" },
		],
	},
	{
		id: "prometheus",
		name: "Prometheus",
		origin: "https://prombot.co.uk:8443/*",
		description: "Your API key is not shared with this service.",
		links: [],
	},
	{
		id: "lzpt",
		name: "LZPT",
		origin: "https://api.lzpt.io/*",
		description: "Your API key is not shared with this service.",
		links: [],
	},
	{
		id: "tornw3b",
		name: "TornW3B",
		origin: "https://weav3r.dev/*",
		description: "Your API key is not used to authenticate at this time, but it may be in the future.",
		links: [
			{ label: "Website", href: "https://weav3r.dev" },
			{ label: "Terms of Service", href: "https://weav3r.dev/terms-of-service" },
		],
	},
	{
		id: "ffScouter",
		name: "FFScouter",
		origin: "https://ffscouter.com/*",
		description: "Your API key is used to authenticate.",
		links: [{ label: "Website + Terms of Service", href: "https://ffscouter.com" }],
	},
	{
		id: "tornintel",
		name: "Torn Intel",
		origin: "https://torn-intel.com/*",
		description: "Your API key is not shared with this service.",
		links: [
			{ label: "Website", href: "https://torn-intel.com" },
			{ label: "Terms", href: "https://torn-intel.com/terms" },
		],
	},
] as const;

export const CHAT_TITLE_COLOR_OPTIONS = [
	{ value: "red", label: "Red" },
	{ value: "orange", label: "Orange" },
	{ value: "yellow", label: "Yellow" },
	{ value: "green", label: "Green" },
	{ value: "blue", label: "Blue" },
	{ value: "pink", label: "Pink" },
	{ value: "purple", label: "Purple" },
	{ value: "gray", label: "Gray" },
	{ value: "black", label: "Black" },
] as const;

export const NOTIFICATION_SOUND_OPTIONS = [
	{ value: "default", label: "OS default" },
	{ value: "mute", label: "Mute" },
	{ value: "1", label: "Sound 1" },
	{ value: "2", label: "Sound 2" },
	{ value: "3", label: "Sound 3" },
	{ value: "4", label: "Sound 4" },
	{ value: "5", label: "Sound 5" },
	{ value: "custom", label: "Custom" },
] as const;

export const POPUP_DEFAULT_TAB_OPTIONS = [
	{ value: "dashboard", label: "Dashboard" },
	{ value: "market", label: "Market search" },
	{ value: "calculator", label: "Calculator" },
	{ value: "stocks", label: "Stocks overview" },
	{ value: "notifications", label: "Notifications history" },
] as const;

export const BLOOD_BAG_OPTIONS = [
	{ value: "none", label: "None" },
	{ value: "o+", label: "O+" },
	{ value: "o-", label: "O-" },
	{ value: "a+", label: "A+" },
	{ value: "a-", label: "A-" },
	{ value: "b+", label: "B+" },
	{ value: "b-", label: "B-" },
	{ value: "ab+", label: "AB+" },
	{ value: "ab-", label: "AB-" },
] as const;

export const SECTION_DEFINITIONS: PreferenceSectionDefinition[] = [
	section("general", "General", "core", "Core extension behavior, themes, formatting, and export defaults."),
	section("global", "Global", "core", "Page-wide behaviors and revive provider settings."),
	section("api-usage", "API Usage", "core", "Polling cadence and Torn API selections."),
	section("api-key", "API Key", "core", "Manage the Torn API key used by the extension."),
	section("chat", "Chat", "core", "Chat quality-of-life settings and highlight rules."),
	section("sidebar", "Sidebar", "core", "Sidebar widgets, custom links, and icon visibility."),
	section("popup", "Popup", "core", "Popup tabs, defaults, and dashboard widgets."),
	section("notifications", "Notifications", "core", "Browser notifications, sounds, and alert thresholds."),
	section("external", "External Services", "core", "Integrations that talk to third-party services."),
	section("competition", "Competitions", "core", "Competition-specific helpers and alerts."),
	section("achievements", "Achievements", "scripts", "Script controls for the achievements page."),
	section("no-confirm", "No Confirm", "scripts", "Skip repetitive confirmation prompts."),
	section("last-action", "Last Action", "scripts", "Last-action overlays in faction and company views."),
	section("stats-estimate", "Stats Estimate", "scripts", "Battle stat estimation behavior across the UI."),
	section("user-alias", "User Alias", "scripts", "Custom aliases that replace player names."),
	section("ff-scouter", "FF Scouter", "scripts", "Where FF Scouter widgets are shown."),
	section("home", "Home", "pages", "Enhancements for the home page."),
	section("items", "Items", "pages", "Item page helpers, values, and set completion tools."),
	section("city", "City", "pages", "City item helpers and duplicate handling."),
	section("companies", "Companies", "pages", "Company page information and inactivity warnings."),
	section("bazaar", "Bazaar", "pages", "Bazaar pricing and purchase helpers."),
	section("bounties", "Bounties", "pages", "Bounty-page filters and helpers."),
	section("gym", "Gym", "pages", "Gym graphs, steadfast, and training helpers."),
	section("properties", "Properties", "pages", "Property value and happiness helpers."),
	section("education", "Education", "pages", "Education progress and finish-time helpers."),
	section("crimes", "Crimes", "pages", "Classic crimes quick actions."),
	section("crimes2", "Crimes 2.0", "pages", "Crime 2.0 filters and value helpers."),
	section("missions", "Missions", "pages", "Mission hints and reward visibility."),
	section("userlist", "Userlist", "pages", "Userlist filtering."),
	section("jail", "Jail", "pages", "Jail filtering."),
	section("bank", "Bank Investment", "pages", "Investment timing details."),
	section("casino", "Casino", "pages", "Casino overlays and hidden game controls."),
	section("forums", "Forums", "pages", "Forum helpers and debugging controls."),
	section("events", "Events", "pages", "Event value helpers."),
	section("faction", "Faction", "pages", "Faction reports, filters, and inactivity warnings."),
	section("profile", "Profile", "pages", "Profile overlays, spy tools, and ally warnings."),
	section("stock-exchange", "Stock Exchange", "pages", "Stock tools and hidden stock controls."),
	section("travel", "Travel", "pages", "Travel timers, filters, and rehab helpers."),
	section("trade", "Trade", "pages", "Trade values and quick chat access."),
	section("display-case", "Display Case", "pages", "Display case worth helpers."),
	section("racing", "Raceway", "pages", "Racing filters and stat helpers."),
	section("shops", "Shops", "pages", "Shop pricing, filters, and profit helpers."),
	section("attack", "Attack", "pages", "Attack warnings and button visibility."),
	section("itemmarket", "Item Market", "pages", "Item Market fills and cheap-item alerts."),
	section("museum", "Museum", "pages", "Museum auto-fill helpers."),
	section("api", "API", "pages", "API playground quality-of-life controls."),
	section("auction-house", "Auction House", "pages", "Auction filters."),
	section("enemies", "Enemies", "pages", "Enemy list filtering."),
	section("friends", "Friends", "pages", "Friend list filtering."),
	section("targets", "Targets", "pages", "Target list filtering."),
];

const GROUP_SUBGROUPS: Record<PreferenceGroupId, PreferenceSubgroupDefinition[]> = {
	general: [],
	interface: [
		{ id: "global", title: "Global", description: "Page-wide behaviors and revive-provider settings.", sections: ["global"] },
		{ id: "chat", title: "Chat", description: "Chat quality-of-life settings and highlight editors.", sections: ["chat"] },
		{ id: "sidebar", title: "Sidebar", description: "Sidebar widgets, custom links, and icon visibility.", sections: ["sidebar"] },
		{ id: "popup", title: "Popup", description: "Popup tabs, defaults, and icon bar widgets.", sections: ["popup"] },
	],
	notifications: [],
	"data-api": [
		{ id: "key", title: "API Key", description: "The main Torn API key used by the extension.", sections: ["api-key"] },
		{ id: "polling", title: "Polling", description: "Refresh cadence and request delay controls.", sections: ["api-usage"] },
		{ id: "api-page", title: "API Page", description: "Quality-of-life settings for the API page.", sections: ["api"] },
	],
	integrations: [],
	automation: [
		{
			id: "workflow",
			title: "Workflow",
			description: "Achievements, confirmations, overlays, and stat-estimate behavior.",
			sections: ["achievements", "no-confirm", "last-action", "stats-estimate"],
		},
		{
			id: "ff-scouter",
			title: "FF Scouter",
			description: "Where FF Scouter widgets are shown.",
			sections: ["ff-scouter"],
		},
		{
			id: "competition",
			title: "Competitions",
			description: "Competition-specific helpers and alerts.",
			sections: ["competition"],
		},
		{
			id: "aliases",
			title: "Aliases",
			description: "Custom aliases that replace player names.",
			sections: ["user-alias"],
		},
	],
	pages: [
		{
			id: "economy",
			title: "Economy",
			description: "Markets, trading, collections, and finance-related pages.",
			sections: ["items", "bazaar", "trade", "shops", "itemmarket", "auction-house", "museum", "display-case", "stock-exchange"],
		},
		{
			id: "combat-targeting",
			title: "Combat & Targeting",
			description: "Attack pages, profiles, bounties, and target lists.",
			sections: ["attack", "profile", "bounties", "enemies", "friends", "targets", "userlist", "jail"],
		},
		{
			id: "travel-city",
			title: "Travel & City",
			description: "Travel flow, city pages, property, and banking helpers.",
			sections: ["travel", "city", "properties", "bank"],
		},
		{
			id: "faction-social",
			title: "Faction & Social",
			description: "Faction, forums, events, and company-related helpers.",
			sections: ["faction", "forums", "events", "companies"],
		},
		{
			id: "progression-activities",
			title: "Progression & Activities",
			description: "Home, gym, education, crimes, missions, and racing helpers.",
			sections: ["home", "gym", "education", "missions", "crimes", "crimes2", "casino", "racing"],
		},
	],
};

const SECTION_TO_GROUP = new Map<PreferenceSectionId, PreferenceGroupId>([
	["general", "general"],
	["global", "interface"],
	["chat", "interface"],
	["sidebar", "interface"],
	["popup", "interface"],
	["notifications", "notifications"],
	["api-key", "data-api"],
	["api-usage", "data-api"],
	["api", "data-api"],
	["external", "integrations"],
	["competition", "automation"],
	["achievements", "automation"],
	["no-confirm", "automation"],
	["last-action", "automation"],
	["stats-estimate", "automation"],
	["user-alias", "automation"],
	["ff-scouter", "automation"],
	["home", "pages"],
	["items", "pages"],
	["city", "pages"],
	["companies", "pages"],
	["bazaar", "pages"],
	["bounties", "pages"],
	["gym", "pages"],
	["properties", "pages"],
	["education", "pages"],
	["crimes", "pages"],
	["crimes2", "pages"],
	["missions", "pages"],
	["userlist", "pages"],
	["jail", "pages"],
	["bank", "pages"],
	["casino", "pages"],
	["forums", "pages"],
	["events", "pages"],
	["faction", "pages"],
	["profile", "pages"],
	["stock-exchange", "pages"],
	["travel", "pages"],
	["trade", "pages"],
	["display-case", "pages"],
	["racing", "pages"],
	["shops", "pages"],
	["attack", "pages"],
	["itemmarket", "pages"],
	["museum", "pages"],
	["auction-house", "pages"],
	["enemies", "pages"],
	["friends", "pages"],
	["targets", "pages"],
]);

const PAGE_SOURCE_MAP = {
	competition: { path: ["pages", "competitions"], prefix: "competitions" },
	home: { path: ["pages", "home"], prefix: "home" },
	items: { path: ["pages", "items"], prefix: "items" },
	city: { path: ["pages", "city"], prefix: "city" },
	companies: { path: ["pages", "companies"], prefix: "companies" },
	bazaar: { path: ["pages", "bazaar"], prefix: "bazaar" },
	bounties: { path: ["pages", "bounties"], prefix: "bounties" },
	gym: { path: ["pages", "gym"], prefix: "gym" },
	properties: { path: ["pages", "property"], prefix: "properties" },
	education: { path: ["pages", "education"], prefix: "education" },
	crimes: { path: ["pages", "crimes"], prefix: "crimes" },
	crimes2: { path: ["pages", "crimes2"], prefix: "crimes2" },
	missions: { path: ["pages", "missions"], prefix: "missions" },
	userlist: { path: ["pages", "userlist"], prefix: "userlist" },
	jail: { path: ["pages", "jail"], prefix: "jail" },
	bank: { path: ["pages", "bank"], prefix: "bank" },
	casino: { path: ["pages", "casino"], prefix: "casino" },
	forums: { path: ["pages", "forums"], prefix: "forums" },
	events: { path: ["pages", "events"], prefix: "events" },
	faction: { path: ["pages", "faction"], prefix: "faction" },
	profile: { path: ["pages", "profile"], prefix: "profile" },
	"stock-exchange": { path: ["pages", "stocks"], prefix: "stock-exchange" },
	travel: { path: ["pages", "travel"], prefix: "travel" },
	trade: { path: ["pages", "trade"], prefix: "trade" },
	"display-case": { path: ["pages", "displayCase"], prefix: "display-case" },
	racing: { path: ["pages", "racing"], prefix: "racing" },
	shops: { path: ["pages", "shops"], prefix: "shops" },
	attack: { path: ["pages", "attack"], prefix: "attack" },
	itemmarket: { path: ["pages", "itemmarket"], prefix: "itemmarket" },
	museum: { path: ["pages", "museum"], prefix: "museum" },
	api: { path: ["pages", "api"], prefix: "api" },
	"auction-house": { path: ["pages", "auction"], prefix: "auction-house" },
	enemies: { path: ["pages", "enemies"], prefix: "enemies" },
	friends: { path: ["pages", "friends"], prefix: "friends" },
	targets: { path: ["pages", "targets"], prefix: "targets" },
} as const satisfies Partial<Record<PreferenceSectionId, { path: string[]; prefix: string }>>;

const SCRIPT_SOURCE_MAP = {
	achievements: { path: ["scripts", "achievements"], prefix: "achievements" },
	"no-confirm": { path: ["scripts", "noConfirm"], prefix: "no-confirm" },
	"last-action": { path: ["scripts", "lastAction"], prefix: "last-action" },
	"stats-estimate": { path: ["scripts", "statsEstimate"], prefix: "stats-estimate" },
	"ff-scouter": { path: ["scripts", "ffScouter"], prefix: "ff-scouter" },
} as const satisfies Partial<Record<PreferenceSectionId, { path: string[]; prefix: string }>>;

const SELECT_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
	"items-highlightBloodBags": [...BLOOD_BAG_OPTIONS],
	"popup-defaultTab": [...POPUP_DEFAULT_TAB_OPTIONS],
};

const legacyFieldCatalog = buildLegacyFieldCatalog();

export const PREFERENCE_GROUP_DEFINITIONS = GROUP_DEFINITIONS;

export function normalizePreferenceSectionId(section?: string | null): PreferenceSectionId {
	return PREFERENCE_SECTION_IDS.includes(section as PreferenceSectionId) ? (section as PreferenceSectionId) : "general";
}

export function normalizePreferenceGroupId(section?: string | null): PreferenceGroupId {
	if (PREFERENCE_GROUP_IDS.includes(section as PreferenceGroupId)) return section as PreferenceGroupId;
	if (PREFERENCE_SECTION_IDS.includes(section as PreferenceSectionId)) return getPreferenceGroupForSection(section as PreferenceSectionId);
	return "general";
}

export function getPreferenceRoute(group: PreferenceGroupId) {
	return group === "general" ? "/preferences" : `/preferences/${group}`;
}

export function getPreferenceSectionDefinition(section: PreferenceSectionId) {
	return SECTION_DEFINITIONS.find(({ id }) => id === section) ?? SECTION_DEFINITIONS[0];
}

export function getPreferenceGroupDefinition(group: PreferenceGroupId) {
	return GROUP_DEFINITIONS.find(({ id }) => id === group) ?? GROUP_DEFINITIONS[0];
}

export function getPreferenceGroupSubgroups(group: PreferenceGroupId) {
	return GROUP_SUBGROUPS[group];
}

export function getPreferenceSubgroupDefinition(group: PreferenceGroupId, subgroup?: string | null) {
	return GROUP_SUBGROUPS[group].find(({ id }) => id === subgroup);
}

export function getPreferenceGroupForSection(section: PreferenceSectionId) {
	return SECTION_TO_GROUP.get(section) ?? "general";
}

export function getPreferenceSubgroupForSection(section: PreferenceSectionId) {
	const group = getPreferenceGroupForSection(section);
	return GROUP_SUBGROUPS[group].find((subgroup) => subgroup.sections.includes(section));
}

export function getPreferenceSectionsForGroup(group: PreferenceGroupId) {
	return SECTION_DEFINITIONS.filter((section) => getPreferenceGroupForSection(section.id) === group).map(({ id }) => id);
}

export function getPreferenceSubgroupRoute(group: PreferenceGroupId, subgroup?: string | null) {
	if (!subgroup || !getPreferenceSubgroupDefinition(group, subgroup)) return getPreferenceRoute(group);
	return `${getPreferenceRoute(group)}/${subgroup}`;
}

export function resolvePreferenceRoute(
	section?: string | null,
	subgroup?: string | null,
	getStoredSubgroup?: (group: PreferenceGroupId, subgroups: PreferenceSubgroupDefinition[]) => string,
) {
	const group = normalizePreferenceGroupId(section);
	const subgroups = getPreferenceGroupSubgroups(group);
	const sectionId = PREFERENCE_SECTION_IDS.includes(section as PreferenceSectionId) ? (section as PreferenceSectionId) : null;
	const groupId = PREFERENCE_GROUP_IDS.includes(section as PreferenceGroupId) ? (section as PreferenceGroupId) : null;

	if (sectionId) {
		const mappedSubgroup = getPreferenceSubgroupForSection(sectionId)?.id ?? "";
		return {
			group,
			subgroup: mappedSubgroup,
			route: getPreferenceSubgroupRoute(group, mappedSubgroup),
		};
	}

	if (!subgroups.length) {
		return {
			group,
			subgroup: "",
			route: getPreferenceRoute(group),
		};
	}

	const subgroupId = getPreferenceSubgroupDefinition(group, subgroup)?.id ?? getStoredSubgroup?.(groupId ?? group, subgroups) ?? subgroups[0]?.id ?? "";

	return {
		group,
		subgroup: subgroupId,
		route: getPreferenceSubgroupRoute(group, subgroupId),
	};
}

export function getSectionFields(section: PreferenceSectionId, settings: Record<string, any>): PreferenceFieldDefinition[] {
	switch (section) {
		case "general":
			return [
				field("updateNotice", "toggle", ["updateNotice"]),
				field("developer", "toggle", ["developer"]),
				field("featureDisplay", "toggle", ["featureDisplay"]),
				field("featureDisplayOnlyFailed", "toggle", ["featureDisplayOnlyFailed"]),
				field("featureDisplayHideDisabled", "toggle", ["featureDisplayHideDisabled"]),
				field("featureDisplayHideEmpty", "toggle", ["featureDisplayHideEmpty"]),
				field("themes-pages", "radio", ["themes", "pages"], {
					label: "Page theme",
					options: [
						{
							value: "default",
							label: "OS Default",
							description: "Might not work on every browser; falls back to light when unsupported.",
						},
						{ value: "light", label: "Light" },
						{ value: "dark", label: "Dark" },
					],
				}),
				field("themes-container", "radio", ["themes", "containers"], {
					label: "Container theme",
					options: [
						{ value: "default", label: "Default (green and black)" },
						{ value: "alternative", label: "Alternative (black and green)" },
					],
				}),
				field("formatting-date", "radio", ["formatting", "date"], {
					label: "Date format",
					options: [
						{ value: "eu", label: "DD.MM.YYYY" },
						{ value: "us", label: "MM/DD/YYYY" },
						{ value: "iso", label: "YYYY-MM-DD" },
					],
				}),
				field("formatting-tct", "toggle", ["formatting", "tct"]),
				field("formatting-time", "radio", ["formatting", "time"], {
					label: "Time format",
					options: [
						{ value: "eu", label: "24 hours" },
						{ value: "us", label: "12 hours" },
					],
				}),
				field("csvDelimiter", "text", ["csvDelimiter"]),
			];
		case "global":
			return autoFields(settings.pages.global, ["pages", "global"], "global", {
				exclude: ["reviveProvider"],
			});
		case "api-usage":
			return [
				field("api_usage-comment", "text", ["apiUsage", "comment"]),
				field("api_usage-essential", "number", ["apiUsage", "delayEssential"]),
				field("api_usage-basic", "number", ["apiUsage", "delayBasic"]),
				field("api_usage-stakeouts", "number", ["apiUsage", "delayStakeouts"]),
				...autoFields(settings.apiUsage.user, ["apiUsage", "user"], "api_usage-user_"),
			];
		case "chat":
			return autoFields(settings.pages.chat, ["pages", "chat"], "chat", {
				exclude: ["highlights", "titleHighlights"],
			});
		case "sidebar":
			return [
				...autoFields(settings.pages.sidebar, ["pages", "sidebar"], "sidebar", {
					exclude: ["npcLootTimesService"],
				}),
				field("sidebar-npcLootTimesService", "radio", ["pages", "sidebar", "npcLootTimesService"], {
					label: "NPC loot source",
					description: "Will use the selected service if more than one is enabled.",
					options: [
						{ value: "tornstats", label: "TornStats" },
						{ value: "yata", label: "YATA" },
						{ value: "loot-ranger", label: "Loot Rangers (service = LZPT)" },
					],
				}),
			];
		case "popup":
			return [
				...autoFields(settings.pages.popup, ["pages", "popup"], "popup", {
					overrides: {
						defaultTab: field("popup-defaultTab", "radio", ["pages", "popup", "defaultTab"], {
							label: "Default tab",
							options: [...POPUP_DEFAULT_TAB_OPTIONS],
						}),
					},
				}),
				...autoFields(settings.pages.icon, ["pages", "icon"], "icon"),
			];
		case "notifications":
			return [
				field("notification-tts", "toggle", ["notifications", "tts"]),
				field("notification-link", "toggle", ["notifications", "link"]),
				field("notification-requireInteraction", "toggle", ["notifications", "requireInteraction"]),
				...autoFields(settings.notifications.types, ["notifications", "types"], "notification_type-", {
					exclude: [
						"energy",
						"nerve",
						"happy",
						"life",
						"offline",
						"chainTimer",
						"chainTimerEnabled",
						"chainBonus",
						"chainBonusEnabled",
						"leavingHospital",
						"leavingHospitalEnabled",
						"landing",
						"landingEnabled",
						"cooldownDrug",
						"cooldownDrugEnabled",
						"cooldownBooster",
						"cooldownBoosterEnabled",
						"cooldownMedical",
						"cooldownMedicalEnabled",
						"missionsLimit",
						"missionsLimitEnabled",
						"missionsExpire",
						"missionsExpireEnabled",
						"npcs",
						"npcsGlobal",
						"npcPlanned",
						"npcPlannedEnabled",
						"stocks",
						"refillEnergy",
						"refillEnergyEnabled",
						"refillNerve",
						"refillNerveEnabled",
					],
				}),
			];
		case "competition":
			return autoFields(settings.pages.competitions, ["pages", "competitions"], "competitions");
		case "external":
		case "api-key":
		case "user-alias":
			return [];
		default: {
			if (section in PAGE_SOURCE_MAP) {
				const source = PAGE_SOURCE_MAP[section as keyof typeof PAGE_SOURCE_MAP];
				return autoFields(getValue(settings, source.path) ?? {}, source.path, source.prefix);
			}

			if (section in SCRIPT_SOURCE_MAP) {
				const source = SCRIPT_SOURCE_MAP[section as keyof typeof SCRIPT_SOURCE_MAP];
				return autoFields(getValue(settings, source.path) ?? {}, source.path, source.prefix);
			}

			return [];
		}
	}
}

export function getValue(source: Record<string, any>, path: string[]) {
	return path.reduce<any>((value, key) => value?.[key], source);
}

export function setValue(source: Record<string, any>, path: string[], value: unknown) {
	let current: Record<string, any> = source;
	for (const key of path.slice(0, -1)) {
		if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
			current[key] = {};
		}
		current = current[key] as Record<string, any>;
	}
	current[path.at(-1)!] = value;
}

export function buildPreferenceSearchIndex(sectionFields: Array<{ section: PreferenceSectionId; fields: PreferenceFieldDefinition[] }>) {
	return sectionFields.flatMap(({ section, fields }) =>
		fields.map((field) => ({
			id: `${section}:${field.id}`,
			section,
			label: field.label,
			description: field.description ?? "",
		})),
	);
}

function section(id: PreferenceSectionId, title: string, category: SectionCategory, description: string): PreferenceSectionDefinition {
	return { id, title, category, description };
}

function field(
	id: string,
	type: PreferenceFieldDefinition["type"],
	path: string[],
	overrides: Partial<PreferenceFieldDefinition> = {},
): PreferenceFieldDefinition {
	const metadata = legacyFieldCatalog.get(id);
	return {
		id,
		type,
		path,
		label: overrides.label ?? metadata?.label ?? humanize(path.at(-1) ?? id),
		description: overrides.description ?? metadata?.description,
		options: overrides.options,
		min: overrides.min,
		max: overrides.max,
		step: overrides.step,
		placeholder: overrides.placeholder,
		allowEmpty: overrides.allowEmpty,
	};
}

function autoFields(
	source: Record<string, any>,
	basePath: string[],
	prefix: string,
	options: {
		exclude?: string[];
		overrides?: Record<string, PreferenceFieldDefinition>;
	} = {},
): PreferenceFieldDefinition[] {
	return Object.entries(source)
		.filter(([key, value]) => {
			if (options.exclude?.includes(key)) return false;
			if (Array.isArray(value)) return false;
			return typeof value === "boolean" || typeof value === "number" || typeof value === "string";
		})
		.map(([key, value]) => {
			if (options.overrides?.[key]) return options.overrides[key];

			const id = `${prefix}${prefix.endsWith("_") ? "" : "-"}${key}`;
			const legacyId = prefix.endsWith("_") ? `${prefix}${key}` : id;
			const selectOptions = SELECT_OPTIONS[legacyId];

			if (selectOptions) {
				return field(legacyId, "select", [...basePath, key], { options: selectOptions });
			}

			if (typeof value === "boolean") return field(legacyId, "toggle", [...basePath, key]);
			if (typeof value === "number") return field(legacyId, "number", [...basePath, key]);

			return field(legacyId, "text", [...basePath, key], { allowEmpty: value === "" });
		});
}

function buildLegacyFieldCatalog() {
	const parser = new DOMParser();
	const documentFragment = parser.parseFromString(legacyOptionsHtml, "text/html");
	const labels = new Map<string, { label?: string; notes: string[] }>();

	documentFragment.querySelectorAll<HTMLLabelElement>("#preferences label[for]").forEach((label) => {
		const id = label.htmlFor;
		if (!id) return;

		const entry = labels.get(id) ?? { notes: [] };
		const text = label.textContent?.replace(/\s+/g, " ").trim();
		if (!text) return;

		if (label.classList.contains("note")) entry.notes.push(text);
		else if (!entry.label) entry.label = text.replace(/\.$/, "");

		labels.set(id, entry);
	});

	documentFragment.querySelectorAll<HTMLElement>("#preferences .note:not(label)").forEach((note) => {
		const option = note.closest<HTMLElement>(".option");
		if (!option) return;

		const input = option.querySelector<HTMLInputElement | HTMLSelectElement>("input[id], select[id]");
		const id = input?.id;
		if (!id) return;

		const entry = labels.get(id) ?? { notes: [] };
		const text = note.textContent?.replace(/\s+/g, " ").trim();
		if (text) entry.notes.push(text);
		labels.set(id, entry);
	});

	return new Map(
		Array.from(labels.entries()).map(([id, entry]) => [
			id,
			{
				label: entry.label ?? humanize(id),
				description: entry.notes.length ? entry.notes.join(" ") : undefined,
			},
		]),
	);
}

function humanize(input: string) {
	return input
		.replace(/[_-]/g, " ")
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/\bapi\b/gi, "API")
		.replace(/\btts\b/gi, "TTS")
		.replace(/\bnpc\b/gi, "NPC")
		.replace(/\boc\b/gi, "OC")
		.replace(/\brw\b/gi, "RW")
		.replace(/\bff\b/gi, "FF")
		.replace(/\bid\b/g, "ID")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^./, (value) => value.toUpperCase());
}
