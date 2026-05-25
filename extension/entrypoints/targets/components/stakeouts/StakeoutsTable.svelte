<script lang="ts">
	import { stakeoutsStore } from "@/entrypoints/targets/stores/database-store.svelte";
	import { ttStorage } from "@/utils/common/data/storage";
	import { type BooleanAlertKey, columns, type NumberAlertKey, type StakeoutRow } from "./columns";
	import DataTable from "./data-table.svelte";
	import { getStakeoutRows, getStoredStakeouts } from "./helpers";

	const rows = $derived(getStakeoutRows($stakeoutsStore));

	function updateRows(nextRows: StakeoutRow[]) {
		const nextStakeouts = getStoredStakeouts(nextRows);

		ttStorage.set({ stakeouts: nextStakeouts });
	}

	function removeStakeout(id: string) {
		updateRows(rows.filter((row) => row.id !== id));
	}

	function updateLabel(id: string, label: string) {
		updateRows(rows.map((row) => (row.id === id ? { ...row, label } : row)));
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
	onRemove={removeStakeout}
	onLabelChange={updateLabel}
	onBooleanAlertChange={updateBooleanAlert}
	onNumberAlertChange={updateNumberAlert}
/>
