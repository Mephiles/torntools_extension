async function setBadge(type, options = {}) {
	if (SCRIPT_TYPE !== "BACKGROUND") return false;

	options = {
		events: 0,
		messages: 0,
		...options,
	};

	const TYPES = {
		default: { text: "" },
		error: { text: "error", color: "#FF0000" },
		count: {
			text: async () => {
				if (options.events && options.messages) return `${options.events}/${options.messages}`;
				else if (options.events) return options.events.toString();
				else if (options.messages) return options.messages.toString();
				else return (await getBadgeText()) === "error" ? "error" : false;
			},
			color: async () => {
				if (options.events && options.messages) return "#1ed2ac";
				else if (options.events) return "#009eda";
				else if (options.messages) return "#84af03";
				else return (await getBadgeText()) === "error" ? "error" : false;
			},
		},
	};

	const badge = TYPES[type];
	if (typeof badge.text === "function") badge.text = await badge.text();
	if (typeof badge.color === "function") badge.color = await badge.color();
	if (!badge.text) badge.text = "";

	chrome.action.setBadgeText({ text: badge.text || "" });
	if (badge.color) chrome.action.setBadgeBackgroundColor({ color: badge.color });
}

function getBadgeText() {
	if (SCRIPT_TYPE !== "BACKGROUND") return Promise.resolve(false);

	return new Promise((resolve) => chrome.action.getBadgeText({}, resolve));
}
