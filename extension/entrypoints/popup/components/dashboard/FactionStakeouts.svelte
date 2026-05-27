<script lang="ts">
	import { Badge } from "@svelte/components/ui/badge";
	import { Button } from "@svelte/components/ui/button";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
	import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { factionStakeoutsStore, settingsStore } from "@/entrypoints/popup/stores/database-store.svelte.js";
	import type { StoredFactiondata } from "@/utils/common/data/default-database";
	import { ttStorage } from "@/utils/common/data/storage";

	type FactionStakeoutRow = {
		id: string;
		name: string;
		chain: number | string;
		members: number | string;
		maxMembers: number | string;
	};

	let factionStakeoutsOpen = $state(true);
	const factionStakeoutRows = $derived(getFactionStakeoutRows($factionStakeoutsStore, $settingsStore));

	async function removeFactionStakeout(id: string) {
		if (!$factionStakeoutsStore) return;

		const nextStakeouts = { ...$factionStakeoutsStore };
		delete nextStakeouts[id];

		await ttStorage.set({ factionStakeouts: nextStakeouts });
	}

	function getFactionStakeoutRows(source: any, settings: any): FactionStakeoutRow[] {
		if (!settings?.pages?.popup?.showStakeouts || !source) return [];

		return Object.entries(source).flatMap(([id, stakeout]) => {
			if (Number.isNaN(Number.parseInt(id, 10)) || typeof stakeout !== "object" || stakeout === null) return [];

			const data = stakeout as StoredFactiondata & {
				info?: {
					name?: string;
					chain?: number;
					members?: { current?: number; maximum?: number };
				};
			};

			return [
				{
					id,
					name: data.info?.name ?? id,
					chain: data.info?.chain ?? "N/A",
					members: data.info?.members?.current ?? "N/A",
					maxMembers: data.info?.members?.maximum ?? "N/A",
				},
			];
		});
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
								<Badge variant="outline" class="shrink-0 whitespace-nowrap">{getMembersLabel(row)}</Badge>
								<Badge variant="secondary" class="shrink-0 whitespace-nowrap">{getChainLabel(row.chain)}</Badge>
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
