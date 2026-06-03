<script lang="ts">
	import type { DatabaseSettings } from "@common/utils/data/database";
	import type { StakeoutData, StoredStakeouts } from "@common/utils/data/default-database";
	import { settingsStore, stakeoutsStore } from "@extension/entrypoints/popup/stores/database-store.svelte";
	import { Button } from "@svelte/components/ui/button";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
	import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
	import { browser } from "wxt/browser";
	import type { StakeoutRow as StakeoutRowType } from "./dashboard.svelte.js";
	import StakeoutRow from "./StakeoutRow.svelte";

	let stakeoutsOpen = $state(true);

	const stakeoutRows = $derived(getStakeoutRows($stakeoutsStore, $settingsStore));
	const targetsUrl = $derived(`${browser.runtime.getURL("/targets.html")}#/stakeouts`);

	function getStakeoutRows(source: StoredStakeouts | undefined, settings: DatabaseSettings): StakeoutRowType[] {
		if (!settings?.pages?.popup?.showStakeouts || !source?.order?.length) return [];

		return source.order.flatMap((id) => {
			const stakeout = source[id] as StakeoutData | undefined;
			if (!stakeout || typeof stakeout !== "object" || Array.isArray(stakeout)) return [];

			return [
				{
					id,
					name: stakeout.info?.name ?? id,
					label: stakeout.label ?? "",
					activity: stakeout.info?.last_action?.status ?? "N/A",
					lastAction: stakeout.info?.last_action?.relative ?? "N/A",
					lifeCurrent: stakeout.info?.life?.current ?? 0,
					lifeMaximum: stakeout.info?.life?.maximum ?? 100,
					state: stakeout.info?.status?.description ?? "Unknown",
					stateColor: stakeout.info?.status?.color ?? "gray",
				},
			];
		});
	}
</script>

{#if stakeoutRows.length}
	<section class="space-y-1">
		<div class="flex items-center justify-between">
			<a class="text-xs font-medium hover:underline" href={targetsUrl} target="_blank" rel="noreferrer">Stakeouts</a>
			<Button variant="ghost" size="icon-xs" onclick={() => (stakeoutsOpen = !stakeoutsOpen)} aria-label="Toggle stakeouts">
				{#if stakeoutsOpen}
					<CaretDownIcon />
				{:else}
					<CaretRightIcon />
				{/if}
			</Button>
		</div>

		{#if stakeoutsOpen}
			<div class="space-y-1">
				{#each stakeoutRows as row (row.id)}
					<StakeoutRow {row} />
				{/each}
			</div>
		{/if}
	</section>
{/if}
