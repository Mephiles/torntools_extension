<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import type { DatabaseFactionStakeouts, DatabaseSettings } from "@common/utils/data/database";
	import type {StoredFactionStakeouts} from "@common/utils/data/default-database";
	import { factionStakeoutsStore, settingsStore } from "@extension/entrypoints/popup/stores/database-store.svelte";
	import { Badge } from "@svelte/components/ui/badge";
	import { Button } from "@svelte/components/ui/button";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
	import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";

	type FactionStakeoutRow = {
		id: number;
		name: string;
		chain: number | string;
		respect: number;
		members: number | string;
		maxMembers: number | string;
	};

	let factionStakeoutsOpen = $state(true);
	const factionStakeoutRows = $derived(getFactionStakeoutRows($factionStakeoutsStore, $settingsStore));

	async function removeFactionStakeout(id: number) {
		if (!$factionStakeoutsStore) return;

		const nextStakeouts: StoredFactionStakeouts = {
			...$factionStakeoutsStore,
			list: ($factionStakeoutsStore?.list ?? []).filter((e) => e.id !== id),
		};

		await ttStorage.set({ factionStakeouts: nextStakeouts });
	}

	function getFactionStakeoutRows(source: DatabaseFactionStakeouts, settings: DatabaseSettings): FactionStakeoutRow[] {
		if (!settings?.pages?.popup?.showStakeouts || !source?.list?.length) return [];

		return source.list
				.toSorted((a, b) => a.order - b.order)
				.map((stakeout) => ({
					id: stakeout.id,
					name: stakeout.info?.name ?? String(stakeout.id),
					respect: stakeout.info?.respect ?? 1, // A default of 0 would result in it being detected as 'destroyed'
					chain: stakeout.info?.chain ?? "N/A",
					members: stakeout.info?.members?.current ?? "N/A",
					maxMembers: stakeout.info?.members?.maximum ?? "N/A",
				}))
	}

	function getMembersLabel(row: FactionStakeoutRow) {
		return row.members !== "N/A" ? `${row.members}/${row.maxMembers}` : "N/A";
	}

	function getChainLabel(chain: number | string) {
		const chainValue = Number(chain);
		return Number.isFinite(chainValue) && chainValue > 0 ? `${chainValue} chain` : "No chain";
	}
</script>

{#if factionStakeoutRows.length}
	<section class="space-y-1">
		<div class="flex items-center justify-between">
			<div class="text-xs font-medium">Faction Stakeouts</div>
			<Button variant="ghost" size="icon-xs" onclick={() => (factionStakeoutsOpen = !factionStakeoutsOpen)} aria-label="Toggle faction stakeouts">
				{#if factionStakeoutsOpen}<CaretDownIcon />{:else}<CaretRightIcon />{/if}
			</Button>
		</div>

		{#if factionStakeoutsOpen}
			<div class="space-y-1">
				{#each factionStakeoutRows as row (row.id)}
					<div class="rounded-lg border bg-card p-2 text-xs">
						<div class="flex items-center gap-2">
							<a
									class="-m-1 grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 rounded-md p-1 hover:bg-muted/60"
									href={`https://www.torn.com/factions.php?step=profile&ID=${row.id}#/`}
									target="_blank"
									rel="noreferrer"
							>
								<span class="truncate font-medium">{row.name}</span>

								{#if row.respect > 0}
									<Badge variant="outline" class="shrink-0 whitespace-nowrap">{getMembersLabel(row)}</Badge>
									<Badge variant="secondary" class="shrink-0 whitespace-nowrap">{getChainLabel(row.chain)}</Badge>
								{:else}
									<Badge variant="destructive" class="uppercase">destroyed</Badge>
								{/if}
							</a>
							<Button variant="ghost" size="icon-xs" class="text-destructive" onclick={() => removeFactionStakeout(row.id)} aria-label="Remove faction stakeout">
								<TrashIcon />
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</section>
{/if}
