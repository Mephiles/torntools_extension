import { getSearchParameters } from "@common/utils/functions/dom.ts";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { addXHRListener } from "@common/utils/functions/listeners.ts";
import { requireElement } from "@common/utils/functions/requires.ts";

export function setupRacingPage() {
	void triggerInitialEvent();

	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (page !== "page") return;

		const params = new URL(xhr.responseURL).searchParams;

		if (params.has("sid") && params.get("sid") !== "racing") return;

		if (params.has("tab")) {
			await handleTab(params);
		} else if (xhr.requestBody?.includes("section=") && xhr.requestBody?.includes("race")) {
			await handleTab(new URLSearchParams(xhr.requestBody));
		}
	});
}
async function triggerInitialEvent() {
	const params = getSearchParameters();
	if (!params.has("tab")) return;

	await handleTab(params);
}

async function handleTab(params: URLSearchParams) {
	const section = params.get("section");

	switch (params.get("tab")) {
		case "cars": {
			if (section === "changeRacingCar") {
				await requireElement(".enlist-wrap");
				triggerCustomListener(EVENT_CHANNELS.RACING__CHANGE_CAR);
			} else {
				// triggerCustomListener(EVENT_CHANNELS.RACING__TAB__CARS);
			}
			break;
		}
		case "parts":
			// triggerCustomListener(EVENT_CHANNELS.RACING__TAB__PARTS);
			break;
		case "race":
			if (section === "changeRacingCar") {
				await requireElement(".enlist-wrap");
				triggerCustomListener(EVENT_CHANNELS.RACING__CHANGE_CAR);
			} else {
				// triggerCustomListener(EVENT_CHANNELS.RACING__TAB__OFFICIAL);
			}
			break;
		case "customrace": {
			if (section === "chooseRacingCar") {
				await requireElement(".enlist-wrap");
				triggerCustomListener(EVENT_CHANNELS.RACING__SELECT_CAR_CUSTOM, { id: parseInt(params.get("id")!) });
			} else if (section === "createCustomRace") {
				if (params.has("trackID")) {
					const trackId = parseInt(params.get("trackID")!);

					triggerCustomListener(EVENT_CHANNELS.RACING__SELECT_CAR_CUSTOM_CREATED, { trackId });
				}
			} else {
				await requireElement(".events-list");
				triggerCustomListener(EVENT_CHANNELS.RACING__CUSTOM_RACES__LIST);
			}
			break;
		}
		case "stats":
			// triggerCustomListener(EVENT_CHANNELS.RACING__TAB__STATS);
			break;
	}
}

export interface TrackData {
	id: number;
	name: string;
}

export const TRACKS: TrackData[] = [
	{ id: 6, name: "Uptown" },
	{ id: 7, name: "Withdrawal" },
	{ id: 8, name: "Underdog" },
	{ id: 9, name: "Parkland" },
	{ id: 10, name: "Docks" },
	{ id: 11, name: "Commerce" },
	{ id: 12, name: "Two Islands" },
	{ id: 15, name: "Industrial" },
	{ id: 16, name: "Vector" },
	{ id: 17, name: "Mudpit" },
	{ id: 18, name: "Hammerhead" },
	{ id: 19, name: "Sewage" },
	{ id: 20, name: "Meltdown" },
	{ id: 21, name: "Speedway" },
	{ id: 23, name: "Stone Park" },
	{ id: 24, name: "Convict" },
];
