import { toRecord } from "@common/utils/functions/utilities";
import { BattleStat } from "./models/battle-stat";
import { SpecialGym } from "./models/special-gym";

enum SpecialGymType {
	SINGLE_STAT = "singleStat",
	TWO_STATS = "twoStats",
}

interface BaseSpecialGymInfo<T extends SpecialGymType> {
	type: T;
}

interface TwoStatsSpecialGymInfo extends BaseSpecialGymInfo<SpecialGymType.TWO_STATS> {
	statOneName: BattleStat;
	statTwoName: BattleStat;
}

interface SingleStatSpecialGymInfo extends BaseSpecialGymInfo<SpecialGymType.SINGLE_STAT> {
	statName: BattleStat;
}

type SpecialGymInfo = TwoStatsSpecialGymInfo | SingleStatSpecialGymInfo;

const specialGymInfo: Record<SpecialGym, SpecialGymInfo> = {
	[SpecialGym.BALBOAS]: {
		type: SpecialGymType.TWO_STATS,
		statOneName: BattleStat.DEF,
		statTwoName: BattleStat.DEX,
	},
	[SpecialGym.FRONTLINE]: {
		type: SpecialGymType.TWO_STATS,
		statOneName: BattleStat.STR,
		statTwoName: BattleStat.SPD,
	},
	[SpecialGym.GYM3000]: {
		type: SpecialGymType.SINGLE_STAT,
		statName: BattleStat.STR,
	},
	[SpecialGym.ISOYAMAS]: {
		type: SpecialGymType.SINGLE_STAT,
		statName: BattleStat.DEF,
	},
	[SpecialGym.REBOUND]: {
		type: SpecialGymType.SINGLE_STAT,
		statName: BattleStat.SPD,
	},
	[SpecialGym.ELITES]: {
		type: SpecialGymType.SINGLE_STAT,
		statName: BattleStat.DEX,
	},
};

interface NoneSpecialGymsCalcResult {
	type: "none";
}

interface ImpossibleSpecialGymsCalcResult {
	type: "impossible";
}

interface SuccessSpecialGymsCalcResult {
	type: "success";
	missing: Record<BattleStat, number>;
	available: Record<BattleStat, number>;
}

export type SpecialGymsCalcResult = NoneSpecialGymsCalcResult | ImpossibleSpecialGymsCalcResult | SuccessSpecialGymsCalcResult;

function calculateSingleStatGym(mainStat: number, otherStats: number[]) {
	const highestOther = Math.max(...otherStats);
	const missingMain = Math.max(0, highestOther * 1.25 - mainStat);

	return {
		missing: {
			mainStat: Math.ceil(missingMain),
			otherStats: otherStats.map(() => 0),
		},
		available: {
			mainStat: Infinity,
			otherStats: otherStats.map((otherStat) => Math.floor(Math.max(0, (mainStat + missingMain) / 1.25 - otherStat))),
		},
	};
}

function calculateTwoStatsGym(mainStat1: number, mainStat2: number, otherStats: number[]) {
	let newMainStat1 = mainStat1;
	let newMainStat2 = mainStat2;

	const otherStatsSum = otherStats.reduce((a, b) => a + b, 0);

	if (otherStatsSum * 1.25 > newMainStat1 + newMainStat2) {
		const extra = otherStatsSum * 1.25 - newMainStat1 - newMainStat2;
		const addToMainStat1 = Math.min(extra, Math.max(0, (newMainStat2 + extra - newMainStat1) / 2));

		newMainStat1 += addToMainStat1;
		newMainStat2 += extra - addToMainStat1;
	}

	return {
		missing: {
			mainStat1: Math.ceil(newMainStat1 - mainStat1),
			mainStat2: Math.ceil(newMainStat2 - mainStat2),
			otherStats: otherStats.map(() => 0),
		},
		available: {
			mainStat1: Infinity,
			mainStat2: Infinity,
			otherStats: otherStats.map(() => Math.floor(Math.max(0, (newMainStat1 + newMainStat2) / 1.25 - otherStatsSum))),
		},
	};
}

