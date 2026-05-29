<script lang="ts">
	import Notification from "@/entrypoints/popup/components/notifications/Notification.svelte";
	import type { TTNotification } from "@/utils/common/data/default-database";
	import { notificationHistoryStore } from "../../stores/database-store.svelte.js";

	type StoredNotification = Exclude<TTNotification, { combined: true }>;

	const notifications = $derived(($notificationHistoryStore ?? []).filter(isStoredNotification));

	function isStoredNotification(notification: TTNotification): notification is StoredNotification {
		return !("combined" in notification);
	}
</script>

<div class="space-y-2">
	{#each notifications as notification (notification.date + notification.title)}
		<Notification {notification} />
	{:else}
		<div class="text-sm text-muted-foreground">No notification history.</div>
	{/each}
</div>
