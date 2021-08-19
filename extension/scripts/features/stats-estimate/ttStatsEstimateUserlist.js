"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate(true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.userlist,
		registerListeners,
		showEstimates,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.userlist"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		},
		{ liveReload: true }
	);

	function registerListeners() {
		addXHRListener(async ({ detail: { page, xhr } }) => {
			if (!feature.enabled() || settings.pages.userlist.filter) return;
			if (page !== "page") return;

			const sid = new URLSearchParams(xhr.requestBody).get("sid");
			if (sid !== "UserListAjax") return;

			await requireElement(".user-info-list-wrap .ajax-placeholder", { invert: true });

			showEstimates().then(() => {});
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FILTER_APPLIED].push(() => {
			if (!feature.enabled()) return;

			showEstimates().then(() => {});
		});
	}

	async function showEstimates() {
		await requireElement(".user-info-list-wrap");
		await requireElement(".user-info-list-wrap .ajax-placeholder", { invert: true });

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".user-info-list-wrap > li",
			(row) => ({
				id: row
					.find(".user.name > [title]")
					.getAttribute("title")
					.match(/([0-9]+)/g)
					?.last(),
				level: parseInt(row.find(".level").innerText.replaceAll("\n", "").split(":").last().trim()),
			}),
			true
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		document.findAll(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();
