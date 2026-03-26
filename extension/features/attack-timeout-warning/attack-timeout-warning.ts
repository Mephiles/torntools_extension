import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { textToTime } from "@/utils/common/functions/formatting";
import { isTabFocused, TO_MILLIS } from "@/utils/common/functions/utilities";
import { BACKGROUND_SERVICE } from "@/utils/services/proxy-services";

let observer: MutationObserver | undefined;
let hasSentNotification = false;

async function addListener() {
	stopListener();

	await requireElement("[class*='playerArea__'] [class*='playerWindow__']");

	const dialogButtons = document.querySelector("[class*='playerArea__'] [class*='playerWindow__'] [class*='dialogButtons__']");
	if (dialogButtons) {
		if (dialogButtons.childElementCount === 0) return;

		await new Promise<void>(async (resolve) => {
			dialogButtons.children[0].addEventListener("click", () => resolve(), { once: true });
		});
	}

	const timeoutValue = await requireElement("span[id^='timeout-value'], [class*='labelContainer___']:nth-child(2) [class*='labelTitle___']");

	observer = new MutationObserver((mutations) => {
		if (document.querySelector("div[class^='dialogButtons_']")) {
			observer.disconnect();
			observer = undefined;
			return;
		}

		if (!isTabFocused()) return;

		const seconds = textToTime(mutations[0].target.textContent, { short: true }) / TO_MILLIS.SECONDS;
		if (seconds <= 0 || seconds >= 30) return;

		if (!hasSentNotification && settings.notifications.types.global) {
			BACKGROUND_SERVICE.notification("Attack Timeout", `Your attack is about to timeout in ${seconds} seconds!`, location.href);
			hasSentNotification = true;
		} else {
			BACKGROUND_SERVICE.playNotificationSound(settings.notifications.sound, settings.notifications.volume);
		}
	});
	observer.observe(timeoutValue.firstChild, { characterData: true, subtree: true });
}

function stopListener() {
	if (observer) {
		observer.disconnect();
		observer = undefined;
	}
}

export default class AttackTimeoutWarningFeature extends Feature {
	constructor() {
		super("Attack Timeout Warning", "attack");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.attack.timeoutWarning;
	}

	async execute() {
		await addListener();
	}

	cleanup() {
		stopListener();
	}

	storageKeys() {
		return ["settings.pages.attack.timeoutWarning"];
	}
}
