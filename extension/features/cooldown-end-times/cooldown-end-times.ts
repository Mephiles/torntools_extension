import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatDate, formatTime, textToTime } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";

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

			const tooltipElement = addedNode,
				tooltipTitleElement = tooltipElement.getElementsByTagName("b")?.[0],
				tooltipTitle = tooltipTitleElement?.textContent;
			if (!tooltipTitle || (!REQUIRED_TOOLTIP_TITLES.includes(tooltipTitle) && BAR_TOOLTIP_TITLES.every((title) => !tooltipTitle.startsWith(title))))
				return;

			const timeElement =
				tooltipElement.querySelector("[class*='static-width___']")?.firstChild ?? // For cooldown icon tooltips.
				tooltipElement.querySelector("p[class*='bar-descr__']")?.lastChild ?? // For energy, nerve, happy, and life bar tooltips.
				tooltipElement.querySelector("p:not([class])");
			if (!timeElement) return;

			findAllElements(".tt-tooltip-end-times").forEach((x) => x.remove());
			const time = Date.now() + textToTime(timeElement.textContent);
			tooltipTitleElement.parentElement.appendChild(
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
	await requireElement("#sidebarroot [class*='status-icons__']");
	tooltipObserver.observe(document.body, { childList: true });
}

async function removeEndTimes() {
	findAllElements(".tt-tooltip-end-times").forEach((x) => x.remove());
	tooltipObserver.disconnect();
}

export default class CooldownEndTimesFeature extends Feature {
	constructor() {
		super("Cooldown End Times", "sidebar");
	}

	isEnabled() {
		return settings.pages.sidebar.cooldownEndTimes;
	}

	async execute() {
		await addEndTimes();
	}

	async cleanup() {
		await removeEndTimes();
	}

	storageKeys() {
		return ["settings.pages.sidebar.cooldownEndTimes"];
	}
}
