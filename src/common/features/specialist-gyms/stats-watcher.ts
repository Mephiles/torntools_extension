import { observeChain } from "@common/utils/functions/requires";
import { toRecord } from "@common/utils/functions/utilities";
import { type BattleStat, battleStats } from "./models/battle-stat";

export function createStatsWatcher() {
	type ChangeCallback = (statsExist: boolean) => void;
	let onChangeCallback: ChangeCallback;
	let statsValueElementsMap: Partial<Record<BattleStat, Element>> = {};

	const chainObserver = observeChain(document, ['[class*="gymContent___"]:has([class*="properties___"] [class*="propertyValue___"])'], (gymContent) => {
		const statsObservers = battleStats.map((statName) => {
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
		return toRecord(battleStats, (statName) => [statName, +statsValueElementsMap[statName].textContent.replace(/,/g, "")]);
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

export type StatsWatcher = ReturnType<typeof createStatsWatcher>;
