import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasOC1Data } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { checkboxesSection, createFilter } from "@common/utils/functions/filters";
import type { FilterController } from "@common/utils/functions/filters";
import { findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

let filter: FilterController | undefined;

type OC2FilterState = { enabled: boolean; difficulty: string[]; status: string[] };

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2, () => {
		void addFilterContainer();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_TAB, () => {
		void addFilterContainer();
	});
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_REFRESH, () => {
		void filter?.run();
	});
}

async function addFilterContainer() {
	const list = await requireElement(".tt-oc2-list");
	await requireElement("[class*='loader___']", { parent: list, invert: true });

	filter?.dispose();

	const sections = [
		checkboxesSection({
			key: "difficulty",
			title: "Difficulty",
			items: Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1), description: `Level ${i + 1}` })),
			defaults: (filters.oc2.difficulty ?? []).map(String),
			test: (row, difficulty) => {
				if (!difficulty.length) return true;

				const level = convertToNumber(findElement("[class*='levelValue___']", row).textContent);
				return difficulty.includes(String(level));
			},
		}),

		checkboxesSection({
			key: "status",
			title: "Crime Status",
			enabled: isCompletedCrimesTab,
			items: [
				{ id: "paid", description: "Paid" },
				{ id: "unpaid", description: "Unpaid" },
				{ id: "chain", description: "Chain" },
				{ id: "failed", description: "Failed" },
			],
			defaults: filters.oc2.status?.length ? filters.oc2.status : ["paid", "unpaid", "chain", "failed"],
			test: (row, status) => {
				if (!status.length) return true;

				const crimeStatus = getCrimeStatus(row);
				if (!crimeStatus) return true;

				return status.includes(crimeStatus);
			},
		}),
	];

	filter = createFilter<OC2FilterState>({
		rowSelector: ".tt-oc2-list > [class*='wrapper___']",
		container: {
			title: "OC Filter",
			class: "mt10 mb10",
			previousElement: findElement(".page-head-delimiter", list.parentElement),
		},
		statisticsLabel: "crimes",
		enabled: filters.oc2.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: { oc2: { enabled: state.enabled, difficulty: state.difficulty.map(Number), status: state.status } },
			});
		},
		preserveHeight: 175,
		presets: { key: "oc2" },
	});

	await filter.run();
}

function isCompletedCrimesTab() {
	const activeTab = findElement("#faction-crimes-root [class*='buttonsContainer___'] > [class*='active___']", true);
	if (!activeTab) return false;
	return activeTab.textContent.trim().toLowerCase().includes("completed");
}

function getCrimeStatus(row: HTMLElement) {
	if (findElement('div[class*="failed"]', row, true)) return "failed";
	const successDiv = findElement('div[class*="success"]', row, true);
	if (successDiv) {
		if (findElement('span[aria-label="Paid"]', row, true)) return "paid";
		const payoutBtn = findElement('button[class*="payoutBtn"]', row, true);
		if (payoutBtn?.textContent.includes("PayOut")) return "unpaid";
		if (findElement('div[class*="nextCrimeContainer"]', row, true)) return "chain";
		return "unpaid";
	}
	return null;
}

export default class OC2FilterFeature extends Feature {
	constructor() {
		super("OC2 Filter", "faction");
	}

	override precondition() {
		return isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.oc2Filter;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		if (getFactionSubpage() !== "crimes") return;

		await addFilterContainer();
	}

	override storageKeys() {
		return ["settings.pages.faction.oc2Filter"];
	}

	override requirements() {
		return hasOC1Data() ? "Still on OC1." : super.requirements();
	}
}
