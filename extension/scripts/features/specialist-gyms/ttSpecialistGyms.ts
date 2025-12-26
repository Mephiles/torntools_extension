(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Specialist Gyms",
		"gym",
		() => settings.pages.gym.specialist,
		undefined,
		startFeature,
		disposeFeature,
		{
			storage: ["settings.pages.gym.specialist"],
		},
		undefined
	);

	const NONE = "none";
	type NONE = typeof NONE;

	const BATTLE_STAT = {
		STR: "Strength",
		DEF: "Defense",
		SPD: "Speed",
		DEX: "Dexterity",
	} as const satisfies Record<string, string>;
	type BATTLE_STAT = (typeof BATTLE_STAT)[keyof typeof BATTLE_STAT];

	const SPECIAL_GYM = {
		BALBOAS: "balboas",
		FRONTLINE: "frontline",
		GYM3000: "gym3000",
		ISOYAMAS: "isoyamas",
		REBOUND: "rebound",
		ELITES: "elites",
	} as const satisfies Record<string, string>;
	type SPECIAL_GYM = (typeof SPECIAL_GYM)[keyof typeof SPECIAL_GYM];

	const SPECIAL_GYM_TYPE = {
		SINGLE_STAT: "singleStat",
		TWO_STATS: "twoStats",
	} as const satisfies Record<string, string>;
	type SPECIAL_GYM_TYPE = (typeof SPECIAL_GYM_TYPE)[keyof typeof SPECIAL_GYM_TYPE];

	const specialGymDescMap: Record<SPECIAL_GYM, string> = {
		[SPECIAL_GYM.BALBOAS]: "Balboas Gym (def/dex)",
		[SPECIAL_GYM.FRONTLINE]: "Frontline Fitness (str/spd)",
		[SPECIAL_GYM.GYM3000]: "Gym 3000 (str)",
		[SPECIAL_GYM.ISOYAMAS]: "Mr. Isoyamas (def)",
		[SPECIAL_GYM.REBOUND]: "Total Rebound (spd)",
		[SPECIAL_GYM.ELITES]: "Elites (dex)",
	};

	interface BaseSpecialGymInfo<T extends SPECIAL_GYM_TYPE> {
		type: T;
	}

	interface TwoStatsSpecialGymInfo extends BaseSpecialGymInfo<"twoStats"> {
		statOneName: BATTLE_STAT;
		statTwoName: BATTLE_STAT;
	}

	interface SingleStatSpecialGymInfo extends BaseSpecialGymInfo<"singleStat"> {
		statName: BATTLE_STAT;
	}

	type SpecialGymInfo = TwoStatsSpecialGymInfo | SingleStatSpecialGymInfo;

	const specialGymInfo: Record<SPECIAL_GYM, SpecialGymInfo> = {
		[SPECIAL_GYM.BALBOAS]: {
			type: SPECIAL_GYM_TYPE.TWO_STATS,
			statOneName: BATTLE_STAT.DEF,
			statTwoName: BATTLE_STAT.DEX,
		},
		[SPECIAL_GYM.FRONTLINE]: {
			type: SPECIAL_GYM_TYPE.TWO_STATS,
			statOneName: BATTLE_STAT.STR,
			statTwoName: BATTLE_STAT.SPD,
		},
		[SPECIAL_GYM.GYM3000]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.STR,
		},
		[SPECIAL_GYM.ISOYAMAS]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.DEF,
		},
		[SPECIAL_GYM.REBOUND]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.SPD,
		},
		[SPECIAL_GYM.ELITES]: {
			type: SPECIAL_GYM_TYPE.SINGLE_STAT,
			statName: BATTLE_STAT.DEX,
		},
	};

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

		const otherStatsSum = otherStats.totalSum();

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
		let newNeglectedStat1 = neglectedStat1;
		let newNeglectedStat2 = neglectedStat2;

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
							Math.min((newMainStat + newSecondaryStat) / 1.25 - newNeglectedStat1 - newNeglectedStat2, newMainStat / 1.25 - newNeglectedStat1)
						)
					),
					neglectedStat2: Math.floor(
						Math.max(
							0,
							Math.min((newMainStat + newSecondaryStat) / 1.25 - newNeglectedStat1 - newNeglectedStat2, newMainStat / 1.25 - newNeglectedStat2)
						)
					),
				},
			};
		}
	}

	function calculateSingleStatAndTwoStatsGyms(mainStat: number, secondaryStat1: number, secondaryStat2: number, neglectedStat: number) {
		let newMainStat = mainStat;
		let newSecondaryStat1 = secondaryStat1;
		let newSecondaryStat2 = secondaryStat2;
		let newNeglectedStat = neglectedStat;

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
						Math.max(0, Math.min(newMainStat / 1.25, (newSecondaryStat1 + newSecondaryStat2) / 1.25 - newMainStat) - newNeglectedStat)
					),
				},
			};
		}
	}

	interface NoneSpecialGymsCalcResult {
		type: NONE;
	}

	interface ImpossibleSpecialGymsCalcResult {
		type: "impossible";
	}

	interface SuccessSpecialGymsCalcResult {
		type: "success";
		missing: Record<BATTLE_STAT, number>;
		available: Record<BATTLE_STAT, number>;
	}

	type SpecialGymsCalcResult = NoneSpecialGymsCalcResult | ImpossibleSpecialGymsCalcResult | SuccessSpecialGymsCalcResult;

	function calculateSpecialGymsData(
		stats: Record<BATTLE_STAT, number>,
		selectionOne: NONE | SPECIAL_GYM,
		selectionTwo: NONE | SPECIAL_GYM
	): SpecialGymsCalcResult {
		if (selectionOne === NONE && selectionTwo === NONE) {
			return { type: NONE };
		}

		if (selectionOne === NONE || selectionTwo === NONE || selectionOne === selectionTwo) {
			const relevantSelection = selectionOne === NONE ? (selectionTwo as SPECIAL_GYM) : selectionOne;
			const selectionSpecialGymInfo = specialGymInfo[relevantSelection];

			if (selectionSpecialGymInfo.type === SPECIAL_GYM_TYPE.SINGLE_STAT) {
				const otherStatNames = Object.values(BATTLE_STAT).filter((statName) => statName !== selectionSpecialGymInfo.statName);

				const result = calculateSingleStatGym(
					stats[selectionSpecialGymInfo.statName],
					otherStatNames.map((statName) => stats[statName])
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
				const otherStatNames = Object.values(BATTLE_STAT).filter(
					(statName) => statName !== selectionSpecialGymInfo.statOneName && statName !== selectionSpecialGymInfo.statTwoName
				);

				const result = calculateTwoStatsGym(
					stats[selectionSpecialGymInfo.statOneName],
					stats[selectionSpecialGymInfo.statTwoName],
					otherStatNames.map((statName) => stats[statName])
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
			selectionOneSpecialGymInfo.type === SPECIAL_GYM_TYPE.SINGLE_STAT
				? selectionOneSpecialGymInfo
				: (selectionTwoSpecialGymInfo as SingleStatSpecialGymInfo);
		const twoStatsConfig =
			selectionOneSpecialGymInfo.type === SPECIAL_GYM_TYPE.SINGLE_STAT
				? (selectionTwoSpecialGymInfo as TwoStatsSpecialGymInfo)
				: selectionOneSpecialGymInfo;

		if (twoStatsConfig.statOneName === singleStatConfig.statName || twoStatsConfig.statTwoName === singleStatConfig.statName) {
			const secondaryStatName = twoStatsConfig.statOneName === singleStatConfig.statName ? twoStatsConfig.statTwoName : twoStatsConfig.statOneName;
			const neglectedStatsNames = Object.values(BATTLE_STAT).filter(
				(statName) => statName !== twoStatsConfig.statOneName && statName !== twoStatsConfig.statTwoName
			);
			const result = calculateSingleStatAndTwoStatsOverlappingGyms(
				stats[singleStatConfig.statName],
				stats[secondaryStatName],
				stats[neglectedStatsNames[0]],
				stats[neglectedStatsNames[1]]
			);

			return {
				type: "success",
				missing: {
					[singleStatConfig.statName]: result.missing.mainStat,
					[secondaryStatName]: result.missing.secondaryStat,
					[neglectedStatsNames[0]]: result.missing.neglectedStat1,
					[neglectedStatsNames[1]]: result.missing.neglectedStat2,
				} as Record<BATTLE_STAT, number>,
				available: {
					[singleStatConfig.statName]: result.available.mainStat,
					[secondaryStatName]: result.available.secondaryStat,
					[neglectedStatsNames[0]]: result.available.neglectedStat1,
					[neglectedStatsNames[1]]: result.available.neglectedStat2,
				} as Record<BATTLE_STAT, number>,
			};
		}

		const neglectedStatName = Object.values(BATTLE_STAT).find(
			(statName) => statName !== singleStatConfig.statName && statName !== twoStatsConfig.statOneName && statName !== twoStatsConfig.statTwoName
		);

		const result = calculateSingleStatAndTwoStatsGyms(
			stats[singleStatConfig.statName],
			stats[twoStatsConfig.statOneName],
			stats[twoStatsConfig.statTwoName],
			stats[neglectedStatName]
		);

		return {
			type: "success",
			missing: {
				[singleStatConfig.statName]: result.missing.mainStat,
				[twoStatsConfig.statOneName]: result.missing.secondaryStat1,
				[twoStatsConfig.statTwoName]: result.missing.secondaryStat2,
				[neglectedStatName]: result.missing.neglectedStat,
			} as Record<BATTLE_STAT, number>,
			available: {
				[singleStatConfig.statName]: result.available.mainStat,
				[twoStatsConfig.statOneName]: result.available.secondaryStat1,
				[twoStatsConfig.statTwoName]: result.available.secondaryStat2,
				[neglectedStatName]: result.available.neglectedStat,
			} as Record<BATTLE_STAT, number>,
		};
	}

	function createStatsWatcher() {
		type ChangeCallback = (statsExist: boolean) => void;
		let onChangeCallback: ChangeCallback;
		let statsValueElementsMap: Partial<Record<BATTLE_STAT, Element>> = {};

		const chainObserver = observeChain(document, ['[class*="gymContent___"]:has([class*="properties___"] [class*="propertyValue___"])'], (gymContent) => {
			const statsObservers = Object.values(BATTLE_STAT).map((statName) => {
				const selector = `[class*="${statName.toLowerCase()}___"] [class*="propertyTitle___"] [class*="propertyValue___"]`;
				const observer = new MutationObserver(() => onChangeCallback?.(true));
				const element = gymContent.querySelector(selector);

				statsValueElementsMap[statName] = element;
				observer.observe(element, { characterData: true, childList: true, subtree: true });

				return observer;
			});

			onChangeCallback?.(true);

			return () => {
				statsObservers.forEach((statObserver) => statObserver.disconnect());
				statsValueElementsMap = {};
				onChangeCallback?.(false);
			};
		});

		function readStats() {
			return toRecord(Object.values(BATTLE_STAT), (statName) => [statName, +statsValueElementsMap[statName].textContent.replace(/,/g, "")]);
		}

		function onChange(cb: ChangeCallback) {
			onChangeCallback = cb;
		}

		function dispose() {
			chainObserver.disconnect();
		}

		return {
			readStats,
			onChange,
			dispose,
		};
	}

	type StatsWatcher = ReturnType<typeof createStatsWatcher>;

	function createStatAllowedElement(result: SuccessSpecialGymsCalcResult, statName: BATTLE_STAT) {
		return document.newElement({
			type: "div",
			class: "tt-specialist-stat-allowed",
			children: [
				document.newElement({
					type: "span",
					text: "Allowed: ",
				}),
				document.newElement({
					type: "span",
					text: formatNumber(result.missing[statName] + result.available[statName]),
				}),
			],
		});
	}

	function createStatRequiredElement(result: SuccessSpecialGymsCalcResult, statName: BATTLE_STAT) {
		return document.newElement({
			type: "div",
			class: "tt-specialist-stat-required",
			children: [
				document.newElement({
					type: "span",
					text: "Required: ",
				}),
				document.newElement({
					type: "span",
					text: formatNumber(result.missing[statName]),
				}),
			],
		});
	}

	interface SpecialGymOption {
		value: NONE | SPECIAL_GYM;
		description: string;
	}

	function createSpecialistGymsBoxElement(prevElement: Element, getStatsFn: () => Record<BATTLE_STAT, number>, statsChangeFn: () => void) {
		const { content, container } = createContainer("Specialist Gyms", { class: "tt-specialist-gym", compact: true, previousElement: prevElement });

		const specialGymOptions: SpecialGymOption[] = [
			{
				value: NONE,
				description: NONE,
			},
			...Object.values(SPECIAL_GYM).map(
				(specialGym): SpecialGymOption => ({
					value: specialGym,
					description: specialGymDescMap[specialGym],
				})
			),
		];

		const specialGymSelectOne = createSelect(specialGymOptions);
		specialGymSelectOne.setSelected(filters.gym.specialist1);

		const specialGymSelectTwo = createSelect(specialGymOptions);
		specialGymSelectTwo.setSelected(filters.gym.specialist2);

		const selectsContainer = document.newElement({
			type: "div",
			class: "tt-specialist-gym-selects-container",
			children: [specialGymSelectOne.element, specialGymSelectTwo.element],
		});

		const infoContainer = document.newElement({
			type: "div",
			class: "tt-specialist-gym-info-container",
		});

		content.appendChild(selectsContainer);
		content.appendChild(infoContainer);

		function renderStatsInfo(stats: Record<BATTLE_STAT, number>, result: SpecialGymsCalcResult) {
			infoContainer.innerHTML = "";

			if (result.type === NONE) {
				const resultDesc = document.newElement({
					type: "div",
					class: "tt-specialist-gyms-message",
					text: "No special gyms were selected.",
				});
				infoContainer.appendChild(resultDesc);
			} else if (result.type === "impossible") {
				const resultDesc = document.newElement({
					type: "div",
					class: "tt-specialist-gyms-message",
					text: "This combination of specialist gyms is impossible.",
				});
				infoContainer.appendChild(resultDesc);
			} else {
				const statsInfo = document.newElement({
					type: "div",
					class: "tt-specialist-stats-info",
				});
				infoContainer.appendChild(statsInfo);

				Object.values(BATTLE_STAT).forEach((statName) => {
					const statValue = stats[statName] + result.missing[statName];

					statsInfo.appendChild(
						document.newElement({
							type: "div",
							class: "tt-specialist-stat-info",
							children: [
								document.newElement({
									type: "div",
									class: "tt-specialist-stat-header",
									text: statName,
								}),
								document.newElement({
									type: "div",
									class: "tt-specialist-stat-value",
									text: formatNumber(statValue),
								}),
								createStatRequiredElement(result, statName),
								createStatAllowedElement(result, statName),
							],
						})
					);
				});
			}
		}

		let specialGymOne = specialGymSelectOne.getSelected();
		let specialGymTwo = specialGymSelectTwo.getSelected();

		updateStats(getStatsFn(), false);

		specialGymSelectOne.onChange(() => {
			const specialGym = specialGymSelectOne.getSelected();
			ttStorage.change({ filters: { gym: { specialist1: specialGym } } });

			specialGymOne = specialGym;

			updateStats(getStatsFn());
		});
		specialGymSelectTwo.onChange(() => {
			const specialGym = specialGymSelectTwo.getSelected();
			ttStorage.change({ filters: { gym: { specialist2: specialGym } } });

			specialGymTwo = specialGym;

			updateStats(getStatsFn());
		});

		function updateStats(stats: Record<BATTLE_STAT, number>, emit = true) {
			const result = calculateSpecialGymsData(stats, specialGymOne, specialGymTwo);
			renderStatsInfo(stats, result);

			if (emit) {
				statsChangeFn();
			}
		}

		function dispose() {
			specialGymSelectOne.dispose();
			specialGymSelectTwo.dispose();
			container.remove();
		}

		return {
			dispose,
			updateStats: () => updateStats(getStatsFn(), false),
			getSpecialGymOne: () => specialGymOne,
			getSpecialGymTwo: () => specialGymTwo,
		};
	}

	type SpecialistGymsBoxElement = ReturnType<typeof createSpecialistGymsBoxElement>;

	function createGymContentManager() {
		const propertiesContainer = document.querySelector('[class*="gymContent___"] > [class*="properties___"]');
		const areasElementsMap = toRecord(Object.values(BATTLE_STAT), (statName) => [
			statName,
			propertiesContainer.querySelector(`[class*="${statName.toLowerCase()}___"] > [class*="propertyContent___"]`),
		]);

		let statsInfoElementsMap: Partial<Record<BATTLE_STAT, HTMLElement>> = {};

		function updateInfo(result: SuccessSpecialGymsCalcResult) {
			for (const statName of Object.values(BATTLE_STAT)) {
				const statInfoElement = statsInfoElementsMap[statName];

				if (statInfoElement) {
					statInfoElement.remove();
				}

				const newInfoElement = result.missing[statName] ? createStatRequiredElement(result, statName) : createStatAllowedElement(result, statName);
				newInfoElement.style.marginTop = "5px";

				statsInfoElementsMap[statName] = newInfoElement;

				areasElementsMap[statName].appendChild(newInfoElement);
			}
		}

		function dispose() {
			for (const statName of Object.values(BATTLE_STAT)) {
				const statInfoElement = statsInfoElementsMap[statName];

				if (statInfoElement) {
					statInfoElement.remove();
				}
			}

			statsInfoElementsMap = {};
		}

		return { updateInfo, dispose };
	}

	type GymContentManager = ReturnType<typeof createGymContentManager>;

	let specialGyms: SpecialistGymsBoxElement;
	let statsWatcher: StatsWatcher;
	let gymContentManager: GymContentManager;

	async function startFeature() {
		function updateGymContentInfo() {
			const result = calculateSpecialGymsData(statsWatcher.readStats(), specialGyms.getSpecialGymOne(), specialGyms.getSpecialGymTwo());

			if (result.type === "success") {
				gymContentManager.updateInfo(result);
			} else {
				gymContentManager.dispose();
			}
		}

		statsWatcher = createStatsWatcher();

		statsWatcher.onChange((statsExist) => {
			if (statsExist) {
				gymContentManager = gymContentManager ?? createGymContentManager();
				specialGyms =
					specialGyms ?? createSpecialistGymsBoxElement(document.querySelector("#gymroot"), () => statsWatcher.readStats(), updateGymContentInfo);

				specialGyms.updateStats();
				updateGymContentInfo();
			} else {
				specialGyms.dispose();
				gymContentManager.dispose();
				specialGyms = undefined;
				gymContentManager = undefined;
			}
		});
	}

	function disposeFeature() {
		specialGyms.dispose();
		statsWatcher.dispose();
		gymContentManager.dispose();
		statsWatcher = undefined;
		specialGyms = undefined;
		gymContentManager = undefined;
	}
})();
