import "./jail-filter.css";
import { FEATURE_MANAGER, ttStorage } from "@common/utils/context";
import { filters, quick, settings, userdata } from "@common/utils/data/database";
import type { QuickJail } from "@common/utils/data/default-database";
import { type CheckboxObject, createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { hasAPIData } from "@common/utils/functions/api";
import { findContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import {
	createFilter,
	defaultFactionsItems,
	type FilterController,
	presetSection,
	type SliderRange,
	sliderSection,
	textSection,
} from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { extractFactionsFromPage, getPageStatus } from "@common/utils/functions/torn";
import { PHBoldArrowClockwise } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;
let cbQuickBust: CheckboxObject | undefined;
let cbQuickBail: CheckboxObject | undefined;

const JAIL_FILTER_TIME_REGEX = /(\d+)(?=h)|(\d+)(?=m)/g;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.JAIL_SWITCH_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(JailFilterFeature)) return;

		await Promise.all([filter?.run(), applyQuickBustAndBail()]);
	});
}

type JailFilterState = {
	enabled: boolean;
	activity: string[];
	faction: string;
	time: SliderRange;
	level: SliderRange;
	score: SliderRange;
	bailCost: string;
};

async function addFilterContainer() {
	await requireElement(".userlist-wrapper .user-info-list-wrap .bust-icon");

	filter?.dispose();

	const bailMultiplier = getBailMultiplier();

	const sections = [
		presetSection({ preset: "activity", defaults: filters.jail.activity }),

		presetSection({
			preset: "faction",
			getOptions: () => [...defaultFactionsItems, ...extractFactionsFromPage().map((faction) => ({ value: faction, description: faction }))],
			default: filters.jail.faction,
		}),

		sliderSection({
			key: "time",
			title: "Time Filter",
			config: { min: 0, max: 100, step: 1 },
			defaults: { low: filters.jail.timeStart, high: filters.jail.timeEnd },
			formatCounter: (r) => `Time ${r.start}h - ${r.end}h`,
			test: (row, range) => {
				const timeText = row.querySelector(".info-wrap .time").textContent;
				const timeLeft = timeText.match(JAIL_FILTER_TIME_REGEX);
				const timeLeftHrs = timeLeft?.length > 1 ? parseInt(timeLeft[0]) : 0;

				if (range.start && timeLeftHrs < range.start) return false;
				if (range.end !== 100 && timeLeftHrs >= range.end) return false;

				return true;
			},
		}),

		sliderSection({
			key: "level",
			title: "Level Filter",
			config: { min: 1, max: 100, step: 1 },
			defaults: { low: filters.jail.levelStart, high: filters.jail.levelEnd },
			formatCounter: (r) => `Level ${r.start} - ${r.end}`,
			test: (row, range) => {
				const level = convertToNumber(row.querySelector(".info-wrap .level").textContent);

				if (range.start && level < range.start) return false;
				if (range.end !== 100 && level > range.end) return false;

				return true;
			},
		}),

		sliderSection({
			key: "score",
			title: "Score Filter",
			config: { min: 0, max: 5000, step: 10 },
			defaults: { low: filters.jail.scoreStart, high: filters.jail.scoreEnd },
			formatCounter: (r) => `Score ${r.start} - ${r.end}`,
			test: (row, range) => {
				const level = convertToNumber(row.querySelector(".info-wrap .level").textContent);
				const timeText = row.querySelector(".info-wrap .time").textContent;
				const timeLeft = timeText.match(JAIL_FILTER_TIME_REGEX);
				const timeLeftHrs = timeLeft?.length > 1 ? parseInt(timeLeft[0]) : 0;

				const score = level * (timeLeftHrs + 3);
				if (range.start && score < range.start) return false;
				if (range.end !== 5000 && score > range.end) return false;

				return true;
			},
		}),

		textSection({
			key: "bailCost",
			title: "Maximum Bail Cost",
			type: "number",
			defaultValue: filters.jail.bailCost === -1 ? "" : (filters.jail.bailCost?.toString() ?? ""),
			test: (row, bailCostStr) => {
				const bailCost = parseInt(bailCostStr);
				if (!bailCost || Number.isNaN(bailCost)) return true;

				const level = convertToNumber(row.querySelector(".info-wrap .level").textContent);
				const timeText = row.querySelector(".info-wrap .time").textContent;
				const timeLeft = timeText.match(JAIL_FILTER_TIME_REGEX);
				const timeLeftHrs = timeLeft?.length > 1 ? parseInt(timeLeft[0]) : 0;
				const timeLeftMins = parseInt(timeLeft?.length > 1 ? timeLeft[1] : timeLeft?.[0]) || 0;
				const totalMinutes = timeLeftMins + timeLeftHrs * 60;

				return totalMinutes * level * bailMultiplier * 100 <= bailCost;
			},
		}),
	];

	filter = createFilter<JailFilterState>({
		rowSelector: ".users-list > li",
		container: {
			title: "Jail Filter",
			class: "mt10",
			nextElement: document.querySelector(".users-list-title"),
			compact: true,
		},
		statisticsLabel: "players",
		enabled: filters.jail.enabled,
		sections,
		onStateChange: async (state) => {
			const bailCost = parseInt(state.bailCost);

			await ttStorage.change({
				filters: {
					jail: {
						enabled: state.enabled,
						activity: state.activity,
						faction: state.faction,
						timeStart: state.time.start,
						timeEnd: state.time.end,
						levelStart: state.level.start,
						levelEnd: state.level.end,
						scoreStart: state.score.start,
						scoreEnd: state.score.end,
						bailCost: bailCost !== undefined && !Number.isNaN(bailCost) ? bailCost : -1,
					},
				},
			});
		},
	});

	// Standalone options, not actually part of the filter.
	const optionsEl = findContainer("Jail Filter")?.querySelector<HTMLElement>(".options");
	if (optionsEl) {
		cbQuickBust = createCheckbox({ description: "Quick Bust" });
		cbQuickBust.setChecked(quick.jail.includes("bust"));
		cbQuickBust.onChange(applyQuickBustAndBail);
		optionsEl.appendChild(cbQuickBust.element);

		cbQuickBail = createCheckbox({ description: "Quick Bail" });
		cbQuickBail.setChecked(quick.jail.includes("bail"));
		cbQuickBail.onChange(applyQuickBustAndBail);
		optionsEl.appendChild(cbQuickBail.element);
	}

	await filter.run();
	await applyQuickBustAndBail();
}

