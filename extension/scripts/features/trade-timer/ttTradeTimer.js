"use strict";

(async () => {
	featureManager.registerFeature(
		"Trade Timer",
		"chat",
		() => settings.pages.chat.tradeTimer,
		initialise,
		showTimer,
		cleanup,
		{
			storage: ["settings.pages.chat.tradeTimer", "localdata.tradeMessage"],
		},
		null
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (chat.find("[class*='chat-box-header__info__']").textContent !== "Trade") return;

			showTimer(chat);
		});
	}

	let timer;
	async function showTimer(tradeChat = null) {
		await requireChatsLoaded();

		if (!tradeChat) tradeChat = getTradeChat();

		if (!tradeChat) return;

		const sendButton = tradeChat.find("[class*='chat-box-footer__send-icon-wrapper__']");
		sendButton.parentElement.classList.add("tt-modified");

		if (!timer) {
			timer = document.newElement({
				type: "div",
				id: "tt-trade-timer",
				dataset: {
					doneText: "OK",
					timeSettings: JSON.stringify({ type: "wordTimer", extraShort: true }),
				},
			});
		}
		countdownTimers = countdownTimers.filter((x) => x.getAttribute("id") !== "tt-trade-timer");
		countdownTimers.push(timer);

		const now = Date.now();
		if (localdata.tradeMessage > now) {
			timer.textContent = formatTime({ milliseconds: localdata.tradeMessage - now }, { type: "wordTimer", extraShort: true });
			timer.dataset.seconds = ((localdata.tradeMessage - now) / TO_MILLIS.SECONDS).dropDecimals().toString();
		} else {
			timer.textContent = "OK";
		}

		sendButton.insertAdjacentElement("afterbegin", timer);

		listenTradeChatInput(tradeChat);
	}

	function getTradeChat() {
		const openChats = document.findAll("#chatRoot [class^='chat-box__']");
		if (!openChats.length) return;

		return [...openChats].filter((chat) => chat.find("[class*='chat-box-header__info__']").textContent === "Trade")?.[0];
	}

	function listenTradeChatInput(tradeChat) {
		if (!tradeChat) tradeChat = getTradeChat();
		if (!tradeChat) return;

		tradeChat.find("[class*='chat-box-footer__textarea__']").addEventListener("keyup", onKeyUp);
	}

	async function onKeyUp(event) {
		if (event.key !== "Enter") return;

		const tradeChat = event.target.closest("[class^='chat-box__']");
		const chatBody = tradeChat.find("[class*='chat-box-body___']");

		const message = await new Promise((resolve) => {
			new MutationObserver((mutations, observer) => {
				const mutation = mutations.filter((mutation) => mutation.addedNodes.length).last();
				if (!mutation) return;

				const node = mutation.addedNodes[0];

				observer.disconnect();
				resolve(node);
			}).observe(chatBody, { childList: true });
		});
		if (event.target.value) return;

		if (message.className.includes("chat-box-body__block-message-wrapper__") && message.textContent === "Trade rooms allows one message per 60 seconds")
			return;

		await ttStorage.change({ localdata: { tradeMessage: Date.now() + TO_MILLIS.SECONDS * 61 } });
	}

	function cleanup() {
		timer?.remove();
		timer = null;

		const tradeChat = getTradeChat();
		if (!tradeChat) return;

		tradeChat.find("[class*='chat-box-footer__send-icon-wrapper__']").parentElement.classList.remove("tt-modified");

		tradeChat.find("textarea").removeEventListener("keypress", onKeyUp);
	}
})();
