import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements, isHTMLElement } from "@/utils/common/functions/dom";
import { getPageStatus } from "@/utils/common/functions/torn";

function hideMessage() {
	const recycleMessageElement = document.evaluate(
		"//*[contains(@class, 'info-msg-cont')][.//*[contains(text(), 'clear up your inventory')]]",
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null,
	).singleNodeValue;
	if (!recycleMessageElement || !isHTMLElement(recycleMessageElement)) return;

	const delimiter = recycleMessageElement.previousElementSibling as HTMLElement;

	recycleMessageElement.dataset.type = "recycle-message";
	recycleMessageElement.classList.add("tt-hidden");
	delimiter.dataset.type = "recycle-message";
	delimiter.classList.add("tt-hidden");
}

function showMessage() {
	findAllElements(".tt-hidden[data-type='recycle-message']").forEach((hidden) => {
		hidden.classList.remove("tt-hidden");
	});
}

export default class HideRecycleMessageFeature extends Feature {
	constructor() {
		super("Hide Recycle Message", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.hideRecycleMessage;
	}

	execute() {
		hideMessage();
	}

	cleanup() {
		showMessage();
	}

	storageKeys() {
		return ["settings.pages.items.hideRecycleMessage"];
	}
}
