<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import type { StakeoutRow } from "@/entrypoints/popup/components/dashboard/dashboard.svelte";
	import { stakeoutsStore } from "@/entrypoints/popup/stores/database-store.svelte.js";
	import type { StoredStakeouts } from "@/utils/common/data/default-database";
	import { ttStorage } from "@/utils/common/data/storage";

	const { row }: { row: StakeoutRow } = $props();

	async function removeStakeout(id: string) {
		if (!$stakeoutsStore) return;

		const nextStakeouts: StoredStakeouts = {
			...$stakeoutsStore,
			order: ($stakeoutsStore.order ?? []).filter((stakeoutId) => stakeoutId !== id),
		};
		delete nextStakeouts[id];

		await ttStorage.set({ stakeouts: nextStakeouts });
	}

	function clampPercent(value: number) {
		if (!Number.isFinite(value)) return 0;
		return Math.max(0, Math.min(100, value));
	}

	function getStateClass(color: string) {
		if (color === "green") return "text-primary";
		if (color === "red") return "text-destructive";
		if (color === "blue") return "text-blue-500";
		return "text-muted-foreground";
	}

	function getActivityClass(activity: string) {
		const normalized = activity.toLowerCase();
		if (normalized === "online") return "bg-primary";
		if (normalized === "idle") return "bg-amber-500";
		return "bg-muted-foreground";
	}
</script>

<div class="rounded-lg border bg-card p-2 text-xs">
	<div class="flex items-start gap-2">
		<a
				class="-m-1 block min-w-0 flex-1 rounded-md p-1 hover:bg-muted/60"
				href={`https://www.torn.com/profiles.php?XID=${row.id}`}
				target="_blank"
				rel="noreferrer"
		>
			<div class="flex items-center gap-1.5">
				<span class={`size-2 shrink-0 rounded-full ${getActivityClass(row.activity)}`}></span>
				<span class="truncate font-medium">{row.name}</span>
				{#if row.label}<span class="truncate text-muted-foreground">({row.label})</span>{/if}
			</div>
			<div class="mt-1 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-[10px] text-muted-foreground">
				<span>Life</span>
				<div class="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted">
					<div class="h-full bg-blue-500" style:width={`${clampPercent((row.lifeCurrent / row.lifeMaximum) * 100)}%`}></div>
				</div>
				<span>{row.lifeCurrent}/{row.lifeMaximum}</span>
			</div>
			<div class="mt-1 flex items-center justify-between gap-2">
				<span class={`truncate ${getStateClass(row.stateColor)}`}>{row.state}</span>
				<span class="shrink-0 text-muted-foreground">Last action: {row.lastAction}</span>
			</div>
		</a>
		<Button variant="ghost" size="icon-xs" class="text-destructive" onclick={() => removeStakeout(row.id)} aria-label="Remove stakeout">
			<TrashIcon />
		</Button>
	</div>
</div>