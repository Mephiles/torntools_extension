(async () => {
	if (!isFlying() || isAbroad()) return;

	featureManager.registerFeature(
		"Tab Title Timer",
		"travel",
		() => settings.pages.travel.tabTitleTimer,
		null,
		showTabTimer,
		removeTabTimer,
		{
			storage: ["settings.pages.travel.tabTitleTimer"],
		},
		null
	);

	let timerUpdateInterval: number | undefined = undefined;

	async function showTabTimer() {
		timerUpdateInterval = setInterval(() => {
			updateTabTimer();
		}, 1000);

		updateTabTimer();
	}

	function updateTabTimer() {
		// Steal text from existing HTML element
		const time_el = document.querySelector("[class*='progressTextLineBreaker__'] time");
		if (!time_el) return;

		// Set it as the document title
		const time = (time_el as HTMLElement).innerText;
		document.title = `${time} | TORN`;
	}

	function removeTabTimer() {
		clearInterval(timerUpdateInterval);
		document.title = "Traveling | TORN";
	}
})();
