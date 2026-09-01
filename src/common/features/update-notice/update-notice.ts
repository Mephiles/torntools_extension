import "./update-notice.css";
import { settings, version } from "@common/utils/data/database";
import { checkDevice, elementBuilder, findElementWithText } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showNotice() {
	await requireSidebar();

	if (!version.showNotice) {
		removeNotice();
		return;
	}

	if (document.querySelector("#ttUpdateNotice")) return;

	const currentVersion = browser.runtime.getManifest().version;

	findElementWithText("h2", "Areas").parentElement.insertAdjacentElement(
		"afterend",
		elementBuilder({
			type: "div",
			class: "tt-sidebar-area",
			id: "ttUpdateNotice",
			children: [
				elementBuilder({
					type: "div",
					children: [
						elementBuilder({
							type: "a",
							href: browser.runtime.getURL("/options.html#/changelog"),
							attributes: { target: "_blank" },
							children: [elementBuilder({ type: "span", text: `TornTools updated: ${currentVersion}` })],
						}),
					],
				}),
			],
		}),
	);
}

function removeNotice() {
	const notice = document.querySelector("#ttUpdateNotice");
	if (notice) notice.remove();
}

export default class UpdateNoticeFeature extends Feature {
	constructor() {
		super("Update Notice", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override async requirements() {
		if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	override isEnabled() {
		return settings.updateNotice;
	}

	override async execute() {
		await showNotice();
	}

	override storageKeys() {
		return ["settings.updateNotice", "version.showNotice"];
	}
}
