"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"PointsMarket No Confirm",
		"no confirm",
		() => settings.scripts.noConfirm.pointsMarketRemove,
		initialise,
		startFeature,
		null,
		null,
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
		for (const item of document.findAll(".users-point-sell > li.bg-green:not(.yes) > span[href]")) {
			item.classList.add("yes");
			item.setAttribute("href", item.getAttribute("href").replace("ajax_action=remove", "ajax_action=remove1"));
		}
	}
})();
