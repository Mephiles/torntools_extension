"use strict";

(async () => {
	if (!isFlying()) return;

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

	let timer_update_interval = undefined;

	async function showTabTimer() {
		timer_update_interval = setInterval(() => {
			updateTabTimer();
		}, 1000);


		updateTabTimer();
	}

	function updateTabTimer() {

		// Steal text from existing HTML element and set it as the doccument title
		let time = (document.querySelector("[class*='progressTextLineBreaker__'] time") as HTMLElement).innerText;
		document.title = `${time} | TORN`;
	}

	function removeTabTimer() {
		clearInterval(timer_update_interval);
		document.title = "Traveling | TORN";
	}
})();
