import { isInternalFaction } from "@common/pages/factions-page";
import { ttStorage } from "@common/utils/context";
import { filters, settings } from "@common/utils/data/database";
import { hasOC1Data } from "@common/utils/functions/api";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { checkboxesSection, createFilter, type FilterController } from "@common/utils/functions/filters";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { DisabledUntilNoticeFeature } from "@features/feature";

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

				const level = convertToNumber(row.querySelector("[class*='levelValue___']").textContent);
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
			previousElement: list.parentElement.querySelector(".page-head-delimiter"),
		},
		statisticsLabel: "crimes",
		enabled: filters.oc2.enabled,
		sections,
		onStateChange: async (state) => {
			await ttStorage.change({
				filters: { oc2: { enabled: state.enabled, difficulty: state.difficulty.map(Number), status: state.status } },
			});
		},
	});

	await filter.run();
}

function isCompletedCrimesTab() {
	const activeTab = document.querySelector("#faction-crimes-root [class*='buttonsContainer___'] > [class*='active___']");
	if (!activeTab) return false;
	return activeTab.textContent.trim().toLowerCase().includes("completed");
}

function getCrimeStatus(row: HTMLElement) {
	if (row.querySelector('div[class*="failed"]')) return "failed";
	const successDiv = row.querySelector('div[class*="success"]');
	if (successDiv) {
		if (row.querySelector('span[aria-label="Paid"]')) return "paid";
		const payoutBtn = row.querySelector('button[class*="payoutBtn"]');
		if (payoutBtn?.textContent.includes("PayOut")) return "unpaid";
		if (row.querySelector('div[class*="nextCrimeContainer"]')) return "chain";
		return "unpaid";
	}
	return null;
}

export default class OC2FilterFeature extends DisabledUntilNoticeFeature {
	constructor() {
		super("OC2 Filter", "faction");
	}
	precondition() {
		return isInternalFaction;
	}
	isEnabled() {
		return settings.pages.faction.oc2Filter;
	}
	initialise() {
		initialiseListeners();
	}
	async execute() {
		await addFilterContainer();
	}
	cleanup() {
		filter?.dispose();
	}
	storageKeys() {
		return ["settings.pages.faction.oc2Filter"];
	}
	requirements() {
		return hasOC1Data() ? "Still on OC1." : super.requirements();
	}
}
