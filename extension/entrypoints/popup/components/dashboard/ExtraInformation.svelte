<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Card, CardContent } from "@svelte/components/ui/card";
	import { Separator } from "@svelte/components/ui/separator";
	import BellIcon from "phosphor-svelte/lib/BellIcon";
	import BellSlashIcon from "phosphor-svelte/lib/BellSlashIcon";
	import { settingsStore, userdataStore } from "@/entrypoints/popup/stores/database-store.svelte.js";
	import { ttStorage } from "@/utils/common/data/storage";
	import { formatNumber, formatTime } from "@/utils/common/functions/formatting";
	import { TO_MILLIS } from "@/utils/common/functions/utilities";

	const { now } : { now: number } = $props();

	const extraInformation = $derived(getExtraInformation($userdataStore, $settingsStore));
	const lastUpdated = $derived(getLastUpdated($userdataStore, now));
	const notificationsEnabled = $derived(!!$settingsStore?.notifications?.types?.global);

	async function toggleNotifications() {
		await ttStorage.change({ settings: { notifications: { types: { global: !notificationsEnabled } } } });
	}

	function getExtraInformation(userdata: any, settings: any) {
		return [
			{
				label: "Events",
				value: settings?.apiUsage?.user?.newevents ? (userdata?.notifications?.events ?? 0).toString() : "N/A",
				href: "https://www.torn.com/events.php",
			},
			{
				label: "Messages",
				value: settings?.apiUsage?.user?.newmessages ? (userdata?.messages ?? []).filter((message: any) => !message.seen).length.toString() : "N/A",
				href: "https://www.torn.com/messages.php",
			},
			{
				label: "Wallet",
				value: settings?.apiUsage?.user?.money ? `$${formatNumber(userdata?.money?.wallet ?? 0)}` : "N/A",
				href: "https://www.torn.com/properties.php#/p=options&tab=vault",
			},
		];
	}

	function getLastUpdated(userdata: any, currentTime: number) {
		void currentTime;

		return userdata?.date ? formatTime({ milliseconds: userdata.date }, { type: "ago", agoFilter: TO_MILLIS.SECONDS }) : "Never";
	}
</script>

<Card size="sm" class="rounded-lg">
	<CardContent class="space-y-2">
		<div class="grid grid-cols-3 gap-2">
			{#each extraInformation as item (item.label)}
				<a class="rounded-md bg-muted px-2 py-1 text-center hover:bg-muted/80" href={item.href} target="_blank" rel="noreferrer">
					<div class="text-[10px] text-muted-foreground">{item.label}</div>
					<div class="truncate text-xs font-medium">{item.value}</div>
				</a>
			{/each}
		</div>
		<Separator />
		<div class="flex items-center justify-between text-xs text-muted-foreground">
			<div class="flex items-center gap-1">
				<span>Updated</span>
				<span class="font-medium text-foreground">{lastUpdated}</span>
			</div>
			<Button
					variant={notificationsEnabled ? "secondary" : "outline"}
					size="icon-sm"
					class={notificationsEnabled ? "text-primary" : "text-destructive"}
					onclick={toggleNotifications}
					aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
					title={notificationsEnabled ? "Notifications enabled" : "Notifications disabled"}
			>
				{#if notificationsEnabled}
					<BellIcon />
				{:else}
					<BellSlashIcon />
				{/if}
			</Button>
		</div>
	</CardContent>
</Card>
