"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Event Worth",
		"events",
		() => settings.pages.events.worth,
		null,
		addWorth,
		removeWorth,
		{
			storage: ["settings.pages.events.worth"],
		},
		null
	);

	async function addWorth() {
		const eventsListWrapper = await requireElement("[class*='eventsList__']");

		const regexes = [
			/(?<=bought ).*(?= of)|(?<=your points that were on the market for \$).*(?=\.)/g,
			/(?<=bought ).*(?= x )|(?<=from your bazaar for \$).*(?=\.)/g,
			/(?<=You sold )\d+(?=x)|(?<= for \$)[\d,]+/g,
		];

		eventsListWrapper.addEventListener(
			"mouseover",
			(event) => {
				if (!feature.enabled()) return;

				if (!event.target.matches("[class*='message__']") || event.target.className.includes("tt-modified")) return;

				const eventMessageEl = event.target;
				regexes.forEach((regex) => {
					const matches = eventMessageEl.textContent.match(regex);
					if (matches?.length === 2) {
						eventMessageEl.setAttribute(
							"title",
							`(worth ${formatNumber(matches[1].replaceAll(",", "") / matches[0].replaceAll(",", ""), { currency: true })} each)`
						);
						eventMessageEl.classList.add("tt-modified");
					}
				});
			},
			{ capture: true }
		);
	}

	function removeWorth() {
		document.findAll("[class*='eventsList__'] [class*='eventItem___'] [class*='message__']").forEach((x) => {
			x.removeAttribute("title");
			x.classList.remove("tt-modified");
		});
	}
})();
