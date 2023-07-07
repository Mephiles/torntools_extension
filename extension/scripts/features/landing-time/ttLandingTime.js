"use strict";

(async () => {
	if (!isFlying()) return;

	featureManager.registerFeature(
		"Landing Time",
		"travel",
		() => settings.pages.travel.landingTime,
		null,
		showTime,
		removeTime,
		{
			storage: ["settings.pages.travel.landingTime"],
		},
		null,
	);

	function showTime() {
		const destinationTitle = document.find(".flight-info .destination-title");
		if (!destinationTitle) return;

		if (destinationTitle.find(".tt-landing-time")) return;

		const timer = destinationTitle.find(".remaining-time > span");
		const arrival = Date.now() + timer.dataset.to * TO_MILLIS.SECONDS;

		destinationTitle.parentElement.insertBefore(
			document.newElement({
				type: "div",
				class: "tt-landing-time",
				children: [document.newElement({ type: "span", class: "description", text: `Landing at ${formatTime(arrival)}.` })],
			}),
			destinationTitle.nextElementSibling,
		);
	}

	function removeTime() {
		const timer = document.find(".tt-landing-time");
		if (timer) timer.remove();
	}
})();
