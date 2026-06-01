<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import { ttStorage } from "@utils/context";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import { toast } from "svelte-sonner";
	import { stakeoutsStore } from "../../stores/database-store.svelte";
	import ResetAction from "../ResetAction.svelte";
	import { getStakeoutRow, getStakeoutRows, getStoredStakeouts } from "./helpers";
	import StakeoutsTable from "./StakeoutsTable.svelte";

	const amountOfRows = $derived($stakeoutsStore?.order?.length ?? 0);
	let stakeoutId = $state<number>(null);

	async function resetStakeouts() {
		await ttStorage.reset("stakeouts");
		toast.success("Stakeouts reset.");
	}

	function addStakeout() {
		if (!stakeoutId || Number.isNaN(stakeoutId)) {
			toast.error("Enter a valid user ID.");
			return;
		}

		const rows = getStakeoutRows($stakeoutsStore);
		if (rows.some((row) => row.id === String(stakeoutId))) {
			toast.error("This user already has a stakeout.");
			return;
		}

		const nextStakeouts = getStoredStakeouts([...rows, getStakeoutRow(String(stakeoutId), null, true)], $stakeoutsStore?.date ?? 0);
		ttStorage.set({ stakeouts: nextStakeouts }).catch(console.error);
		stakeoutId = null;
	}
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-bold">Stakeouts</h1>
			<p class="text-sm text-muted-foreground">{amountOfRows} tracked {amountOfRows === 1 ? "player" : "players"}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Input class="w-36" type="number" min="1" placeholder="User ID" bind:value={stakeoutId} onkeydown={(event) => event.key === "Enter" && addStakeout()} />
			<Button onclick={addStakeout}>
				<PlusIcon class="size-4" />
				Add
			</Button>
			<ResetAction title="Reset stakeouts" description="Are you sure you want to delete all stakeouts?" onConfirm={resetStakeouts} />
		</div>
	</div>

	<StakeoutsTable />
</div>
