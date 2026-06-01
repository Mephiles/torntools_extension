<script lang="ts">
	import { attackHistoryStore } from "@extension/entrypoints/targets/stores/database-store.svelte";
	import type { AttackHistory } from "@utils/data/default-database";
	import { formatDate, formatTime } from "@utils/functions/formatting";
	import { columns, type HistoryRow, type SwitchableKey } from "./columns";
	import DataTable from "./data-table.svelte";

	interface HistoryTableV2Props {
		showPercentages?: boolean;
	}

	let { showPercentages = false }: HistoryTableV2Props = $props();

	const data = $derived(Object.entries($attackHistoryStore?.history ?? {}).map(([id, attack]) => createHistoryRow(id, attack, showPercentages)));

	function createHistoryRow(id: string, data: AttackHistory, showPercentageValues: boolean): HistoryRow {
		const respect = getRespectValue(data);

		return {
			id,
			name: data.name,
			lastAttack: data.lastAttack,
			lastAttackLabel: getLastAttackLabel(data.lastAttack),
			lastAttackCode: data.lastAttackCode,
			win: data.win,
			mug: getSwitchableSortValue(data, "mug", showPercentageValues),
			mugLabel: getSwitchableLabel(data, "mug", showPercentageValues),
			leave: getSwitchableSortValue(data, "leave", showPercentageValues),
			leaveLabel: getSwitchableLabel(data, "leave", showPercentageValues),
			hospitalise: getSwitchableSortValue(data, "hospitalise", showPercentageValues),
			hospitaliseLabel: getSwitchableLabel(data, "hospitalise", showPercentageValues),
			arrest: getSwitchableSortValue(data, "arrest", showPercentageValues),
			arrestLabel: getSwitchableLabel(data, "arrest", showPercentageValues),
			special: getSwitchableSortValue(data, "special", showPercentageValues),
			specialLabel: getSwitchableLabel(data, "special", showPercentageValues),
			stealth: getSwitchableSortValue(data, "stealth", showPercentageValues),
			stealthLabel: getSwitchableLabel(data, "stealth", showPercentageValues),
			assist: data.assist,
			defend: data.defend,
			lose: data.lose,
			stalemate: data.stalemate,
			escapes: data.escapes,
			defend_lost: data.defend_lost,
			respect,
			respectLabel: getRespectLabel(data),
			fair_fight: data.latestFairFightModifier ?? -1,
			fairFightLabel: data.latestFairFightModifier?.toString() ?? "-",
		};
	}

	function getAverage(values: number[]) {
		return Number((values.reduce((total, value) => total + value, 0) / values.length || 0).toFixed(2));
	}

	function getLastAttackLabel(timestamp: number) {
		return `${formatDate({ milliseconds: timestamp }, { showYear: true })}, ${formatTime({ milliseconds: timestamp })}`;
	}

	function getRespectValue(data: AttackHistory) {
		if (data.respect_base.length) return getAverage(data.respect_base);
		if (data.respect.length) return getAverage(data.respect);
		return -1;
	}

	function getRespectLabel(data: AttackHistory) {
		if (data.respect_base.length) return getAverage(data.respect_base).toString();
		if (data.respect.length) return `${getAverage(data.respect)}*`;
		return "-";
	}

	function getSwitchableSortValue(data: AttackHistory, key: SwitchableKey, showPercentageValues: boolean) {
		if (!showPercentageValues) return data[key];

		return Math.round((data[key] / data.win) * 100) || 0;
	}

	function getSwitchableLabel(data: AttackHistory, key: SwitchableKey, showPercentageValues: boolean) {
		const value = getSwitchableSortValue(data, key, showPercentageValues);

		return showPercentageValues ? `${value}%` : value.toString();
	}
</script>

<DataTable data={data} {columns} />
