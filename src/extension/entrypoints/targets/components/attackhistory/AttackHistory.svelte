<script lang="ts">
	import { ttStorage } from "@common/utils/data/storage";
	import { Switch } from "@svelte/components/ui/switch";
	import { toast } from "svelte-sonner";
	import { attackHistoryStore } from "../../stores/database-store.svelte";
	import ResetAction from "../ResetAction.svelte";
    import HistoryTable from "./HistoryTable.svelte";

	let showPercentages = $state(false);
	const amountOfRows = $derived(Object.keys($attackHistoryStore?.history ?? {}).length);

	async function resetHistory() {
		const lastAttack = $attackHistoryStore.lastAttack;
		await ttStorage.set({ attackHistory: { fetchData: true, lastAttack, history: {} } });

		toast.success("Attack history reset.");
	}
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-bold">Attack History</h1>
			<p class="text-sm text-muted-foreground">{amountOfRows} stored {amountOfRows === 1 ? "target" : "targets"}</p>
		</div>
		<div class="flex items-center gap-2">
			<label class="flex items-center gap-2 text-sm">
				<Switch size="sm" bind:checked={showPercentages} />
				<span>Show percentages</span>
			</label>
			<ResetAction title="Reset attack history" description="Are you sure you want to delete the attack history?" onConfirm={resetHistory} />
		</div>
	</div>

	<HistoryTable {showPercentages} />
</div>
