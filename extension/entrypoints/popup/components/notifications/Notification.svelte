<script lang="ts">
	import { Card, CardContent } from "@svelte/components/ui/card";
	import type { TTFullNotification } from "@/utils/common/data/default-database";
	import { formatDate, formatTime } from "@/utils/common/functions/formatting";
	import { isToday } from "@/utils/common/functions/utilities";


	const { notification } : { notification: TTFullNotification } = $props();

	const displayTitle = $derived(notification.title.replace("TornTools - ", ""))
</script>

<Card size="sm" class="py-2!">
	<CardContent class="text-xs px-2!">
		<a href={notification.url} target="_blank" rel="noreferrer">
			<div class="flex justify-between">
				<span class="text-foreground font-bold">{displayTitle}</span>
				<span class="text-muted-foreground">
					{#if isToday(notification.date)}
						{formatTime(notification.date)}
					{:else}
						{formatDate(notification.date)} {formatTime(notification.date)}
					{/if}
				</span>
			</div>
			<div class="text-muted-foreground">{notification.message}</div>
		</a>
	</CardContent>
</Card>
