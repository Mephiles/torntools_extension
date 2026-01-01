(async () => {
	const feature = featureManager.registerFeature(
		"Trade No Confirm",
		"no confirm",
		() => settings.scripts.noConfirm.tradeAccept,
		initialiseListeners,
		removeConfirmation,
		null,
		{
			storage: ["settings.scripts.noConfirm.tradeAccept"],
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRADE].push(({ active }) => {
			if (!feature.enabled()) return;
			if (!active) return;

			removeConfirmation();
		});
	}

	async function removeConfirmation() {
		await requireElement("#trade-container .trade-cont");

		const link = document.find(".trade-cancel a.accept");
		if (!link) return;

		let url = link.getAttribute("href");
		if (!url.includes("accept") || url.includes("accept2")) return;

		link.setAttribute("href", url.replace("accept", "accept2"));
	}
})();
