<script lang="ts">
	import type { TTNotification } from "@common/utils/data/default-database";
	import Notification from "@extension/entrypoints/popup/components/notifications/Notification.svelte";
	import { notificationHistoryStore } from "../../stores/database-store.svelte";

	type StoredNotification = Exclude<TTNotification, { combined: true }>;

	const notifications = $derived(($notificationHistoryStore ?? []).filter(isStoredNotification));

	function isStoredNotification(notification: TTNotification): notification is StoredNotification {
		return !("combined" in notification);
	}
</script>

<div class="space-y-2">
	{#each notifications as notification, index (index)}
		<Notification {notification} />
	{:else}
		<div class="text-sm text-muted-foreground">No notification history.</div>
	{/each}
</div>
