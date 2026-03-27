import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { findAllElements, isHTMLElement } from "@/utils/common/functions/dom";

function hideMessage() {
	const tooManyItemsWarning = document.evaluate(
		"//*[contains(@class, 'info-msg-cont')][.//*[contains(text(), 'recommend you reduce the number of items')]]",
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null
	).singleNodeValue;
	if (!tooManyItemsWarning || !isHTMLElement(tooManyItemsWarning)) return;

	const delimiter = tooManyItemsWarning.previousElementSibling as HTMLElement;

	tooManyItemsWarning.dataset.type = "too-many-items-warning";
	tooManyItemsWarning.classList.add("tt-hidden");
	delimiter.dataset.type = "too-many-items-warning";
	delimiter.classList.add("tt-hidden");
}

function showMessage() {
	findAllElements(".tt-hidden[data-type='too-many-items-warning']").forEach((hidden) => {
		hidden.classList.remove("tt-hidden");
	});
}

export default class HideTooManyItemsWarningFeature extends Feature {
	constructor() {
		super("Hide Too Many Items Warning", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.hideTooManyItemsWarning;
	}

	execute() {
		hideMessage();
	}

	cleanup() {
		showMessage();
	}

	storageKeys() {
		return ["settings.pages.items.hideTooManyItemsWarning"];
	}
}
