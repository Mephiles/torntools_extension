<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import type { NotificationTypes } from "./notification-storage";
	import { updateNotificationType } from "./notification-storage";

	type TimeNotificationKey = "missionsLimit" | "refillEnergy" | "refillNerve";

	interface NotificationTimeInputProps {
		typeKey: TimeNotificationKey;
		label: string;
		description?: string;
		disabled?: boolean;
	}

	let { typeKey, label, description, disabled = false }: NotificationTimeInputProps = $props();

	const id = $derived(`notification-${typeKey}`);
	const value = $derived($settingsStore.notifications.types[typeKey]);

	function updateValue(input: string) {
		void updateNotificationType(typeKey, input as NotificationTypes[typeof typeKey]);
	}
</script>

<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
	<Field.Content>
		<Field.Label for={id}>{label}</Field.Label>
		{#if description}
			<Field.Description class="text-xs">{description}</Field.Description>
		{/if}
	</Field.Content>

	<Input
		{id}
		type="time"
		{disabled}
		value={value}
		oninput={(event) => updateValue(event.currentTarget.value)}
	/>
</Field.Field>
