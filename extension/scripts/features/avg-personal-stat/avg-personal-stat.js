"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Average Personal Stat",
		"personalstats",
		() => settings.pages.profile.avgpersonalstats,
		null,
		statsAverage,
		() => removeContainer("Effective Battle Stats"),
		{
			storage: ["settings.pages.profile.statsAverage"],
		},
		async () => {
			await checkDevice();
		}
	);

	async function statsAverage() {
		alert("Hello");
	}
})();
