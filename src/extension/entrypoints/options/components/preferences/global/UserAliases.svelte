<script lang="ts">
	import type { UserAlias } from "@features/user-alias/alias";
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import { ttStorage } from "@utils/context";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";

	type PendingAlias = { rowId: number; userId: string; userName: string; alias: string };

	let pendingAliases = $state<PendingAlias[]>([]);
	let aliasIdDrafts = $state<Record<number, string>>({});
	let nextPendingAliasId = 0;

	function parseUserId(value: string) {
		const trimmedValue = value.trim();
		if (!trimmedValue) return null;

		const userId = Number(trimmedValue);
		return Number.isInteger(userId) && userId > 0 ? userId : null;
	}

	function getAliasIdValue(index: number, userId: number) {
		return aliasIdDrafts[index] ?? String(userId);
	}

	function hasInvalidAliasId(index: number) {
		return aliasIdDrafts[index] !== undefined && parseUserId(aliasIdDrafts[index]) === null;
	}

	async function updateAliases(nextAliases: UserAlias[]) {
		await ttStorage.change({ settings: { userAlias: nextAliases } });
	}

	function addAlias() {
		pendingAliases = [...pendingAliases, { rowId: nextPendingAliasId++, userId: "", userName: "", alias: "" }];
	}

	function updateAlias(index: number, nextAlias: UserAlias) {
		const nextAliases = [...$settingsStore.userAlias];
		nextAliases[index] = nextAlias;
		void updateAliases(nextAliases);
	}

	function updateAliasField<K extends keyof UserAlias>(index: number, key: K, value: UserAlias[K]) {
		const alias = $settingsStore.userAlias[index];
		if (!alias) return;

		updateAlias(index, { ...alias, [key]: value });
	}

	function updateAliasUserId(index: number, value: string) {
		const alias = $settingsStore.userAlias[index];
		if (!alias) return;

		aliasIdDrafts = { ...aliasIdDrafts, [index]: value };
		const userId = parseUserId(value);
		if (userId === null) return;

		const { [index]: _savedDraft, ...nextDrafts } = aliasIdDrafts;
		aliasIdDrafts = nextDrafts;
		updateAlias(index, { ...alias, userId });
	}

	function savePendingAlias(pendingAlias: PendingAlias) {
		const userId = parseUserId(pendingAlias.userId);
		if (userId === null) return;

		void updateAliases([
			...$settingsStore.userAlias,
			{ userId, userName: pendingAlias.userName.trim() || null, alias: pendingAlias.alias },
		]);
		pendingAliases = pendingAliases.filter(({ rowId }) => rowId !== pendingAlias.rowId);
	}

	function savePendingAliasOnFocusOut(event: FocusEvent, pendingAlias: PendingAlias) {
		if (event.currentTarget instanceof HTMLElement && event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
			return;
		}

		savePendingAlias(pendingAlias);
	}

	function removeAlias(index: number) {
		const { [index]: _removedDraft, ...nextDrafts } = aliasIdDrafts;
		aliasIdDrafts = nextDrafts;
		void updateAliases($settingsStore.userAlias.filter((_, aliasIndex) => aliasIndex !== index));
	}

	function removePendingAlias(rowId: number) {
		pendingAliases = pendingAliases.filter((pendingAlias) => pendingAlias.rowId !== rowId);
	}

	function updatePendingAlias<K extends keyof Omit<PendingAlias, "rowId">>(
		rowId: number,
		key: K,
		value: PendingAlias[K],
	) {
		pendingAliases = pendingAliases.map((pendingAlias) =>
			pendingAlias.rowId === rowId ? { ...pendingAlias, [key]: value } : pendingAlias,
		);
	}
</script>

<PreferenceSectionCard title="User Aliases">
	{#snippet action()}
		<Button type="button" size="icon-xs" variant="outline" onclick={addAlias}>
			<PlusIcon />
		</Button>
	{/snippet}

	<div class="space-y-1">
		{#if $settingsStore.userAlias.length || pendingAliases.length}
			{#each $settingsStore.userAlias as alias, index (index)}
				<div class="rounded-md border border-border bg-background/60 p-2">
					<div class="grid gap-2 md:grid-cols-[8rem_1fr_1fr_28px]">
						<Input
							value={getAliasIdValue(index, alias.userId)}
							class={`h-7 ${hasInvalidAliasId(index) ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
							placeholder="User ID"
							inputmode="numeric"
							oninput={(event) => updateAliasUserId(index, event.currentTarget.value)}
						/>
						<Input
							value={alias.userName ?? ""}
							class="h-7"
							placeholder="Name"
							oninput={(event) => updateAliasField(index, "userName", event.currentTarget.value.trim() || null)}
						/>
						<Input
							value={alias.alias}
							class="h-7"
							placeholder="Alias"
							oninput={(event) => updateAliasField(index, "alias", event.currentTarget.value)}
						/>
						<Button type="button" size="icon-sm" variant="destructive" onclick={() => removeAlias(index)}>
							<TrashIcon />
						</Button>
					</div>
				</div>
			{/each}
			{#each pendingAliases as pendingAlias (pendingAlias.rowId)}
				<div
					class="rounded-md border border-border bg-background/60 p-2"
					onfocusout={(event) => savePendingAliasOnFocusOut(event, pendingAlias)}
				>
					<div class="grid gap-2 md:grid-cols-[8rem_1fr_1fr_28px]">
						<Input
							bind:value={pendingAlias.userId}
							class={`h-7 ${parseUserId(pendingAlias.userId) === null ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
							placeholder="User ID"
							inputmode="numeric"
							onkeydown={(event) => {
								if (event.key === "Enter") savePendingAlias(pendingAlias);
							}}
						/>
						<Input
							value={pendingAlias.userName}
							class="h-7"
							placeholder="Name"
							oninput={(event) => updatePendingAlias(pendingAlias.rowId, "userName", event.currentTarget.value)}
						/>
						<Input
							value={pendingAlias.alias}
							class="h-7"
							placeholder="Alias"
							oninput={(event) => updatePendingAlias(pendingAlias.rowId, "alias", event.currentTarget.value)}
						/>
						<Button type="button" size="icon-sm" variant="destructive" onclick={() => removePendingAlias(pendingAlias.rowId)}>
							<TrashIcon />
						</Button>
					</div>
				</div>
			{/each}
		{:else}
			<p class="rounded-md border border-dashed border-border p-2 text-center text-muted-foreground">
				No aliases configured.
			</p>
		{/if}
	</div>
</PreferenceSectionCard>