function getBailMultiplier() {
	if (!hasAPIData() || !settings.apiUsage.user.perks) return 1;

	return Array.of(...userdata.education_perks, ...userdata.job_perks)
		.filter((p) => p.includes("bail cost reduction"))
		.reduce((multiplier, perk) => {
			return multiplier * (1 - parseFloat(perk.split(" ")[1].replace("%", "")) / 100);
		}, 1);
}

async function applyQuickBustAndBail() {
	await requireElement(".users-list > li");

	const quickModes: QuickJail[] = [];
	if (cbQuickBust?.isChecked()) quickModes.push("bust");
	if (cbQuickBail?.isChecked()) quickModes.push("bail");

	await ttStorage.change({ quick: { jail: quickModes } });

	findAllElements(".tt-quick-refresh, .tt-quick-refresh-wrap").forEach((x) => x.remove());

	if (quickModes.length) {
		if (document.querySelector(".users-list > li:not(.tt-hidden)")) {
			if (!document.querySelector(".users-list-title .tt-quick-refresh")) {
				document.querySelector(".users-list-title").appendChild(newRefreshButton());
			}
		} else {
			document.querySelector(".users-list").appendChild(
				elementBuilder({
					type: "div",
					class: "tt-quick-refresh-wrap",
					children: [
						...(cbQuickBail?.isChecked() ? [newRefreshButton("tt-bail")] : []),
						...(cbQuickBust?.isChecked() ? [newRefreshButton("tt-bust")] : []),
					],
				}),
			);
		}
	}

	findAllElements(".users-list > li").forEach((li) => {
		if (cbQuickBust?.isChecked()) addQAndHref(li.querySelector(":scope > [href*='breakout']"));
		else removeQAndHref(li.querySelector(":scope > [href*='breakout']"));

		if (cbQuickBail?.isChecked()) addQAndHref(li.querySelector(":scope > [href*='buy']"));
		else removeQAndHref(li.querySelector(":scope > [href*='buy']"));
	});

	function newRefreshButton(customClass = "") {
		return elementBuilder({
			type: "div",
			class: `tt-quick-refresh ${customClass}`,
			children: [PHBoldArrowClockwise()],
			events: { click: () => location.reload() },
		});
	}

	function addQAndHref(iconNode: HTMLAnchorElement) {
		if (!iconNode || iconNode.querySelector(":scope > .tt-quick-q")) return;

		iconNode.appendChild(elementBuilder({ type: "span", class: "tt-quick-q", text: "Q" }));
		iconNode.href = `${iconNode.getAttribute("href")}1`;
	}

	function removeQAndHref(iconNode: HTMLAnchorElement) {
		if (!iconNode) return;

		iconNode.querySelector(".tt-quick-q")?.remove();
		if (iconNode.href.slice(-1) === "1") iconNode.href = iconNode.getAttribute("href").slice(0, -1);
	}
}

export default class JailFilterFeature extends Feature {
	constructor() {
		super("Jail Filter", "jail");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.jail.filter;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await addFilterContainer();
	}

	cleanup() {
		cbQuickBust = undefined;
		cbQuickBail = undefined;
		filter?.dispose();
	}

	storageKeys() {
		return ["settings.pages.jail.filter"];
	}
}
