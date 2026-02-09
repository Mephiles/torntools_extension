(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Open Chat",
		"trade",
		() => settings.pages.trade.openChat,
		initialiseListeners,
		addButton,
		removeButton,
		{
			storage: ["settings.pages.trade.openChat"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(({ step }) => {
			if (!feature.enabled()) return;
			if (!["view", "initiateTrade", "accept", "start"].includes(step)) return;

			addButton();
		});
	}

	async function addButton() {
		let id: number;

		const trader: HTMLAnchorElement = await requireElement(`#trade-container .log > li .desc a:not([href*="${userdata.profile.id}"])`);
		if (trader) id = parseInt(trader.href.match(/XID=(\d*)/i)[1]);
		if (!id) return;

		const button = elementBuilder({
			type: "span",
			text: "Open Chat",
			class: "tt-open-chat",
		});

		button.addEventListener("click", () => executeScript(chrome.runtime.getURL("scripts/features/trade-open-chat/ttTradeOpenChat.inject.js")));

		document.querySelector("#trade-container > .title-black").appendChild(
			elementBuilder({
				type: "div",
				children: [button],
			})
		);
	}

	function removeButton() {
		document.querySelector(".tt-open-chat")?.remove();
	}
})();
