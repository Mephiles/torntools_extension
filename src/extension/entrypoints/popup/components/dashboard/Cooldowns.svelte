<script lang="ts">
	import type {DatabaseSettings, DatabaseUserdata} from "@common/utils/data/database";
	import { formatTime } from "@common/utils/functions/formatting";
	import { settingsStore, userdataStore } from "@extension/entrypoints/popup/stores/database-store.svelte";
	import { cn } from "@svelte/utils";

	type Cooldown = {
		id: string;
		label: string;
		value: string;
		href: string;
		color: string;
	};

	const { now } : { now: number } = $props();

	const cooldowns = $derived(getCooldowns($userdataStore, $settingsStore, now));

	function getCooldowns(userdata: DatabaseUserdata, settings: DatabaseSettings, currentTime: number): Cooldown[] {
		if (!settings?.apiUsage?.user?.cooldowns || !userdata?.cooldowns) return [];

		return [
			getCooldown("drug", "Drugs", userdata.cooldowns.drug, "https://www.torn.com/item.php#drugs-items", "text-primary", userdata, currentTime),
			getCooldown("booster", "Boosters", userdata.cooldowns.booster, "https://www.torn.com/item.php#boosters-items", "text-orange-500", userdata, currentTime),
			getCooldown("medical", "Medical", userdata.cooldowns.medical, "https://www.torn.com/item.php#medical-items", "text-blue-500", userdata, currentTime),
		];
	}

	function getCooldown(id: string, label: string, cooldown: number, href: string, color: string, userdata: DatabaseUserdata, currentTime: number): Cooldown {
		const completedAt = userdata.timestamp && cooldown ? (userdata.timestamp + cooldown) * 1000 : 0;

		return {
			id,
			label,
			value: formatTime({ milliseconds: completedAt ? Math.max(completedAt - currentTime, 0) : 0 }, { type: "timer", daysToHours: true }),
			href,
			color,
		};
	}
</script>

{#if cooldowns.length}
	<div class="grid grid-cols-3 gap-1">
		{#each cooldowns as cooldown (cooldown.id)}
			<a class="rounded-lg bg-card border border-border/70 p-1 text-center text-xs hover:bg-muted" href={cooldown.href} target="_blank" rel="noreferrer">
				<div class={cn("font-medium", cooldown.color)}>{cooldown.label}</div>
				<div class="text-muted-foreground">{cooldown.value}</div>
			</a>
		{/each}
	</div>
{/if}
