interface BadgeOptions {
	events: number;
	messages: number;
}

const BADGE_TYPES = {
	default: { text: "", color: null },
	error: { text: "error", color: "#FF0000" },
	count: {
		text: async (options: BadgeOptions) => {
			if (options.events && options.messages) return `${options.events}/${options.messages}`;
			else if (options.events) return options.events.toString();
			else if (options.messages) return options.messages.toString();
			else return (await getBadgeText()) === "error" ? "error" : null;
		},
		color: async (options: BadgeOptions) => {
			if (options.events && options.messages) return "#1ed2ac";
			else if (options.events) return "#009eda";
			else if (options.messages) return "#84af03";
			else return (await getBadgeText()) === "error" ? "error" : null;
		},
	},
} satisfies {
	[key: string]: {
		text: string | ((options: BadgeOptions) => Promise<string | null>) | null;
		color: string | ((options: BadgeOptions) => Promise<string | null>) | null;
	};
};

async function setBadge(type: keyof typeof BADGE_TYPES, partialOptions: Partial<BadgeOptions> = {}): Promise<boolean> {
	if (SCRIPT_TYPE !== "BACKGROUND") return false;

	const options: BadgeOptions = {
		events: 0,
		messages: 0,
		...partialOptions,
	};

	const badge = BADGE_TYPES[type];
	if (typeof badge.text === "function") badge.text = await badge.text(options);
	if (typeof badge.color === "function") badge.color = await badge.color(options);
	if (!badge.text) badge.text = "";

	void chrome.action.setBadgeText({ text: badge.text || "" });
	if (badge.color) void chrome.action.setBadgeBackgroundColor({ color: badge.color });
	return true;
}

function getBadgeText(): Promise<string | null> {
	if (SCRIPT_TYPE !== "BACKGROUND") return Promise.resolve(null);

	return chrome.action.getBadgeText({});
}
