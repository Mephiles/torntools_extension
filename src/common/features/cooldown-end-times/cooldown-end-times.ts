import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatDate, formatTime, textToTime } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const REQUIRED_TOOLTIP_TITLES = [
	"Education",
	"Reading Book",
	"Racing",
	"Drug Cooldown",
	"Booster Cooldown",
	"Medical Cooldown",
	"Organized Crime",
	"Bank Investment",
];

const BAR_TOOLTIP_TITLES = ["Energy increased by", "Nerve increased by", "Happy increased by", "Life increased by"];

const tooltipObserver = new MutationObserver((mutations: MutationRecord[]) => {
	for (const mutation of mutations) {
		if (!mutation.addedNodes.length) continue;

		mutation.addedNodes.forEach((addedNode) => {
			if (!(addedNode instanceof Element)) return;
			if (!addedNode.getAttribute("id") || !addedNode.hasAttribute("data-floating-ui-portal")) return;

			const tooltipElement = addedNode;
			let tooltipTitleElement = findElement("b", tooltipElement, true);
			let tooltipTitle = tooltipTitleElement?.textContent;
			if (
				!tooltipTitleElement ||
				!tooltipTitle ||
				(!REQUIRED_TOOLTIP_TITLES.includes(tooltipTitle) && BAR_TOOLTIP_TITLES.every((title) => !tooltipTitle.startsWith(title)))
			) {
				return;
			}

			const timeElement =
				findElement("[class*='static-width___']", tooltipElement, true)?.firstChild ?? // For cooldown icon tooltips.
				findElement("p[class*='bar-descr__']", tooltipElement, true)?.lastChild ?? // For energy, nerve, happy, and life bar tooltips.
				findElement("p:not([class])", tooltipElement, true);
			if (!timeElement) return;

			findAllElements(".tt-tooltip-end-times").forEach((x) => x.remove());
			const time = Date.now() + textToTime(timeElement.textContent!);
			tooltipTitleElement.parentElement!.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-tooltip-end-times",
					text: `${formatDate(time, { showYear: true })} ${formatTime(time)}`,
				}),
			);
		});
	}
});

async function addEndTimes() {
	await requireElement("#sidebarroot [class*='status-icons__'], #sidebar [class*='statusIcons__'] ");
	tooltipObserver.observe(document.body, { childList: true });
}

export default class CooldownEndTimesFeature extends Feature {
	constructor() {
		super("Cooldown End Times", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override isEnabled() {
		return settings.pages.sidebar.cooldownEndTimes;
	}

	override async execute() {
		await addEndTimes();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.cooldownEndTimes"];
	}
}
