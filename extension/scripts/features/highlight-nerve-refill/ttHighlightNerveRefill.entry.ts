(async () => {
	await new Promise<void>((resolve) => {
		const featureManagerIntervalID = setInterval(() => {
			while (typeof featureManager === "undefined") {}

			clearInterval(featureManagerIntervalID);
			resolve();
		}, 100);
	});

	await requireElement("body");

	featureManager.registerFeature(
		"Highlight Nerve Refill",
		"sidebar",
		() => settings.pages.sidebar.highlightNerve,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.sidebar.highlightNerve", "userdata.refills.nerve_refill_used"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";

			return true;
		}
	);

	function applyStyle() {
		if (!userdata.refills.nerve_refill_used && settings.pages.sidebar.highlightNerve) document.documentElement.classList.add("tt-highlight-nerve-refill");
		else document.documentElement.classList.remove("tt-highlight-nerve-refill");
	}
})();
