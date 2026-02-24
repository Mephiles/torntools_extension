(async () => {
	await new Promise<void>((resolve) => {
		const featureManagerIntervalID = setInterval(() => {
			while (typeof featureManager === "undefined") {}

			clearInterval(featureManagerIntervalID);
			resolve();
		}, 100);
	});

	featureManager.registerFeature(
		"Hide Tutorials",
		"global",
		() => settings.pages.global.hideTutorials,
		undefined,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.global.hideTutorials"],
		},
		undefined
	);

	async function applyStyle() {
		document.documentElement.style.setProperty("--torntools-hide-tutorials", settings.pages.global.hideTutorials ? "none" : "flex");
	}
})();
