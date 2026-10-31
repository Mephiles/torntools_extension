import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { textToTime } from "@common/utils/functions/formatting.ts";
import { requireDOMContentLoaded, requireElement, requireElementOptionally } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";
import type { TravelCountry, TravelType } from "@common/utils/functions/torn";

export async function setupTravelHomePage() {
	await requireDOMContentLoaded();

	if (isFlying() || isAbroad()) return;
	if (!getPageStatus().access) return;

	requireElement("[class*='dest___'] [class*='fromToValue___']").then((destinationElement) => {
		new MutationObserver(() => {
			const country: TravelCountry = destinationElement.textContent.toLowerCase().replaceAll(" ", "_") as TravelCountry;

			triggerCustomListener(EVENT_CHANNELS.TRAVEL_HOME__SELECT_COUNTRY, { country });
		}).observe(destinationElement, { characterData: true, subtree: true });
	});
	requireElement("[class*='flightTypeOption___'] [class*='label___']").then((flightTypeElement) => {
		new MutationObserver(() => {
			const type: TravelType = flightTypeElement.textContent.toLowerCase() as TravelType;

			triggerCustomListener(EVENT_CHANNELS.TRAVEL_HOME__SELECT_TYPE, { type });
		}).observe(flightTypeElement, { characterData: true, subtree: true });
	});
}

export async function getTravelDuration() {
	const durationElement = await requireElementOptionally("[class*='flightType___'] [class*='duration___']");
	if (!durationElement) return;

	const durationText = durationElement.textContent;

	return textToTime(durationText);
}
