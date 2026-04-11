import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements, isElement } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

let observer: MutationObserver | undefined;

async function addObserver() {
	const defenderDiv: Element = await requireElement("#defender");
	await removeObserver();

	if (!observer)
		observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.addedNodes?.length && Array.from(mutation.addedNodes)?.some((node) => isElement(node) && node.matches("[class*='defender__']"))) {
					removeObserver().catch(console.error);

					findAllElements("button", defenderDiv).forEach((button) => {
						if (settings.pages.attack.hideAttackButtons.includes(button.textContent.trim())) button.classList.add("tt-hidden");
					});
				}
			});
		});
	observer.observe(defenderDiv, { childList: true, subtree: true });
}

async function removeObserver() {
	if (observer) {
		observer.disconnect();
		observer = undefined;
	}
	findAllElements("#defender [class*='defender__'] button.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class HideAttackButtonsFeature extends Feature {
	constructor() {
		super("Hide Attack Buttons", "attack", ExecutionTiming.IMMEDIATELY);
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.attack.hideAttackButtons.length > 0;
	}

	async execute() {
		await addObserver();
	}

	async cleanup() {
		await removeObserver();
	}

	storageKeys() {
		return ["settings.pages.attack.hideAttackButtons"];
	}
}
