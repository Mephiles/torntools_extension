"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Open Chat",
		"trade",
		() => settings.pages.trade.openChat,
		null,
		addButton,
		removeButton,
		{
			storage: ["settings.pages.trade.openChat"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function addButton() {
		await requireElement("#trade-container .log > li .desc a");
		let id;

		const trader = document.find(`#trade-container .log > li .desc a:not([href*="${userdata.player_id}"])`);
		if (trader) id = parseInt(link.href.match(/XID=([0-9]*)/i)[1]);
		if (!id) return;

		const button = document.newElement({
			type: "span",
			text: "Open Chat",
			class: "tt-open-chat",
		});

		button.addEventListener("click", () => {
			if (window.wrappedJSObject) {
				window.wrappedJSObject.chat.r(id);
			} else {
				const script = document.newElement({
					type: "script",
					attributes: { type: "text/javascript" },
					html: `chat.r(${id})`,
				});

				document.find("head").appendChild(script);
				setTimeout(() => script.remove(), 100);
			}
		});

		document.find("#trade-container > .title-black").appendChild(
			document.newElement({
				type: "div",
				children: [button],
			})
		);
	}

	function removeButton() {
		document.find(".tt-open-chat").remove();
	}
})();
