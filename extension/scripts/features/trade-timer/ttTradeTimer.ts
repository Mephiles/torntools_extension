(async () => {
	featureManager.registerFeature(
		"Trade Timer",
		"chat",
		() => settings.pages.chat.tradeTimer,
		initialise,
		() => showTimer(),
		cleanup,
		{
			storage: ["settings.pages.chat.tradeTimer", "localdata.tradeMessage"],
		},
		null
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (chat.find("[class*='chat-box-header__info__'], [class*='title___']").textContent !== "Trade") return;

			showTimer(chat);
		});
	}

	let timer: HTMLElement | undefined;

	async function showTimer(tradeChat: Element | undefined | null = null) {
		await requireChatsLoaded();

		if (!tradeChat) tradeChat = getTradeChat();

		if (!tradeChat) return;

		const sendButton = tradeChat.find("[class*='chat-box-footer__send-icon-wrapper__'], [class*='content___'] button");
		sendButton.parentElement.classList.add("tt-modified");

		if (!timer) {
			timer = elementBuilder({
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
		const openChats = document.querySelectorAll("#chatRoot [class^='chat-box__'], div#public_trade");
		if (!openChats.length) return null;

		return [...openChats].filter((chat) => chat.find("[class*='chat-box-header__info__'], [class*='title___']").textContent === "Trade")?.[0];
	}

	function listenTradeChatInput(tradeChat: Element | null) {
		if (!tradeChat) tradeChat = getTradeChat();
		if (!tradeChat) return;

		tradeChat.find("[class*='chat-box-footer__textarea__'], textarea").addEventListener("keyup", onKeyUp);
	}

	async function onKeyUp(event: KeyboardEvent) {
		if (event.key !== "Enter") return;

		const tradeChat = (event.target as Element).closest("[class^='chat-box__'], [class*='root___']:has([class*='content___'])");
		const chatBody = tradeChat.find("[class*='chat-box-body___'], [class*='list___']");

		const message = await new Promise<Element>((resolve) => {
			new MutationObserver((mutations, observer) => {
				const mutation = mutations.filter((mutation) => mutation.addedNodes.length).last();
				if (!mutation) return;

				const node = mutation.addedNodes[0] as Element;

				observer.disconnect();
				resolve(node);
			}).observe(chatBody, { childList: true });
		});
		if ((event.target as HTMLInputElement).value) return;

		if (message.className.includes("chat-box-body__block-message-wrapper__") && message.textContent === "Trade rooms allows one message per 60 seconds")
			return;

		await ttStorage.change({ localdata: { tradeMessage: Date.now() + TO_MILLIS.SECONDS * 61 } });
	}

	function cleanup() {
		timer?.remove();
		timer = null;

		const tradeChat = getTradeChat();
		if (!tradeChat) return;

		tradeChat.find("[class*='chat-box-footer__send-icon-wrapper__'], [class*='content___'] button").parentElement.classList.remove("tt-modified");

		tradeChat.find("textarea").removeEventListener("keypress", onKeyUp);
	}
})();
