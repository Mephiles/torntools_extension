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
				mainStat: Math.round(missingMain),
				otherStats: otherStats.map(() => 0),
			},
			available: {
				mainStat: Infinity,
				otherStats: otherStats.map((otherStat) => Math.round(Math.max(0, (mainStat + missingMain) / 1.25 - otherStat))),
			},
		};
	}

	function calculateTwoStatsGym(mainStat1, mainStat2, otherStats) {
		let newMainStat1 = mainStat1;
		let newMainStat2 = mainStat2;

		const total = otherStats.totalSum() * 1.25;

		if (total > newMainStat1 + newMainStat2) {
			const desiredHalf = total / 2;

			if (newMainStat1 < desiredHalf) {
				newMainStat1 = desiredHalf;
			}

			if (newMainStat2 < desiredHalf) {
				newMainStat2 = desiredHalf;
			}

			const leftover = Math.max(0, total - (newMainStat1 + newMainStat2));
			const halfLeftover = leftover / 2;

			newMainStat1 += halfLeftover;
			newMainStat2 += halfLeftover;
		}

		return {
			missing: {
				mainStat1: Math.round(newMainStat1 - mainStat1),
				mainStat2: Math.round(newMainStat2 - mainStat2),
				otherStats: otherStats.map(() => 0),
			},
			available: {
				mainStat1: Infinity,
				mainStat2: Infinity,
				otherStats: otherStats.map((otherStat) => Math.round(Math.max(0, (newMainStat1 + newMainStat2) / 1.25 - total - otherStat))),
			},
		};
	}

	function calculateSingleStatAndTwoStatsGyms(mainStat, secondaryStat1, secondaryStat2, neglectedStat) {
		let newMainStat = mainStat;
		let newSecondaryStat1 = secondaryStat1;
		let newSecondaryStat2 = secondaryStat2;
		let newNeglectedStat = neglectedStat;

		while (true) {
			const highestSecondary = Math.max(newSecondaryStat1, newSecondaryStat2);

			if (highestSecondary * 1.25 > newMainStat) {
				newMainStat += highestSecondary * 1.25 - newMainStat;

				continue;
			}

			if ((newMainStat + newNeglectedStat) * 1.25 > newSecondaryStat1 + newSecondaryStat2) {
				const total = (newMainStat + newNeglectedStat) * 1.25;
				const desiredHalf = total / 2;

				if (total > newSecondaryStat1 + newSecondaryStat2) {
					if (newSecondaryStat1 < desiredHalf) {
						newSecondaryStat1 = desiredHalf;
					}

					if (newSecondaryStat2 < desiredHalf) {
						newSecondaryStat2 = desiredHalf;
					}

					const leftover = Math.max(0, total - newSecondaryStat1 - newSecondaryStat2);
					const halfLeftover = leftover / 2;

					newSecondaryStat1 += halfLeftover;
					newSecondaryStat2 += halfLeftover;
				}

				continue;
			}

			return {
				missing: {
					mainStat: Math.round(newMainStat - mainStat),
					secondaryStat1: Math.round(newSecondaryStat1 - secondaryStat1),
					secondaryStat2: Math.round(newSecondaryStat2 - secondaryStat2),
					neglectedStat: Math.round(newNeglectedStat - neglectedStat),
				},
				available: {
					mainStat: Math.round(Math.max(0, (newSecondaryStat1 + newSecondaryStat2) / 1.25 - newNeglectedStat - newMainStat)),
					secondaryStat1: Math.round(Math.max(0, newMainStat / 1.25 - newSecondaryStat1)),
					secondaryStat2: Math.round(Math.max(0, newMainStat / 1.25 - newSecondaryStat2)),
					neglectedStat: Math.round(
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
			return { type: "impossible" };
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

		const statsValueElementsMap = Object.values(BATTLE_STAT).reduce((obj, statName) => {
			const valueElement = document.querySelector(
				`[class*="gymContent___"] [class*="${statName.toLowerCase()}___"] [class*="propertyTitle___"] [class*="propertyValue___"]`
			);
			obj[statName] = valueElement;

			return obj;
		}, {});

		const observer = new MutationObserver(() => {
			if (onChangeCallback) {
				onChangeCallback();
			}
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
			observer.disconnect();
		}

		Object.values(BATTLE_STAT).forEach((statName) =>
			observer.observe(statsValueElementsMap[statName], { characterData: true, childList: true, subtree: true })
		);

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
					text: "Those special gyms combination is impossible.",
				});
				infoContainer.appendChild(resultDesc);
			} else {
				const explanationLine = document.newElement({
					type: "div",
					text: "Closest stats to unlock selected special gyms",
					class: "tt-specialist-stats-header",
				});
				infoContainer.appendChild(explanationLine);

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
		await requireElement('[class*="gymContent___"] > [class*="properties___"] [class*="propertyValue___"]');

		statsWatcher = createStatsWatcher();
		gymContentManager = createGymContentManager();

		function updateGymContentInfo() {
			const result = calculateSpecialGymsData(statsWatcher.readStats(), specialGyms.getSpecialGymOne(), specialGyms.getSpecialGymTwo());

			if (result.type === "success") {
				gymContentManager.updateInfo(result);
			} else {
				gymContentManager.dispose();
			}
		}

		specialGyms = createSpecialistGymsBoxElement(document.querySelector("#gymroot"), () => statsWatcher.readStats(), updateGymContentInfo);

		statsWatcher.onChange(() => {
			specialGyms.updateStats();
			updateGymContentInfo();
		});

		updateGymContentInfo();
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
