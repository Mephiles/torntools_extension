import { settings } from "@common/utils/data/database";
import { requireElement } from "@common/utils/functions/requires";
import { isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showTabTimer() {
	const timerElement = await requireElement("[class*='progressTextLineBreaker__'] time");

	setInterval(() => updateTabTimer(timerElement), 1000);
	updateTabTimer(timerElement);
}

function updateTabTimer(timerElement: HTMLElement) {
	document.title = `${timerElement.innerText} | TORN`;
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
}
