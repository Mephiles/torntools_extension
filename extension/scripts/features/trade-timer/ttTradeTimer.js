"use strict";

(async () => {
	featureManager.registerFeature(
		"Trade Timer",
		"chat",
		() => settings.pages.chat.tradeTimer,
		initialise,
		detectChat,
		cleanup,
		{
			storage: ["settings.pages.chat.tradeTimer", "localdata.tradeMessage"],
		},
		null
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!chat.classList.contains("^=trade_")) return;

			triggerTrade(chat);
		});
	}

	async function detectChat() {
		await requireChatsLoaded();

		const chat = document.find("#chatRoot [class*='chat-box_'][class*='trade_'][class*='chat-active_']");
		if (!chat) return;

		triggerTrade(chat);
	}

	function triggerTrade(chat) {
		const input = chat.find("[class*='chat-box-input_']");

		let timer;
		if (input.find("#tt-trade-timer")) timer = input.find("#tt-trade-timer");
		else {
			timer = document.newElement({
				type: "div",
				id: "tt-trade-timer",
				dataset: {
					doneText: "OK",
					timeSettings: JSON.stringify({ type: "wordTimer", extraShort: true }),
				},
			});
			input.insertBefore(document.newElement({ type: "div", children: [timer] }), input.firstElementChild);

			input.find("textarea").addEventListener("keypress", onKeyPress);
			input.classList.add("tt-modified");
		}

		const now = Date.now();
		if (localdata.tradeMessage > now) {
			timer.textContent = formatTime({ milliseconds: localdata.tradeMessage - now }, { type: "wordTimer", extraShort: true });
			timer.dataset.seconds = ((localdata.tradeMessage - now) / TO_MILLIS.SECONDS).dropDecimals().toString();
			countdownTimers.push(timer);
		} else {
			timer.textContent = "OK";
		}

		const search = input.find(".tt-chat-filter");
		if (search) timer.parentElement.appendChild(search);
	}

	async function onKeyPress(event) {
		if (event.key !== "Enter") return;
		if (!event.target.value) return;

		const chat = findParent(event.target, { class: "^=chat-box_" });
		const overview = chat.find("[class*='overview_']");

		const message = await new Promise((resolve) => {
			new MutationObserver((mutations, observer) => {
				const mutation = mutations.find((mutation) => mutation.addedNodes.length);
				if (!mutation) return;

				const node = mutation.addedNodes[0];

				observer.disconnect();
				resolve(node);
			}).observe(overview, { childList: true });
		});
		if (event.target.value) return;

		if (message.classList.contains("^=error_")) return;

		await ttStorage.change({ localdata: { tradeMessage: Date.now() + TO_MILLIS.SECONDS * 61 } });
	}

	function cleanup() {
		const chat = document.find("#chatRoot [class*='chat-box_'][class*='trade_'][class*='chat-active_']");
		if (!chat) return;

		const timer = chat.find("#tt-trade-timer");
		if (timer) timer.remove();

		const input = chat.find("[class*='chat-box-input_']");

		if (!input.find(".tt-chat-filter")) input.classList.remove("tt-modified");

		input.find("textarea").removeEventListener("keypress", onKeyPress);
	}

	// function moveSearch() {
	// 	const timer = document.find("#tt-trade-timer");
	// 	if (!timer) return;
	//
	// 	const search = timer.parentElement.parentElement.find(".tt-chat-filter");
	// 	if (!search) return;
	//
	// 	timer.parentElement.appendChild(search);
	// }
})();
