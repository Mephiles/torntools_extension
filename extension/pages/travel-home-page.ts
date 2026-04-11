import { settings } from "@/utils/common/data/database";
import { checkDevice, findAllElements } from "@/utils/common/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireCondition, requireDOMContentLoaded, requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@/utils/common/functions/torn";

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

				const countryElement = destinationElement.querySelector("[class*='country___']");
				if (!countryElement) return;

				const country = countryElement.textContent.trim().toLowerCase().replaceAll(" ", "_");

				requireCondition(() => destinationElement.classList.contains("expanded")).then(() =>
					triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country }),
				);
			});
		});
	} else {
		requireElement("fieldset[class*='worldMap___']").then((map: HTMLElement) => {
			map.addEventListener("click", (event) => {
				if (
					!settings.pages.travel.table ||
					!settings.pages.travel.autoTravelTableCountry ||
					!(event.target as Element).matches("[class*='pin___']:not([class*='currentlyHere___'])")
				)
					return;

				let country = (event.target as Element).parentElement.querySelector("img").src.replace(".png", "").split("/").at(-1);
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
		for (const input of findAllElements<HTMLInputElement>("input[name='travelType']", typeList)) {
			input.addEventListener("change", async () => {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: input.value });
			});
		}
	});
}
