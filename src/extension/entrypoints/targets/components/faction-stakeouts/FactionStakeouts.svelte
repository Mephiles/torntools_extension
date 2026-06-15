<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import { toast } from "svelte-sonner";
	import { factionStakeoutsStore } from "../../stores/database-store.svelte";
	import ResetAction from "../ResetAction.svelte";
	import FactionStakeoutsTable from "./FactionStakeoutsTable.svelte";
	import { getFactionStakeoutRow, getFactionStakeoutRows, getStoredFactionStakeouts } from "./helpers";

	const amountOfRows = $derived($factionStakeoutsStore?.list?.length ?? 0);
	let factionId = $state<number>(null);

	async function resetFactionStakeouts() {
		await ttStorage.reset("factionStakeouts");
		toast.success("Faction stakeouts reset.");
	}

	function addFactionStakeout() {
		if (!factionId || Number.isNaN(factionId)) {
			toast.error("Enter a valid faction ID.");
			return;
		}

		const rows = getFactionStakeoutRows($factionStakeoutsStore);
		if (rows.some((row) => row.id === factionId)) {
			toast.error("This faction already has a stakeout.");
			return;
		}

		const nextStakeouts = getStoredFactionStakeouts(
			[...rows, getFactionStakeoutRow(factionId, null, true)],
			$factionStakeoutsStore?.date ?? 0
		);
		ttStorage.set({ factionStakeouts: nextStakeouts }).catch(console.error);
		factionId = null;
	}
</script>

<div class="space-y-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-bold">Faction Stakeouts</h1>
			<p class="text-sm text-muted-foreground">{amountOfRows} tracked {amountOfRows === 1 ? "faction" : "factions"}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Input class="w-36" type="number" pattern="\d*" inputmode="numeric" min="1" placeholder="Faction ID" bind:value={factionId} onkeydown={(event) => event.key === "Enter" && addFactionStakeout()} />
			<Button onclick={addFactionStakeout}>
				<PlusIcon class="size-4" />
				Add
			</Button>
			<ResetAction title="Reset faction stakeouts" description="Are you sure you want to delete all faction stakeouts?" onConfirm={resetFactionStakeouts} />
		</div>
	</div>

	<FactionStakeoutsTable />
</div>
