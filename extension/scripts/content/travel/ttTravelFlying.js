"use strict";

(async () => {
	if (!isFlying()) return;

	const { mobile, tablet } = await checkDevice();

	if (mobile || tablet) {
		requireElement("[class*='destinationList___'] > div:not([class])").then((list) => {
			list.addEventListener("click", async (event) => {
				const destinationElement = event.target.closest("[class*='destination___']");
				if (!destinationElement) return;

				const countryElement = destinationElement.querySelector("[class*='country___']");
				if (!countryElement) return;

				const country = countryElement.textContent.trim().toLowerCase().replaceAll(" ", "_");

				requireCondition(() => destinationElement.classList.contains("expanded")).then(() =>
					triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country })
				);
			});
		});
	} else {
		requireElement("fieldset[class*='worldMap___']").then((map) => {
			map.addEventListener("click", (event) => {
				if (
					!settings.pages.travel.table ||
					!settings.pages.travel.autoTravelTableCountry ||
					!event.target.matches("[class*='pin___']:not([class*='currentlyHere___'])")
				)
					return;

				let country = event.target.parentElement.querySelector("img").src.replace(".png", "").split("/").last();
				if (country === "uk") country = "united_kingdom";

				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country });
			});
		});

		requireElement("[class*='destinationPanel___']").then((destinationPanel) => {
			new MutationObserver((_, initialObserver) => {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE);

				const timeElement = destinationPanel.querySelector("[class*='flightDetailsGrid'] > :nth-child(2) span[aria-hidden]");

				new MutationObserver(() => {
					triggerCustomListener(EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE);
				}).observe(timeElement, { characterData: true, subtree: true });
				initialObserver.disconnect();
			}).observe(destinationPanel, { childList: true, subtree: true });
		});
	}

	requireElement("fieldset[class*='travelTypeSelector___']").then((typeList) => {
		for (const input of typeList.findAll("input[name='travelType']")) {
			input.addEventListener("change", async () => {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: input.value });
			});
		}
	});
})();
