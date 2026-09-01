import { settings } from "@common/utils/data/database";
import { isHTMLElement } from "@common/utils/functions/dom";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function hideMessage() {
	const tooManyItemsWarning = document.evaluate(
		"//*[contains(@class, 'info-msg-cont')][.//*[contains(text(), 'recommend you reduce the number of items')]]",
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null,
	).singleNodeValue;
	if (!tooManyItemsWarning || !isHTMLElement(tooManyItemsWarning)) return;

	const delimiter = tooManyItemsWarning.previousElementSibling as HTMLElement;

	tooManyItemsWarning.dataset.type = "too-many-items-warning";
	tooManyItemsWarning.classList.add("tt-hidden");
	delimiter.dataset.type = "too-many-items-warning";
	delimiter.classList.add("tt-hidden");
}

export default class HideTooManyItemsWarningFeature extends Feature {
	constructor() {
		super("Hide Too Many Items Warning", "items");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.items.hideTooManyItemsWarning;
	}

	override execute() {
		hideMessage();
	}

	override storageKeys() {
		return ["settings.pages.items.hideTooManyItemsWarning"];
	}
}
