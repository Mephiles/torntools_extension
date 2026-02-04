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

		if (destinationTitle.parentElement.querySelector(".tt-landing-time")) return;

		const timer: Element = await requireElement("#travel-root time[datetime]");
		const duration = textToTime(timer.textContent);

		const arrival = Date.now() + duration;

		destinationTitle.parentElement.insertBefore(
			elementBuilder({
				type: "div",
				class: "tt-landing-time",
				children: [elementBuilder({ type: "span", class: "description", text: `Landing at ${formatTime(arrival)}.` })],
			}),
			destinationTitle.nextElementSibling
		);
	}

	function removeTime() {
		const timer = document.querySelector(".tt-landing-time");
		if (timer) timer.remove();
	}
})();
