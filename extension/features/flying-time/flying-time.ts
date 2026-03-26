import "./flying-time.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus, isAbroad, isFlying } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { elementBuilder, mobile, tabletVertical } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { formatDate, formatTime, textToTime } from "@/utils/common/functions/formatting";

async function initialise() {
	if (mobile || tabletVertical) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY].push(() => {
			if (!FEATURE_MANAGER.isEnabled(FlyingTimeFeature)) return;

			showTime();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(() => {
			if (!FEATURE_MANAGER.isEnabled(FlyingTimeFeature)) return;

			showTime();
		});
	} else {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE].push(() => {
			if (!FEATURE_MANAGER.isEnabled(FlyingTimeFeature)) return;

			showTime();
		});
	}
}

async function showTime() {
	const container = await requireElement(
		mobile || tabletVertical ? "[class*='destinationList___'] .expanded[class*='destination___']" : "[class*='destinationPanel___']"
	);
	if (!container) return;

	const durationText = container.querySelector(
		["[class*='flightDetailsGrid'] > :nth-child(2) span[aria-hidden]", "[class*='confirmPanel___'] p:nth-child(2) [class*='emphasis___']"].join(", ")
	)?.textContent;
	if (!durationText) return;

	const duration = textToTime(durationText);

	const now = new Date();
	const arrivalTime = new Date(now.getTime() + duration);
	const returnTime = new Date(now.getTime() + duration * 2);

	const text = `Landing at ${format(arrivalTime)} | Return at ${format(returnTime)}`;

	let timer = document.querySelector(".tt-flying-time");
	if (timer) timer.textContent = text;
	else {
		document.querySelector("#travel-root").appendChild(elementBuilder({ type: "span", class: "tt-flying-time", text }));
	}
	function format(date: Date) {
		if (date.getDate() === now.getDate()) return formatTime(date, { hideSeconds: true });
		else return `${formatTime(date, { hideSeconds: true })} ${formatDate(date)}`;
	}
}

function removeTime() {
	const timer = document.querySelector(".tt-flying-time");
	if (timer) timer.remove();
}

export default class FlyingTimeFeature extends Feature {
	constructor() {
		super("Flying Time", "travel");
	}

	precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	isEnabled() {
		return settings.pages.travel.flyingTime;
	}

	async initialise() {
		await initialise();
	}

	async execute() {
		await showTime();
	}

	cleanup() {
		removeTime();
	}

	storageKeys() {
		return ["settings.pages.travel.flyingTime"];
	}
}
