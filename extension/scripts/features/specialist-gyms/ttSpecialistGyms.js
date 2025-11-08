"use strict";

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
	const BATTLE_STAT = {
		STR: "Strength",
		DEF: "Defense",
		SPD: "Speed",
		DEX: "Dexterity",
	};
	const SPECIAL_GYM = {
		BALBOAS: "balboas",
		FRONTLINE: "frontline",
		GYM3000: "gym3000",
		ISOYAMAS: "isoyamas",
		REBOUND: "rebound",
		ELITES: "elites",
	};
	const SPECIAL_GYM_TYPE = {
		SINGLE_STAT: "singleStat",
		TWO_STATS: "twoStats",
	};

	const specialGymDescMap = {
		[SPECIAL_GYM.BALBOAS]: "Balboas Gym (def/dex)",
		[SPECIAL_GYM.FRONTLINE]: "Frontline Fitness (str/spd)",
		[SPECIAL_GYM.GYM3000]: "Gym 3000 (str)",
		[SPECIAL_GYM.ISOYAMAS]: "Mr. Isoyamas (def)",
		[SPECIAL_GYM.REBOUND]: "Total Rebound (spd)",
		[SPECIAL_GYM.ELITES]: "Elites (dex)",
	};
	const specialGymInfo = {
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

	function calculateSingleStatGym(mainStat, otherStats) {
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

	function calculateTwoStatsGym(mainStat1, mainStat2, otherStats) {
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

	function calculateSingleStatAndTwoStatsOverlappingGyms(mainStat, secondaryStat, neglectedStat1, neglectedStat2) {
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

	function calculateSingleStatAndTwoStatsGyms(mainStat, secondaryStat1, secondaryStat2, neglectedStat) {
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

	function calculateSpecialGymsData(stats, selectionOne, selectionTwo) {
		if (selectionOne === NONE && selectionTwo === NONE) {
			return { type: "none" };
		}

		if (selectionOne === NONE || selectionTwo === NONE || selectionOne === selectionTwo) {
			const relevantSelection = selectionOne === NONE ? selectionTwo : selectionOne;
			const selectionConfig = specialGymInfo[relevantSelection];

			if (selectionConfig.type === SPECIAL_GYM_TYPE.SINGLE_STAT) {
				const otherStatNames = Object.values(BATTLE_STAT).filter((statName) => statName !== selectionConfig.statName);

				const result = calculateSingleStatGym(
					stats[selectionConfig.statName],
					otherStatNames.map((statName) => stats[statName])
				);

				return {
					type: "success",
					missing: {
						[selectionConfig.statName]: result.missing.mainStat,
						...otherStatNames.reduce((obj, statName, index) => ({ ...obj, [statName]: result.missing.otherStats[index] }), {}),
					},
					available: {
						[selectionConfig.statName]: result.available.mainStat,
						...otherStatNames.reduce((obj, statName, index) => ({ ...obj, [statName]: result.available.otherStats[index] }), {}),
					},
				};
			} else {
				const otherStatNames = Object.values(BATTLE_STAT).filter(
					(statName) => statName !== selectionConfig.statOneName && statName !== selectionConfig.statTwoName
				);

				const result = calculateTwoStatsGym(
					stats[selectionConfig.statOneName],
					stats[selectionConfig.statTwoName],
					otherStatNames.map((statName) => stats[statName])
				);

				return {
					type: "success",
					missing: {
						[selectionConfig.statOneName]: result.missing.mainStat1,
						[selectionConfig.statTwoName]: result.missing.mainStat2,
						...otherStatNames.reduce((obj, statName, index) => ({ ...obj, [statName]: result.missing.otherStats[index] }), {}),
					},
					available: {
						[selectionConfig.statOneName]: result.available.mainStat1,
						[selectionConfig.statTwoName]: result.available.mainStat2,
						...otherStatNames.reduce((obj, statName, index) => ({ ...obj, [statName]: result.available.otherStats[index] }), {}),
					},
				};
			}
		}

		const selectionOneConfig = specialGymInfo[selectionOne];
		const selectionTwoConfig = specialGymInfo[selectionTwo];

		if (selectionOneConfig.type === selectionTwoConfig.type) {
			return { type: "impossible" };
		}

		const singleStatConfig = selectionOneConfig.type === SPECIAL_GYM_TYPE.SINGLE_STAT ? selectionOneConfig : selectionTwoConfig;
		const twoStatsConfig = selectionOneConfig.type === SPECIAL_GYM_TYPE.SINGLE_STAT ? selectionTwoConfig : selectionOneConfig;

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
				},
				available: {
					[singleStatConfig.statName]: result.available.mainStat,
					[secondaryStatName]: result.available.secondaryStat,
					[neglectedStatsNames[0]]: result.available.neglectedStat1,
					[neglectedStatsNames[1]]: result.available.neglectedStat2,
				},
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
			},
			available: {
				[singleStatConfig.statName]: result.available.mainStat,
				[twoStatsConfig.statOneName]: result.available.secondaryStat1,
				[twoStatsConfig.statTwoName]: result.available.secondaryStat2,
				[neglectedStatName]: result.available.neglectedStat,
			},
		};
	}

	function createStatsWatcher() {
		let onChangeCallback;
		let statsValueElementsMap = {};

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
			const stats = Object.values(BATTLE_STAT).reduce((obj, statName) => {
				obj[statName] = +statsValueElementsMap[statName].textContent.replace(/,/g, "");

				return obj;
			}, {});

			return stats;
		}

		function onChange(cb) {
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

	function createStatAllowedElement(result, statName) {
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

	function createStatRequiredElement(result, statName) {
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

	function createSpecialistGymsBoxElement(prevElement, getStatsFn, statsChangeFn) {
		const { content, container } = createContainer("Specialist Gyms", { class: "tt-specialist-gym", compact: true, previousElement: prevElement });

		const specialGymOptions = [
			{
				value: NONE,
				description: "none",
			},
			...Object.values(SPECIAL_GYM).map((specialGym) => ({
				value: specialGym,
				description: specialGymDescMap[specialGym],
			})),
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

		function renderStatsInfo(stats, result) {
			infoContainer.innerHTML = "";

			if (result.type === "none") {
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

		function updateStats(stats, emit = true) {
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

	function createGymContentManager() {
		const propertiesContainer = document.querySelector('[class*="gymContent___"] > [class*="properties___"]');
		const areasElementsMap = Object.values(BATTLE_STAT).reduce((obj, statName) => {
			const areaElement = propertiesContainer.querySelector(`[class*="${statName.toLowerCase()}___"] > [class*="propertyContent___"]`);
			obj[statName] = areaElement;

			return obj;
		}, {});

		let statsInfoElementsMap = {};

		function updateInfo(result) {
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

	let specialGyms;
	let statsWatcher;
	let gymContentManager;

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
