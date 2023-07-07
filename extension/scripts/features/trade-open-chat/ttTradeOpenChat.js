"use strict";

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
		null,
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(({ step }) => {
			if (!feature.enabled()) return;
			if (!["view", "initiateTrade", "accept", "start"].includes(step)) return;

			addButton();
		});
	}

	async function addButton() {
		let id;

		const trader = await requireElement(`#trade-container .log > li .desc a:not([href*="${userdata.player_id}"])`);
		if (trader) id = parseInt(trader.href.match(/XID=(\d*)/i)[1]);
		if (!id) return;

		const button = document.newElement({
			type: "span",
			text: "Open Chat",
			class: "tt-open-chat",
		});

		button.addEventListener("click", () => executeScript((wrapped) => wrapped.chat.r(id), `chat.r(${id})`));

		document.find("#trade-container > .title-black").appendChild(
			document.newElement({
				type: "div",
				children: [button],
			}),
		);
	}

	function removeButton() {
		document.find(".tt-open-chat").remove();
	}
})();