function calculateSingleStatAndTwoStatsOverlappingGyms(mainStat: number, secondaryStat: number, neglectedStat1: number, neglectedStat2: number) {
	let newMainStat = mainStat;
	let newSecondaryStat = secondaryStat;
	const newNeglectedStat1 = neglectedStat1;
	const newNeglectedStat2 = neglectedStat2;

	while (true) {
		const highestNonMainStat = Math.max(newSecondaryStat, newNeglectedStat1, newNeglectedStat2);

		if (highestNonMainStat * 1.25 > newMainStat) {
			newMainStat += highestNonMainStat * 1.25 - newMainStat;

			continue;
		}

		if ((newNeglectedStat1 + newNeglectedStat2) * 1.25 > newMainStat + newSecondaryStat) {
			const extra = (newNeglectedStat1 + newNeglectedStat2) * 1.25 - newMainStat - newSecondaryStat;
			const addToMainStat = Math.min(extra, Math.max(0, (1.25 * (newSecondaryStat + extra) - newMainStat) / (1 + 1.25)));

			newMainStat += addToMainStat;
			newSecondaryStat += extra - addToMainStat;

			continue;
		}

		return {
			missing: {
				mainStat: Math.ceil(newMainStat - mainStat),
				secondaryStat: Math.ceil(newSecondaryStat - secondaryStat),
				neglectedStat1: Math.ceil(newNeglectedStat1 - neglectedStat1),
				neglectedStat2: Math.ceil(newNeglectedStat2 - neglectedStat2),
			},
			available: {
				mainStat: Infinity,
				secondaryStat: Math.floor(Math.max(0, newMainStat / 1.25 - newSecondaryStat)),
				neglectedStat1: Math.floor(
					Math.max(
						0,
						Math.min((newMainStat + newSecondaryStat) / 1.25 - newNeglectedStat1 - newNeglectedStat2, newMainStat / 1.25 - newNeglectedStat1),
					),
				),
				neglectedStat2: Math.floor(
					Math.max(
						0,
						Math.min((newMainStat + newSecondaryStat) / 1.25 - newNeglectedStat1 - newNeglectedStat2, newMainStat / 1.25 - newNeglectedStat2),
					),
				),
			},
		};
	}
}

function calculateSingleStatAndTwoStatsGyms(mainStat: number, secondaryStat1: number, secondaryStat2: number, neglectedStat: number) {
	let newMainStat = mainStat;
	let newSecondaryStat1 = secondaryStat1;
	let newSecondaryStat2 = secondaryStat2;
	const newNeglectedStat = neglectedStat;

	while (true) {
		const highestNonMainStat = Math.max(newSecondaryStat1, newSecondaryStat2, newNeglectedStat);

		if (highestNonMainStat * 1.25 > newMainStat) {
			newMainStat += highestNonMainStat * 1.25 - newMainStat;

			continue;
		}

		if ((newMainStat + newNeglectedStat) * 1.25 > newSecondaryStat1 + newSecondaryStat2) {
			const extra = (newMainStat + newNeglectedStat) * 1.25 - newSecondaryStat1 - newSecondaryStat2;
			const addToSecondaryStat1 = Math.min(extra, Math.max(0, (newSecondaryStat2 + extra - newSecondaryStat1) / 2));

			newSecondaryStat1 += addToSecondaryStat1;
			newSecondaryStat2 += extra - addToSecondaryStat1;

			continue;
		}

		return {
			missing: {
				mainStat: Math.ceil(newMainStat - mainStat),
				secondaryStat1: Math.ceil(newSecondaryStat1 - secondaryStat1),
				secondaryStat2: Math.ceil(newSecondaryStat2 - secondaryStat2),
				neglectedStat: Math.ceil(newNeglectedStat - neglectedStat),
			},
			available: {
				mainStat: Math.floor(Math.max(0, (newSecondaryStat1 + newSecondaryStat2) / 1.25 - newNeglectedStat - newMainStat)),
				secondaryStat1: Math.floor(Math.max(0, newMainStat / 1.25 - newSecondaryStat1)),
				secondaryStat2: Math.floor(Math.max(0, newMainStat / 1.25 - newSecondaryStat2)),
				neglectedStat: Math.floor(
					Math.max(0, Math.min(newMainStat / 1.25, (newSecondaryStat1 + newSecondaryStat2) / 1.25 - newMainStat) - newNeglectedStat),
				),
			},
		};
	}
}

