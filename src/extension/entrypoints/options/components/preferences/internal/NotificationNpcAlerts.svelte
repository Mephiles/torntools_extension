<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Input } from "@svelte/components/ui/input";
	import PlusIcon from "phosphor-svelte/lib/PlusIcon";
	import TrashIcon from "phosphor-svelte/lib/TrashIcon";
	import { npcsStore, settingsStore } from "../../../stores/database-store.svelte";
	import ItemSelect from "../ItemSelect.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import NotificationListInput from "./NotificationListInput.svelte";
	import type { NotificationTypes } from "./notification-storage";
	import { updateNotificationType } from "./notification-storage";

	type NpcAlert = NotificationTypes["npcs"][number];

	interface NotificationNpcAlertsProps {
		disabled?: boolean;
	}

	let { disabled = false }: NotificationNpcAlertsProps = $props();

	const npcChoices = $derived(
		Object.entries(($npcsStore as { targets?: Record<string, { name: string; order?: number }> }).targets ?? {})
			.map(([id, npc]) => ({ id: Number(id), name: npc.name, order: npc.order ?? Number.MAX_SAFE_INTEGER }))
			.sort((first, second) => first.order - second.order || first.name.localeCompare(second.name)),
	);
	const npcOptions = $derived(npcChoices.map((npc) => ({ value: String(npc.id), label: npc.name })));
	const canAddNpc = $derived(
		!disabled && npcChoices.some(({ id }) => !$settingsStore.notifications.types.npcs.some((alert) => alert.id === id)),
	);

	function updateNpcAlerts(nextAlerts: NpcAlert[]) {
		void updateNotificationType("npcs", nextAlerts);
	}

	function addNpcAlert() {
		const unusedNpc = npcChoices.find(({ id }) => !$settingsStore.notifications.types.npcs.some((alert) => alert.id === id));
		if (!unusedNpc) return;

		updateNpcAlerts([...$settingsStore.notifications.types.npcs, { id: unusedNpc.id, level: "", minutes: "" }]);
	}

	function updateNpcAlert(index: number, nextAlert: NpcAlert) {
		const nextAlerts = [...$settingsStore.notifications.types.npcs];
		nextAlerts[index] = nextAlert;
		updateNpcAlerts(nextAlerts);
	}

	function updateNpcAlertField<K extends keyof NpcAlert>(index: number, key: K, value: NpcAlert[K]) {
		const alert = $settingsStore.notifications.types.npcs[index];
		if (!alert) return;

		updateNpcAlert(index, { ...alert, [key]: value });
	}

	function updateNumberField(index: number, key: "level" | "minutes", value: string) {
		const parsedValue = parseInt(value, 10);
		updateNpcAlertField(index, key, value === "" || Number.isNaN(parsedValue) ? "" : parsedValue);
	}

	function removeNpcAlert(index: number) {
		updateNpcAlerts($settingsStore.notifications.types.npcs.filter((_, alertIndex) => alertIndex !== index));
	}
</script>

<PreferenceSectionCard title="NPC Alerts">
	{#snippet action()}
		<Button type="button" size="icon-xs" variant="outline" disabled={!canAddNpc} onclick={addNpcAlert}>
			<PlusIcon />
		</Button>
	{/snippet}

	<div class="grid gap-1">
		<StorageSwitch
			path="settings.notifications.types.npcsGlobal"
			label="NPC alerts"
			{disabled}
			externalServices={["tornstats", "yata", "lzpt"]}
		/>

		<PreferenceSettingGroup title="NPC levels" contentClass="grid gap-1">
			{#if npcOptions.length && $settingsStore.notifications.types.npcs.length}
				<div class="space-y-1">
					{#each $settingsStore.notifications.types.npcs as alert, index (alert.id)}
						<div class="grid gap-2 rounded-md border border-border bg-background/60 p-2 md:grid-cols-[minmax(0,1fr)_5rem_6rem_auto]">
							<ItemSelect
								items={npcOptions}
								placeholder="NPC"
								value={String(alert.id)}
								onValueChange={(value) => updateNpcAlertField(index, "id", Number(value))}
							/>

							<Input
								type="number"
								min={1}
								max={5}
								placeholder="Level"
								disabled={disabled}
								value={String(alert.level)}
								oninput={(event) => updateNumberField(index, "level", event.currentTarget.value)}
							/>

							<Input
								type="number"
								min={0}
								max={450}
								placeholder="Minutes"
								disabled={disabled}
								value={String(alert.minutes)}
								oninput={(event) => updateNumberField(index, "minutes", event.currentTarget.value)}
							/>

							<Button type="button" size="icon" variant="destructive" disabled={disabled} onclick={() => removeNpcAlert(index)}>
								<TrashIcon />
							</Button>
						</div>
					{/each}
				</div>
			{:else if npcOptions.length}
				<p class="rounded-md border border-dashed border-border p-2 text-center text-xs text-muted-foreground">
					No NPC alerts configured.
				</p>
			{:else}
				<p class="rounded-md border border-dashed border-border p-2 text-center text-xs text-muted-foreground">
					NPC data is not available yet.
				</p>
			{/if}
		</PreferenceSettingGroup>

		<StorageSwitch
			path="settings.notifications.types.npcPlannedEnabled"
			label="Planned attack reminder"
			disabled={disabled}
			externalServices={["lzpt"]}
		>
			<NotificationListInput
				typeKey="npcPlanned"
				label="Minutes before planned attack"
				disabled={disabled || !$settingsStore.notifications.types.npcPlannedEnabled}
			/>
		</StorageSwitch>
	</div>
</PreferenceSectionCard>
