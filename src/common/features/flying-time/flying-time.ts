import "./flying-time.css";
import { getTravelDuration } from "@common/pages/travel-home-page.ts";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { formatDate, formatTime } from "@common/utils/functions/formatting";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function initialise() {
	addCustomListener(EVENT_CHANNELS.TRAVEL_HOME__SELECT_COUNTRY, showTime);
	addCustomListener(EVENT_CHANNELS.TRAVEL_HOME__SELECT_TYPE, showTime);
}

async function showTime() {
	const duration = await getTravelDuration();
	if (!duration) return;

	const now = new Date();
	const arrivalTime = new Date(now.getTime() + duration);
	const returnTime = new Date(now.getTime() + duration * 2);

	const text = `Landing at ${format(arrivalTime)} | Return at ${format(returnTime)}`;

	const timer = findElement(".tt-flying-time", true);
	if (timer) timer.textContent = text;
	else {
		findElement("#travel-root").appendChild(elementBuilder({ type: "span", class: "tt-flying-time", text }));
	}
	function format(date: Date) {
		if (date.getDate() === now.getDate()) return formatTime(date, { hideSeconds: true });
		else return `${formatTime(date, { hideSeconds: true })} ${formatDate(date)}`;
	}
}

export default class FlyingTimeFeature extends Feature {
	constructor() {
		super("Flying Time", "travel");
	}

	override precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	override isEnabled() {
		return settings.pages.travel.flyingTime;
	}

	override async initialise() {
		await initialise();
	}

	override async execute() {
		await showTime();
	}

	override storageKeys() {
		return ["settings.pages.travel.flyingTime"];
	}
}
