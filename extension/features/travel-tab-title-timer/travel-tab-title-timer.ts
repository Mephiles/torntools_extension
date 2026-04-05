import { Feature } from "@/features/feature-manager";
import { isFlying } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";

let timerUpdateInterval: number | undefined = undefined;

async function showTabTimer() {
	timerUpdateInterval = setInterval(() => updateTabTimer(), 1000);

	updateTabTimer();
}

function updateTabTimer() {
	const timerElement = document.querySelector<HTMLElement>("[class*='progressTextLineBreaker__'] time");
	if (!timerElement) return;

	document.title = `${timerElement.innerText} | TORN`;
}

function removeTabTimer() {
	clearInterval(timerUpdateInterval);
	document.title = "Traveling | TORN";
}

export default class TravelTabTitleTimerFeature extends Feature {
	constructor() {
		super("Travel Tab Title Timer", "travel");
	}

	precondition() {
		return isFlying();
	}

	isEnabled(): boolean {
		return settings.pages.travel.tabTitleTimer;
	}

	storageKeys(): string[] {
		return ["settings.pages.travel.tabTitleTimer"];
	}

	async execute() {
		await showTabTimer();
	}

	cleanup() {
		removeTabTimer();
	}
}
