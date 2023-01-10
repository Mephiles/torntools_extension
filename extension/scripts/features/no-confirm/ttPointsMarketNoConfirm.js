"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"PointsMarket No Confirm - Remove",
		"no confirm",
		() => settings.scripts.noConfirm.pointsMarketRemove || settings.scripts.noConfirm.pointsMarketBuy,
		initialise,
		startFeature,
		null,
		{
			storage: ["settings.scripts.noConfirm.pointsMarketRemove", "settings.scripts.noConfirm.pointsMarketBuy"],
		},
		null
	);

	function initialise() {
		new MutationObserver((mutations) => {
			if (!feature.enabled()) return;

			if (mutations[0].removedNodes.length > 1) return;

			startFeature();
		}).observe(document.find(".users-point-sell"), { childList: true });
	}

	async function startFeature() {
		await requireElement(".users-point-sell");

		removeConfirmation();
	}

	function removeConfirmation() {
		for (const item of document.findAll(".users-point-sell > li:not(.yes) > span[href]")) {
			const url = item.getAttribute("href");
			if (settings.scripts.noConfirm.pointsMarketRemove && url.includes("ajax_action=remove")) {
				item.classList.add("yes");
				item.setAttribute("href", url.replace("ajax_action=remove", "ajax_action=remove1"));
			} else if (settings.scripts.noConfirm.pointsMarketBuy && url.includes("ajax_action=buy")) {
				item.classList.add("yes");
				item.setAttribute("href", url.replace("ajax_action=buy", "ajax_action=buy1"));
			}
		}
	}
})();
