<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import {
		formatNotificationList,
		type NotificationListValue,
		type NotificationTypes,
		parseNotificationList,
		updateNotificationType,
	} from "./notification-storage";

	interface NotificationListInputProps {
		typeKey: {
			[K in keyof NotificationTypes]: NotificationTypes[K] extends NotificationListValue ? K : never;
		}[keyof NotificationTypes];
		label: string;
		description?: string;
		disabled?: boolean;
		type?: "text" | "time";
	}

	let {
		typeKey,
		label,
		description,
		disabled = false,
		type = "text",
	}: NotificationListInputProps = $props();

	const id = $derived(`notification-${typeKey}`);
	const value = $derived(formatNotificationList($settingsStore.notifications.types[typeKey] as NotificationListValue));

	function updateValue(input: string) {
		void updateNotificationType(typeKey, parseNotificationList(input) as NotificationTypes[typeof typeKey]);
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
		{type}
		{disabled}
		value={value}
		oninput={(event) => updateValue(event.currentTarget.value)}
	/>
</Field.Field>
