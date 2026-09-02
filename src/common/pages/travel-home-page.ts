import { settings } from "@common/utils/data/database";
import { checkDevice, isElement } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireCondition, requireDOMContentLoaded, requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";

export async function setupTravelHomePage() {
	await requireDOMContentLoaded();

	if (isFlying() || isAbroad()) return;
	if (!getPageStatus().access) return;

	const { mobile, tabletVertical } = await checkDevice();

	if (mobile || tabletVertical) {
		requireElement("[class*='destinationList___'] > div:not([class])").then((list: HTMLElement) => {
			list.addEventListener("click", async (event) => {
				const destinationElement = (event.target as Element).closest("[class*='destination___']");
				if (!destinationElement) return;

				const countryElement = findElement("[class*='country___']", destinationElement, true);
				if (!countryElement) return;

				const country = countryElement.textContent.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");

				requireCondition(() => destinationElement.classList.contains("expanded")).then(() =>
					triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country }),
				);
			});
		});
	} else {
		requireElement("fieldset[class*='worldMap___']").then((map: HTMLElement) => {
			map.addEventListener("click", (event) => {
				if (
					!isElement(event.target) ||
					!settings.pages.travel.table ||
					!settings.pages.travel.autoTravelTableCountry ||
					!event.target.matches("[class*='pin___']:not([class*='currentlyHere___'])")
				)
					return;

				let country = findElement<HTMLImageElement>("img", event.target.parentElement).src.replace(".png", "").split("/").at(-1).replaceAll("-", "_");
				if (country === "uk") country = "united_kingdom";

				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country });
			});
		});

		requireElement("[class*='destinationPanel___']").then((destinationPanel) => {
			new MutationObserver((_, initialObserver) => {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE);

				const timeElement = findElement("[class*='flightDetailsGrid'] > :nth-child(2) span[aria-hidden]", destinationPanel);

				new MutationObserver(() => {
					triggerCustomListener(EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE);
				}).observe(timeElement, { characterData: true, subtree: true });
				initialObserver.disconnect();
			}).observe(destinationPanel, { childList: true, subtree: true });
		});
	}

	requireElement("fieldset[class*='travelTypeSelector___']").then((typeList) => {
		for (const input of findAllElements<HTMLInputElement>("input[name='travelType']", typeList)) {
			input.addEventListener("change", async () => {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: input.value });
			});
		}
	});
}