export function calculateSpecialGymsData(
	stats: Record<BattleStat, number>,
	selectionOne: "none" | SpecialGym,
	selectionTwo: "none" | SpecialGym,
): SpecialGymsCalcResult {
	if (selectionOne === "none" && selectionTwo === "none") {
		return { type: "none" };
	}

	if (selectionOne === "none" || selectionTwo === "none" || selectionOne === selectionTwo) {
		const relevantSelection = selectionOne === "none" ? (selectionTwo as SpecialGym) : selectionOne;
		const selectionSpecialGymInfo = specialGymInfo[relevantSelection];

		if (selectionSpecialGymInfo.type === SpecialGymType.SINGLE_STAT) {
			const otherStatNames = Object.values(BattleStat).filter((statName) => statName !== selectionSpecialGymInfo.statName);

			const result = calculateSingleStatGym(
				stats[selectionSpecialGymInfo.statName],
				otherStatNames.map((statName) => stats[statName]),
			);

			return {
				type: "success",
				missing: {
					[selectionSpecialGymInfo.statName]: result.missing.mainStat,
					...toRecord(otherStatNames, (statName, index) => [statName, result.missing.otherStats[index]]),
				},
				available: {
					[selectionSpecialGymInfo.statName]: result.available.mainStat,
					...toRecord(otherStatNames, (statName, index) => [statName, result.available.otherStats[index]]),
				},
			};
		} else {
			const otherStatNames = Object.values(BattleStat).filter(
				(statName) => statName !== selectionSpecialGymInfo.statOneName && statName !== selectionSpecialGymInfo.statTwoName,
			);

			const result = calculateTwoStatsGym(
				stats[selectionSpecialGymInfo.statOneName],
				stats[selectionSpecialGymInfo.statTwoName],
				otherStatNames.map((statName) => stats[statName]),
			);

			return {
				type: "success",
				missing: {
					[selectionSpecialGymInfo.statOneName]: result.missing.mainStat1,
					[selectionSpecialGymInfo.statTwoName]: result.missing.mainStat2,
					...toRecord(otherStatNames, (statName, index) => [statName, result.missing.otherStats[index]]),
				},
				available: {
					[selectionSpecialGymInfo.statOneName]: result.available.mainStat1,
					[selectionSpecialGymInfo.statTwoName]: result.available.mainStat2,
					...toRecord(otherStatNames, (statName, index) => [statName, result.available.otherStats[index]]),
				},
			};
		}
	}

	const selectionOneSpecialGymInfo = specialGymInfo[selectionOne];
	const selectionTwoSpecialGymInfo = specialGymInfo[selectionTwo];

	if (selectionOneSpecialGymInfo.type === selectionTwoSpecialGymInfo.type) {
		return { type: "impossible" };
	}

	const singleStatConfig =
		selectionOneSpecialGymInfo.type === SpecialGymType.SINGLE_STAT ? selectionOneSpecialGymInfo : (selectionTwoSpecialGymInfo as SingleStatSpecialGymInfo);
	const twoStatsConfig =
		selectionOneSpecialGymInfo.type === SpecialGymType.SINGLE_STAT ? (selectionTwoSpecialGymInfo as TwoStatsSpecialGymInfo) : selectionOneSpecialGymInfo;

	if (twoStatsConfig.statOneName === singleStatConfig.statName || twoStatsConfig.statTwoName === singleStatConfig.statName) {
		const secondaryStatName = twoStatsConfig.statOneName === singleStatConfig.statName ? twoStatsConfig.statTwoName : twoStatsConfig.statOneName;
		const neglectedStatsNames = Object.values(BattleStat).filter(
			(statName) => statName !== twoStatsConfig.statOneName && statName !== twoStatsConfig.statTwoName,
		);
		const result = calculateSingleStatAndTwoStatsOverlappingGyms(
			stats[singleStatConfig.statName],
			stats[secondaryStatName],
			stats[neglectedStatsNames[0]],
			stats[neglectedStatsNames[1]],
		);

		return {
			type: "success",
			missing: {
				[singleStatConfig.statName]: result.missing.mainStat,
				[secondaryStatName]: result.missing.secondaryStat,
				[neglectedStatsNames[0]]: result.missing.neglectedStat1,
				[neglectedStatsNames[1]]: result.missing.neglectedStat2,
			} as Record<BattleStat, number>,
			available: {
				[singleStatConfig.statName]: result.available.mainStat,
				[secondaryStatName]: result.available.secondaryStat,
				[neglectedStatsNames[0]]: result.available.neglectedStat1,
				[neglectedStatsNames[1]]: result.available.neglectedStat2,
			} as Record<BattleStat, number>,
		};
	}

	const neglectedStatName = Object.values(BattleStat).find(
		(statName) => statName !== singleStatConfig.statName && statName !== twoStatsConfig.statOneName && statName !== twoStatsConfig.statTwoName,
	);

	const result = calculateSingleStatAndTwoStatsGyms(
		stats[singleStatConfig.statName],
		stats[twoStatsConfig.statOneName],
		stats[twoStatsConfig.statTwoName],
		stats[neglectedStatName],
	);

	return {
		type: "success",
		missing: {
			[singleStatConfig.statName]: result.missing.mainStat,
			[twoStatsConfig.statOneName]: result.missing.secondaryStat1,
			[twoStatsConfig.statTwoName]: result.missing.secondaryStat2,
			[neglectedStatName]: result.missing.neglectedStat,
		} as Record<BattleStat, number>,
		available: {
			[singleStatConfig.statName]: result.available.mainStat,
			[twoStatsConfig.statOneName]: result.available.secondaryStat1,
			[twoStatsConfig.statTwoName]: result.available.secondaryStat2,
			[neglectedStatName]: result.available.neglectedStat,
		} as Record<BattleStat, number>,
	};
}
