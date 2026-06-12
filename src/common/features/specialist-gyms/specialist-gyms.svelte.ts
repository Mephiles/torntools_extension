import { filters, settings } from "@common/utils/data/database";
import { getPageStatus } from "@common/utils/functions/torn";
import { toRecord } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import { mount, unmount } from "svelte";
import BattleStatInfo from "./battle-stat-info.svelte";
import { type BattleStat, battleStats } from "./models/battle-stat";
import type { SpecialGym } from "./models/special-gym";
import SpecialistGymsBox from "./specialist-gyms-box.svelte";
import { calculateSpecialGymsData, type SpecialGymsCalcResult } from "./stats-calculations";
import { createStatsWatcher, type StatsWatcher } from "./stats-watcher";

function createGymContentManager(gymsDataFn: () => SpecialGymsCalcResult) {
	const propertiesContainer = document.querySelector('[class*="gymContent___"] > [class*="properties___"]');
	const areasElementsMap = toRecord(battleStats, (statName) => [
		statName,
		propertiesContainer.querySelector(`[class*="${statName.toLowerCase()}___"] > [class*="propertyContent___"]`),
	]);

	let statInfoComponentsMap: Partial<Record<BattleStat, unknown>> = {};

	for (const battleStat of battleStats) {
		const component = mount(BattleStatInfo, {
			target: areasElementsMap[battleStat],
			props: {
				get gymsData() {
					return gymsDataFn();
				},
				battleStat,
				marginTopPx: 5,
			},
		});

		statInfoComponentsMap[battleStat] = component;
	}

	function dispose() {
		for (const statName of battleStats) {
			const component = statInfoComponentsMap[statName];

			if (component) {
				unmount(component);
			}
		}

		statInfoComponentsMap = {};
	}

	return { dispose };
}

type GymContentManager = ReturnType<typeof createGymContentManager>;

let specialGymsInfo: unknown;
let statsWatcher: StatsWatcher;
let gymContentManager: GymContentManager;

async function startFeature() {
	let selectedSpecialGym1 = $state(filters.gym.specialist1 as SpecialGym | "none");
	let selectedSpecialGym2 = $state(filters.gym.specialist2 as SpecialGym | "none");
	let stats = $state<Record<BattleStat, number>>(undefined);
	let gymsData = $derived.by(() => calculateSpecialGymsData(stats, selectedSpecialGym1, selectedSpecialGym2));

	statsWatcher = createStatsWatcher();

	statsWatcher.onChange((statsExist) => {
		if (statsExist) {
			stats = statsWatcher.readStats();

			if (!specialGymsInfo) {
				const root = document.querySelector("#gymroot");
				specialGymsInfo = mount(SpecialistGymsBox, {
					target: root.parentElement,
					anchor: root.nextSibling,
					props: {
						stats,
						get selectedSpecialGym1() {
							return selectedSpecialGym1;
						},
						set selectedSpecialGym1(value) {
							selectedSpecialGym1 = value;
						},
						get selectedSpecialGym2() {
							return selectedSpecialGym2;
						},
						set selectedSpecialGym2(value) {
							selectedSpecialGym2 = value;
						},
						get gymsData() {
							return gymsData;
						},
					},
				});
			}

			gymContentManager = gymContentManager ?? createGymContentManager(() => gymsData);
		} else {
			unmount(specialGymsInfo);
			gymContentManager.dispose();
			specialGymsInfo = undefined;
			gymContentManager = undefined;
		}
	});
}

function disposeFeature() {
	statsWatcher.dispose();
	unmount(specialGymsInfo);
	gymContentManager.dispose();
	statsWatcher = undefined;
	specialGymsInfo = undefined;
	gymContentManager = undefined;
}

export default class SpecialistGymsFeature extends Feature {
	constructor() {
		super("Specialist Gyms", "gym");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.gym.specialist;
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		disposeFeature();
	}

	storageKeys() {
		return ["settings.pages.gym.specialist"];
	}
}
