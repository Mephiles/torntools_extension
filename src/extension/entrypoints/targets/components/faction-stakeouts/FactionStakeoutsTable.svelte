<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import { factionStakeoutsStore } from "@extension/entrypoints/targets/stores/database-store.svelte";
	import { type BooleanAlertKey, columns, type FactionStakeoutRow, type NumberAlertKey } from "./columns";
	import DataTable from "./data-table.svelte";
	import { getFactionStakeoutRows, getStoredFactionStakeouts } from "./helpers";

	const rows = $derived(getFactionStakeoutRows($factionStakeoutsStore));

	function updateRows(nextRows: FactionStakeoutRow[]) {
		const nextStakeouts = getStoredFactionStakeouts(nextRows, $factionStakeoutsStore?.date ?? 0);

		ttStorage.set({ factionStakeouts: nextStakeouts });
	}

	function removeFactionStakeout(id: string) {
		updateRows(rows.filter((row) => row.id !== id));
	}

	function updateBooleanAlert(id: string, key: BooleanAlertKey, value: boolean) {
		updateRows(rows.map((row) => (row.id === id ? { ...row, alerts: { ...row.alerts, [key]: value } } : row)));
	}

	function updateNumberAlert(id: string, key: NumberAlertKey, value: string) {
		const nextValue = Number.parseInt(value, 10);
		updateRows(rows.map((row) => (row.id === id ? { ...row, alerts: { ...row.alerts, [key]: Number.isNaN(nextValue) ? false : nextValue } } : row)));
	}
</script>

<DataTable
	data={rows}
	{columns}
	onRemove={removeFactionStakeout}
	onBooleanAlertChange={updateBooleanAlert}
	onNumberAlertChange={updateNumberAlert}
/>
