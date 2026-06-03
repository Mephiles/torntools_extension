<script lang="ts">
	import type { DatabaseSettings, DatabaseUserdata } from "@common/utils/data/database";
	import type { UserV1Bar, UserV1ChainBar } from "@common/utils/functions/api-v1.types";
	import { formatTime, toSeconds } from "@common/utils/functions/formatting";
	import {getNextChainBonus, LINKS} from "@common/utils/functions/torn";
	import { settingsStore, userdataStore } from "@extension/entrypoints/popup/stores/database-store.svelte";
	import { Card, CardContent } from "@svelte/components/ui/card";

	type DashboardBar = {
		id: string;
		label: string;
		valueLabel: string;
		tickLabel: string;
		fullLabel: string;
		href: string;
		percent: number;
		color: string;
	};

	const { now } : { now: number } = $props();

	const userSettings = $derived($settingsStore?.apiUsage?.user);
	const bars = $derived(getBars($userdataStore, $settingsStore, now));

	function getBars(userdata: DatabaseUserdata, settings: DatabaseSettings, currentTime: number): DashboardBar[] {
		const result: DashboardBar[] = [];
		if (!userdata) return result;

		if (settings?.apiUsage?.user?.bars) {
			result.push(
				getResourceBar("energy", "Energy", userdata.energy, LINKS.gym, "bg-[#7cc833]", userdata, settings, currentTime),
				getResourceBar("nerve", "Nerve", userdata.nerve, LINKS.crimes, "bg-[#b3382c]", userdata, settings, currentTime),
				getResourceBar("happy", "Happy", userdata.happy, LINKS.properties, "bg-[#d4c927]", userdata, settings, currentTime),
				getResourceBar("life", "Life", userdata.life, LINKS.items_medical, "bg-[#7b98ee]", userdata, settings, currentTime),
			);

			const chainBar = getChainBar(userdata.chain, userdata, currentTime);
			if (chainBar) result.push(chainBar);
		}

		if (settings?.apiUsage?.user?.travel) {
			const travelBar = getTravelBar(userdata, currentTime);
			if (travelBar) result.push(travelBar);
		}

		return result;
	}

	function getResourceBar(
		id: string,
		label: string,
		bar: UserV1Bar | undefined,
		href: string,
		color: string,
		userdata: DatabaseUserdata,
		settings: DatabaseSettings,
		currentTime: number,
	): DashboardBar {
		const current = bar?.current ?? 0;
		const maximum = bar?.maximum ?? 100;
		const serverTime = userdata.server_time ?? Math.floor(currentTime / 1000);
		const tickAt = (serverTime + (bar?.ticktime ?? 0)) * 1000;
		let fullAt: number | "full" | "over" = (serverTime + (bar?.fulltime ?? 0)) * 1000;

		if (current === maximum) fullAt = "full";
		else if (current > maximum) fullAt = "over";

		return {
			id,
			label,
			valueLabel: `${current}/${maximum}`,
			percent: clampPercent((current / maximum) * 100),
			href,
			color,
			...getBarTimers(id, fullAt, tickAt, (bar?.interval ?? 0) * 1000, currentTime, settings?.pages?.popup?.fullBarTime),
		};
	}

	function getChainBar(bar: UserV1ChainBar | undefined, userdata: DatabaseUserdata, currentTime: number): DashboardBar | null {
		const current = bar?.current ?? 0;
		if (!current) return null;

		const serverTime = userdata.server_time ?? Math.floor(currentTime / 1000);
		const maximum = current === bar?.maximum ? bar.maximum : (getNextChainBonus(current) ?? bar?.maximum ?? current);
		const isCooldown = !!bar?.cooldown;
		const fullAt = (serverTime + (isCooldown ? bar.cooldown : (bar?.timeout ?? 0))) * 1000;

		return {
			id: "chain",
			label: "Chain",
			valueLabel: `${current}/${maximum}`,
			percent: clampPercent((current / maximum) * 100),
			href: "https://www.torn.com/factions.php?step=your",
			color: isCooldown ? "bg-muted-foreground" : "bg-foreground",
			...getBarTimers("chain", fullAt, fullAt, 0, currentTime, false, isCooldown),
		};
	}

	function getTravelBar(userdata: DatabaseUserdata, currentTime: number): DashboardBar | null {
		if (!userdata?.travel?.time_left) return null;

		const maximum = userdata.travel.arrival_at - userdata.travel.departed_at;
		const current = maximum - userdata.travel.time_left;
		const arrivalAt = userdata.travel.arrival_at * 1000;

		return {
			id: "traveling",
			label: "Traveling",
			valueLabel: formatTime(arrivalAt),
			tickLabel: formatTime({ seconds: Math.max(toSeconds(arrivalAt - currentTime), 0) }, { type: "timer" }),
			fullLabel: `Landing in ${formatTime({ seconds: Math.max(toSeconds(arrivalAt - currentTime), 0) }, { type: "timer" })}`,
			percent: clampPercent((current / maximum) * 100),
			href: "https://www.torn.com/index.php",
			color: "bg-[#d961ee]",
		};
	}

	function getBarTimers(
		id: string,
		fullAt: number | "full" | "over",
		tickAt: number,
		tickTime: number,
		currentTime: number,
		showFullTime: boolean,
		isCooldown = false,
	) {
		let nextTick = tickAt;
		if (nextTick <= currentTime && tickTime) nextTick += tickTime;

		const tickSeconds = Math.max(toSeconds(nextTick - currentTime), 0);
		let tickLabel =
			id === "chain" && isCooldown
				? formatTime({ seconds: tickSeconds }, { type: "timer", daysToHours: true })
				: formatTime({ seconds: tickSeconds }, { type: "timer", hideHours: id !== "traveling" });

		if (id === "traveling") tickLabel = formatTime({ seconds: tickSeconds }, { type: "timer" });

		let fullLabel: string;
		if (id === "happy" && fullAt === "over") {
			fullLabel = `Resets in ${formatTime({ seconds: tickSeconds }, { type: "timer", hideHours: true })}`;
		} else if (typeof fullAt === "string") {
			fullLabel = "FULL";
		} else if (id === "chain" && isCooldown) {
			fullLabel = `Cooldown over in ${formatTime({ seconds: Math.max(toSeconds(fullAt - currentTime), 0) }, { type: "timer", daysToHours: true })}`;
		} else if (id === "chain") {
			fullLabel = formatTime({ seconds: Math.max(toSeconds(fullAt - currentTime), 0) }, { type: "timer", hideHours: true });
		} else {
			fullLabel = `Full in ${formatTime({ seconds: Math.max(toSeconds(fullAt - currentTime), 0) }, { type: "timer", daysToHours: true })}`;
			if (showFullTime) fullLabel += ` (${formatTime({ milliseconds: fullAt }, { type: "normal" })})`;
		}

		return { tickLabel, fullLabel };
	}

	function clampPercent(value: number) {
		return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
	}
</script>

{#if userSettings?.bars || userSettings?.travel}
	<Card size="sm" class="rounded-lg">
		<CardContent class="space-y-1">
			{#each bars as bar (bar.id)}
				<a class="block space-y-1" href={bar.href} target="_blank" rel="noreferrer" title={bar.fullLabel}>
					<div class="flex items-center justify-between text-xs">
						<span>{bar.label}</span>
						<span class="text-muted-foreground">{bar.valueLabel}</span>
					</div>
					<div class="h-1.5 overflow-hidden rounded-sm bg-muted">
						<div class={`h-full max-w-full ${bar.color}`} style:width={`${bar.percent}%`}></div>
					</div>
					<div class="flex justify-between gap-2 text-xs leading-none text-muted-foreground">
						<span>{bar.tickLabel}</span>
						<span class="truncate text-right">{bar.fullLabel}</span>
					</div>
				</a>
			{:else}
				<div class="text-xs text-muted-foreground">No bar data available.</div>
			{/each}
		</CardContent>
	</Card>
{/if}