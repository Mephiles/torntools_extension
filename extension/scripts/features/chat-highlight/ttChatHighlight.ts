(async () => {
	if (is2FACheckPage()) return;

	let highlights: HighlightColor[];

	const feature = featureManager.registerFeature(
		"Chat Highlight",
		"chat",
		() => !!settings.pages.chat.highlights.length,
		initialiseHighlights,
		readSettings,
		removeHighlights,
		{
			storage: ["settings.pages.chat.highlights"],
		},
		null
	);

	interface HighlightColor {
		name: string;
		color: string;
		senderColor: string;
	}

	function initialiseHighlights() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (!feature.enabled()) return;

			const messageBox = message.find("[class*='chat-box-message__box__']");
			if (messageBox) applyV2Highlights(messageBox);
			else applyV3Highlights(message);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			for (const message of chat.findAll("[class*='chat-box-body__'] [class*='chat-box-message__box__']")) {
				applyV2Highlights(message);
			}
			for (const message of chat.findAll("[class*='list__'] > [class*='root__']")) {
				applyV3Highlights(message);
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REFRESHED].push((information) => {
			if (!feature.enabled()) return;

			if (information) {
				const { chat } = information;
				for (const message of chat.findAll("[class*='list__'] > [class*='root__']")) {
					applyV3Highlights(message);
				}
			} else {
				for (const message of document.findAll("[class*='chat-box-body__'] [class*='chat-box-message__box__']")) {
					applyV2Highlights(message);
				}
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_RECONNECTED].push(() => {
			if (!feature.enabled()) return;

			for (const message of document.findAll("[class*='list__'] > [class*='root__']")) {
				applyV3Highlights(message);
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.WINDOW__FOCUS].push(() => {
			if (!feature.enabled()) return;

			applyAllHighlights();
		});
	}

	function readSettings() {
		highlights = settings.pages.chat.highlights.map<HighlightColor>((highlight) => {
			let { name, color } = highlight;

			for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
				if (name !== placeholder.name) continue;

				name = placeholder.value();
				break;
			}

			return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
		});

		applyAllHighlights();
	}

	function applyAllHighlights() {
		requireChatsLoaded().then(() => {
			removeHighlights();

			for (const message of document.findAll("[class*='chat-box-body__'] [class*='chat-box-message__box__']")) {
				applyV2Highlights(message);
			}
			for (const message of document.findAll("[class*='list__'] > [class*='root__']")) {
				applyV3Highlights(message);
			}
		});
	}

	function applyV2Highlights(message: HTMLElement) {
		if (!message) return;
		if (!highlights?.length) return;

		const sender = simplify(message.find("[class*='chat-box-message__sender__']").textContent.replace(":", ""));
		const words = message.lastElementChild.textContent
			.split(" ")
			.map(simplify)
			.flatMap((text) => [text, withoutEndPunctuation(text)]);

		const senderHighlights = highlights.filter(({ name }) => name === sender || name === "*");
		if (senderHighlights.length) {
			// When message sender is in highlights.
			message.style.outline = `1px solid ${senderHighlights[0].senderColor}`;
		}

		for (const { name, color } of highlights) {
			// When word includes a name in highlights.
			if (!words.includes(name)) continue;

			message.style.backgroundColor = color;
			break;
		}

		function simplify(text: string) {
			return text.toLowerCase().trim();
		}
	}

	function applyV3Highlights(message: HTMLElement) {
		if (!message) return;
		if (!highlights?.length) return;

		let sender: string;
		const senderElement = message.find("[class*='sender___']");
		if (senderElement) {
			sender = senderElement.textContent.replace(":", "");
		} else {
			const hasBox = message.querySelector("[class*='box___']");
			if (hasBox && message.matches("[class*='self___']")) {
				sender = getUserDetails().name;
			} else if (hasBox && !message.matches("[class*='self___']")) {
				const chatItem = message.closest("[class*='item___']");
				const title = chatItem.querySelector("[class*='title___']");
				sender = title.textContent;
			} else return;
		}
		sender = simplify(sender);

		const words = message
			.find("[class*='message___']")
			.textContent.split(" ")
			.map(simplify)
			.flatMap((text) => [text, withoutEndPunctuation(text)]);

		const senderHighlights = highlights.filter(({ name }) => name === sender || name === "*");
		if (senderHighlights.length) {
			// When message sender is in highlights.
			message.style.outline = `1px solid ${senderHighlights[0].senderColor}`;
		}

		for (const { name, color } of highlights) {
			// When word includes a name in highlights.
			if (!words.includes(name)) continue;

			message.style.backgroundColor = color;
			break;
		}

		function simplify(text: string) {
			return text.toLowerCase().trim();
		}
	}

	function removeHighlights() {
		for (const message of document.findAll("[class*='chat-box-body__'] [class*='chat-box-message__box__'][style]")) {
			message.style = "";
		}
	}
})();
