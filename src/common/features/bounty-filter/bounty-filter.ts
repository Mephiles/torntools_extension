import "./bounty-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { createContainer, findContainer } from "@common/utils/functions/containers";
import { checkDevice, elementBuilder, getHashParameters } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { createStatistics } from "@common/utils/functions/filters";
import type { StatisticsResult } from "@common/utils/functions/filters";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

function initialiseListener() {
	new MutationObserver(async () => {
		if (!FEATURE_MANAGER.isEnabled(BountyFilterFeature)) return;

		await addFilter();
	}).observe(findElement(".content-wrapper"), { childList: true });
}

async function addFilter() {
	const device = await checkDevice();

	if (findContainer("Bounty Filter")) return;
	await requireElement(".bounties-list > li > ul > li .reward");
	const { options } = createContainer("Bounty Filter", {
		previousElement: findElement(".bounties-wrap .bounties-total"),
		onlyHeader: true,
		applyRounding: false,
	});
	const maxLevelInput = elementBuilder({
		type: "input",
		attributes: {
			type: "number",
			min: "0",
			max: "100",
		},
	});
	const cbHideUnavailable = createCheckbox({ description: "Hide Unavailable" });
	options.appendChild(cbHideUnavailable.element);
	options.appendChild(maxLevelInput);
	options.appendChild(
		elementBuilder({
			type: "span",
			text: "Max Level",
		}),
	);
	let statistics: StatisticsResult;
	if (!device.mobile && !device.tablet) {
		statistics = createStatistics("rows", true, true);
		findElement(".title .text", options.parentElement!).appendChild(statistics.element);
	}

	// Setup saved filters
	maxLevelInput.value = filters.bounties.maxLevel.toString();
	cbHideUnavailable.setChecked(filters.bounties.hideUnavailable);

	maxLevelInput.addEventListener("input", filterListing);
	cbHideUnavailable.onChange(filterListing);
	await filterListing();

	async function filterListing() {
		// Get the set filters
		const tempMaxLevel = parseInt(maxLevelInput.value);
		const maxLevel = tempMaxLevel < 100 && tempMaxLevel > 0 ? tempMaxLevel : 100;
		maxLevelInput.value = maxLevelInput.value === "" ? "" : maxLevel.toString();
		const hideUnavailable = cbHideUnavailable.isChecked();

		// Save the filters
		await ttStorage.change({
			filters: {
				bounties: {
					maxLevel,
					hideUnavailable,
				},
			},
		});

		const list = findElement(".bounties-list");
		for (const bounty of findAllElements(":scope > li[data-id]", list)) {
			if (maxLevel > 0 && parseInt(findElement(".level", bounty).lastChild!.textContent!) > maxLevel) {
				hideBounty(bounty);
				continue;
			} else showBounty(bounty);
			if (hideUnavailable && findElement(".user-red-status, .user-blue-status", bounty, true)) {
				hideBounty(bounty);
			} else showBounty(bounty);
		}

		list.classList.add("tt-filtered");
		if (!device.mobile && !device.tablet)
			statistics.updateStatistics(
				findAllElements(".bounties-list > li[data-id]:not(.tt-hidden)").length,
				findAllElements(".bounties-list > li[data-id]").length,
				findElement(".title .text", options.parentElement!),
			);
		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Bounty Filter" });

		function hideBounty(bounty: Element) {
			bounty.classList.add("tt-hidden");

			if (bounty.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				bounty.nextElementSibling.classList.add("tt-hidden");
			}
		}

		function showBounty(bounty: Element) {
			bounty.classList.remove("tt-hidden");

			if (bounty.nextElementSibling?.classList.contains("tt-stats-estimate")) {
				bounty.nextElementSibling.classList.remove("tt-hidden");
			}
		}
	}
}

export default class BountyFilterFeature extends Feature {
	constructor() {
		super("Bounty Filter", "bounties");
	}

	override isEnabled() {
		return settings.pages.bounties.filter;
	}

	override initialise() {
		initialiseListener();
	}

	override async execute() {
		const params = getHashParameters();
		if (params.has("p") && params.get("p") !== "main") return;

		await addFilter();
	}

	override storageKeys() {
		return ["settings.pages.bounties.filter"];
	}
}
