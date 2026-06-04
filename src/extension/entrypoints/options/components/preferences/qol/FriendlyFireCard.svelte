<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	type PendingAlly = { rowId: number; value: string };

	let pendingAllies = $state<PendingAlly[]>([]);
	let nextPendingAllyId = 0;

	function parseAllyFaction(value: string) {
		const trimmedValue = value.trim();
		if (!trimmedValue) return null;

		const numericValue = Number(trimmedValue);
		return Number.isNaN(numericValue) ? trimmedValue : numericValue;
	}

	async function updateAlliedFactions(nextAllies: (string | number)[]) {
		await ttStorage.change({ settings: { alliedFactions: nextAllies } });
	}

	function addAlliedFaction() {
		pendingAllies = [...pendingAllies, { rowId: nextPendingAllyId++, value: "" }];
	}

	function updateAlliedFaction(index: number, value: string) {
		const ally = parseAllyFaction(value);
		if (ally === null) return;

		const nextAllies = [...$settingsStore.alliedFactions];
		nextAllies[index] = ally;
		void updateAlliedFactions(nextAllies);
	}

	function removeAlliedFaction(index: number) {
		void updateAlliedFactions($settingsStore.alliedFactions.filter((_, allyIndex) => allyIndex !== index));
	}

	function savePendingAlly(pendingAlly: PendingAlly) {
		const ally = parseAllyFaction(pendingAlly.value);
		if (ally === null) return;

		void updateAlliedFactions([...$settingsStore.alliedFactions, ally]);
		pendingAllies = pendingAllies.filter(({ rowId }) => rowId !== pendingAlly.rowId);
	}

	function savePendingAllyOnFocusOut(event: FocusEvent, pendingAlly: PendingAlly) {
		if (event.currentTarget instanceof HTMLElement && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			return;
		}

		savePendingAlly(pendingAlly);
	}

	function removePendingAlly(rowId: number) {
		pendingAllies = pendingAllies.filter((pendingAlly) => pendingAlly.rowId !== rowId);
	}

	function updatePendingAlly(rowId: number, value: string) {
		pendingAllies = pendingAllies.map((pendingAlly) =>
			pendingAlly.rowId === rowId ? { ...pendingAlly, value } : pendingAlly,
		);
	}
</script>

<PreferenceSectionCard title="Friendly Fire">
	{#snippet action()}
		<Button type="button" size="icon-xs" variant="outline" onclick={addAlliedFaction}>
			<PlusIcon />
		</Button>
	{/snippet}

	<div class="space-y-1">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.profile.showAllyWarning" label="Show ally warning on profiles" />
			<StorageSwitch path="settings.pages.profile.disableAllyAttacks" label="Disable attack button on ally profile pages" />
		</PreferenceSettingGroup>

		{#if $settingsStore.alliedFactions.length || pendingAllies.length}
			{#each $settingsStore.alliedFactions as ally, index (index)}
				<div class="grid gap-2 rounded-md border border-border bg-background/60 p-2 md:grid-cols-[1fr_28px]">
					<Input value={String(ally)} placeholder="Ally faction name or ID" oninput={(event) => updateAlliedFaction(index, event.currentTarget.value)} />
					<Button type="button" size="icon" variant="destructive" onclick={() => removeAlliedFaction(index)}>
						<TrashIcon />
					</Button>
				</div>
			{/each}
			{#each pendingAllies as pendingAlly (pendingAlly.rowId)}
				<div
					class="grid gap-2 rounded-md border border-border bg-background/60 p-2 md:grid-cols-[1fr_28px]"
					onfocusout={(event) => savePendingAllyOnFocusOut(event, pendingAlly)}
				>
					<Input
						value={pendingAlly.value}
						class={parseAllyFaction(pendingAlly.value) === null ? "border-destructive focus-visible:ring-destructive/50" : ""}
						placeholder="Ally faction name or ID"
						oninput={(event) => updatePendingAlly(pendingAlly.rowId, event.currentTarget.value)}
						onkeydown={(event) => {
							if (event.key === "Enter") savePendingAlly(pendingAlly);
						}}
					/>
					<Button type="button" size="icon" variant="destructive" onclick={() => removePendingAlly(pendingAlly.rowId)}>
						<TrashIcon />
					</Button>
				</div>
			{/each}
		{:else}
			<div class="rounded-md border border-dashed border-border p-2 text-center text-muted-foreground">
				No allied factions configured.
			</div>
		{/if}
	</div>
</PreferenceSectionCard>
