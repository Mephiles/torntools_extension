<script lang="ts">
	import type { DatabaseSettings, DatabaseUserdata } from "@common/utils/data/database";
	import { ttStorage } from "@common/utils/data/storage";
	import { formatNumber, formatTime } from "@common/utils/functions/formatting";
	import { TO_MILLIS } from "@common/utils/functions/utilities";
	import { settingsStore, userdataStore } from "@extension/entrypoints/popup/stores/database-store.svelte";
	import { Button } from "@svelte/components/ui/button";
	import BellIcon from "phosphor-svelte/lib/BellIcon";
	import BellSlashIcon from "phosphor-svelte/lib/BellSlashIcon";

	const { now } : { now: number } = $props();

	const extraInformation = $derived(getExtraInformation($userdataStore, $settingsStore));
	const lastUpdated = $derived(getLastUpdated($userdataStore, now));
	const notificationsEnabled = $derived(!!$settingsStore?.notifications?.types?.global);

	async function toggleNotifications() {
		await ttStorage.change({ settings: { notifications: { types: { global: !notificationsEnabled } } } });
	}

	function getExtraInformation(userdata: DatabaseUserdata, settings: DatabaseSettings) {
		return [
			{
				label: "Events",
				value: settings?.apiUsage.user.newevents ? (userdata?.notifications.events ?? 0).toString() : "N/A",
				href: "https://www.torn.com/events.php",
			},
			{
				label: "Messages",
				value: settings?.apiUsage.user.newmessages ? (userdata?.messages ?? []).filter((message) => !message.seen).length.toString() : "N/A",
				href: "https://www.torn.com/messages.php",
			},
			{
				label: "Wallet",
				value: settings?.apiUsage.user.money ? formatNumber(userdata?.money.wallet ?? 0, {currency: true}) : "N/A",
				href: "https://www.torn.com/properties.php#/p=options&tab=vault",
			},
		];
	}

	function getLastUpdated(userdata: DatabaseUserdata, currentTime: number) {
		void currentTime;

		return userdata?.date ? formatTime({ milliseconds: userdata.date }, { type: "ago", agoFilter: TO_MILLIS.SECONDS }) : "Never";
	}
</script>

<div class="grid grid-cols-3 gap-1">
	{#each extraInformation as item (item.label)}
		<a class="rounded-lg bg-card border border-border/70 p-1 text-center text-xs hover:bg-muted" href={item.href} target="_blank" rel="noreferrer">
			<div class="font-medium">{item.label}</div>
			<div class="text-foreground/80">{item.value}</div>
		</a>
	{/each}
</div>

<div class="flex items-center justify-between text-xs text-foreground/80">
	<div class="flex items-center gap-1">
		<span>Updated</span>
		<span class="font-medium text-foreground">{lastUpdated}</span>
	</div>
	<Button
			variant={notificationsEnabled ? "secondary" : "outline"}
			size="icon-sm"
			class={notificationsEnabled ? "text-sidebar-primary" : "text-destructive"}
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
