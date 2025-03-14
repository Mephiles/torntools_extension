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
		null
	);

	async function showTime() {
		const destinationTitle = await requireElement("#travel-root [class*='progressTextLineBreaker___']");

		if (destinationTitle.parentElement.find(".tt-landing-time")) return;

		const timer = await requireElement("#travel-root time[datetime]");
		const duration = textToTime(timer.textContent);

		const arrival = Date.now() + duration;

		destinationTitle.parentElement.insertBefore(
			document.newElement({
				type: "div",
				class: "tt-landing-time",
				children: [document.newElement({ type: "span", class: "description", text: `Landing at ${formatTime(arrival)}.` })],
			}),
			destinationTitle.nextElementSibling
		);
	}

	function removeTime() {
		const timer = document.find(".tt-landing-time");
		if (timer) timer.remove();
	}
})();
