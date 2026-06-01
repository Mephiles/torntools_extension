import { Feature } from "@features/feature";
import "./landing-time.css";

import { settings } from "@utils/data/database";
import { elementBuilder } from "@utils/functions/dom";
import { formatTime, textToTime } from "@utils/functions/formatting";
import { requireElement } from "@utils/functions/requires";
import { isFlying } from "@utils/functions/torn";

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
		destinationTitle.nextElementSibling,
	);
}

function removeTime() {
	const timer = document.querySelector(".tt-landing-time");
	if (timer) timer.remove();
}

export default class LandingTimeFeature extends Feature {
	constructor() {
		super("Landing Time", "travel");
	}

	precondition() {
		return isFlying();
	}

	isEnabled() {
		return settings.pages.travel.landingTime;
	}

	async execute() {
		await showTime();
	}

	cleanup() {
		removeTime();
	}

	storageKeys() {
		return ["settings.pages.travel.landingTime"];
	}
}
