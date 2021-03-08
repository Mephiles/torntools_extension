"use strict";

(async () => {
	let highlights;

	const feature = featureManager.registerFeature(
		"Chat Highlight",
		"global",
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
		window.addEventListener(EVENT_CHANNELS.CHAT_MESSAGE, (event) => {
			if (!feature.enabled()) return;

			applyHighlights(event.detail.message);
		});
		window.addEventListener(EVENT_CHANNELS.CHAT_OPENED, (event) => {
			if (!feature.enabled()) return;

			for (let message of event.detail.chat.findAll("[class*='message_']")) {
				applyHighlights(message);
			}
		});
	}

	function readSettings() {
		highlights = settings.pages.chat.highlights.map((highlight) => {
			let { name, color } = highlight;

			for (let placeholder of HIGHLIGHT_PLACEHOLDERS) {
				if (name !== placeholder.name) continue;

				name = placeholder.value();
				break;
			}

			return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
		});

		requireChatsLoaded().then(() => {
			removeHighlights();

			for (let message of document.findAll("[class*='chat-box-content_'] [class*='overview_'] [class*='message_']")) {
				applyHighlights(message);
			}
		});
	}

	function applyHighlights(message) {
		if (!message) return;
		if (!message.find) console.log("DKK highlightChat 1", { message });
		if (!highlights.length) return;

		const sender = simplify(message.find("a").innerText).slice(0, -1);
		const words = message.find("span").innerText.split(" ").map(simplify);

		const senderHighlights = highlights.filter(({ name }) => name === sender);
		if (senderHighlights.length) {
			message.find("a").style.color = senderHighlights[0].senderColor;
			message.find("a").classList.add("tt-highlight");
		}

		for (let { name, color } of highlights) {
			if (!words.includes(name)) continue;

			message.find("span").parentElement.style.backgroundColor = color;
			message.find("span").classList.add("tt-highlight");
			break;
		}

		function simplify(text) {
			return text.toLowerCase().trim();
		}
	}

	function removeHighlights() {
		for (let message of document.findAll("[class*='chat-box-content_'] [class*='overview_'] [class*='message_'] .tt-highlight")) {
			message.style.color = "unset";
			message.classList.remove("tt-highlight");
		}
	}
})();
