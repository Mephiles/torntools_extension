"use strict";

(async () => {
	if (is2FACheckPage()) return;

	let highlights;

	const feature = featureManager.registerFeature(
		"Chat Highlight",
		"chat",
		() => settings.pages.chat.highlights.length,
		initialiseHighlights,
		readSettings,
		removeHighlights,
		{
			storage: ["settings.pages.chat.highlights"],
		},
		null
	);

	function initialiseHighlights() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (!feature.enabled()) return;

			applyHighlights(message.find("[class*='chat-box-body__message-box__']"));
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			for (const message of chat.findAll("[class*='chat-box-body__'] [class*='chat-box-body__message-box__']")) {
				applyHighlights(message);
			}
		});
	}

	function readSettings() {
		highlights = settings.pages.chat.highlights.map((highlight) => {
			let { name, color } = highlight;

			for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
				if (name !== placeholder.name) continue;

				name = placeholder.value();
				break;
			}

			return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
		});

		requireChatsLoaded().then(() => {
			removeHighlights();

			for (const message of document.findAll("[class*='chat-box-body__'] [class*='chat-box-body__message-box__']")) {
				applyHighlights(message);
			}
		});
	}

	function applyHighlights(message) {
		if (!message) return;
		if (!highlights.length) return;

		const sender = simplify(message.find("[class*='chat-box-body__sender-button__'] a").textContent);
		const words = message.lastElementChild.textContent.split(" ").map(simplify);

		const senderHighlights = highlights.filter(({ name }) => name === sender || name === "*");
		if (senderHighlights.length) {
			// When message sender is in highlights.
			message.style.border = `1px solid ${senderHighlights[0].senderColor}`;
		}

		for (const { name, color } of highlights) {
			// When word includes a name in highlights.
			if (!words.includes(name)) continue;

			message.style.backgroundColor = color;
			break;
		}

		function simplify(text) {
			return text.toLowerCase().trim();
		}
	}

	function removeHighlights() {
		for (const message of document.findAll("[class*='chat-box-body__'] [class*='chat-box-body__message-box__'][style]")) {
			message.style = "";
		}
	}
})();
