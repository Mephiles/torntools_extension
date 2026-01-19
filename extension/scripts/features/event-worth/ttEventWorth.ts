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
			(event: MouseEvent) => {
				if (!feature.enabled()) return;

				const target = event.target as Element;
				if (!target.matches("[class*='message__']") || target.className.includes("tt-modified")) return;

				regexes.forEach((regex) => {
					const matches = target.textContent.match(regex);
					if (matches?.length === 2) {
						const totalPrice = parseInt(matches[1].replaceAll(",", ""));
						const quantity = parseInt(matches[0].replaceAll(",", ""));

						target.setAttribute("title", `(worth ${formatNumber(totalPrice / quantity, { currency: true })} each)`);
						target.classList.add("tt-modified");
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
