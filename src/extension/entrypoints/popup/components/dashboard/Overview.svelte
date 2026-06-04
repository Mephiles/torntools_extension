<script lang="ts">
	import type {DatabaseSettings, DatabaseUserdata} from "@common/utils/data/database";
	import { capitalizeText, formatTime } from "@common/utils/functions/formatting";
	import { ALL_ICONS } from "@common/utils/functions/torn";
	import { settingsStore, userdataStore } from "@extension/entrypoints/popup/stores/database-store.svelte";
	import { Card, CardContent, CardHeader, CardTitle } from "@svelte/components/ui/card";
	import * as Tooltip from "@svelte/components/ui/tooltip";

	type VisibleIcon = {
		id: number;
		icon: string;
		href?: string;
		tooltip: string;
	};

	const { now } : { now: number } = $props();
	const statusInformation = $derived(getStatusInformation($userdataStore, $settingsStore, now));
	const visibleIcons = $derived(getVisibleIcons($userdataStore, $settingsStore, now));

	function getStatusInformation(userdata: DatabaseUserdata, settings: DatabaseSettings, currentTime: number) {
		if (!settings?.apiUsage?.user?.travel || !userdata?.travel) {
			return {
				country: "Torn",
				status: null,
				href: "https://www.torn.com",
			};
		}

		if (userdata.travel.time_left) {
			return {
				country: `Traveling to ${userdata.travel.destination}`,
				status: null,
				href: "https://www.torn.com/index.php",
			};
		}

		const rawStatus = userdata.profile?.status?.state?.toLowerCase?.() ?? "okay";
		const status = rawStatus === "abroad" ? "okay" : rawStatus;
		const until = userdata.profile?.status?.until ? userdata.profile.status.until * 1000 : null;
		let label = capitalizeText(status);

		if (until && until > currentTime) {
			if (status === "jail") {
				label = `Jailed for ${formatTime({ milliseconds: until - currentTime }, { type: "timer", showDays: true, short: true })}`;
			} else if (status === "hospital") {
				label = `Hospitalized for ${formatTime({ milliseconds: until - currentTime }, { type: "timer", showDays: true, short: true })}`;
			}
		}

		return {
			country: userdata.travel.destination,
			status: {
				label,
				className:
					status === "hospital"
						? "text-destructive"
						: status === "jail"
							? "text-amber-600 dark:text-amber-400"
							: "text-primary",
			},
			href: "https://www.torn.com",
		};
	}

	function getVisibleIcons(userdata: DatabaseUserdata, settings: DatabaseSettings, currentTime: number): VisibleIcon[] {
		if (!settings?.apiUsage?.user?.icons || !settings?.pages?.popup?.showIcons || !userdata?.icons) return [];

		return ALL_ICONS.flatMap((icon) => {
			if (settings.hideIcons?.includes(icon.icon)) return [];

			const userdataIcon = userdata.icons.find((entry) => entry.id === icon.id);
			if (!userdataIcon) return [];

			const tooltipParts = [userdataIcon.title, userdataIcon.description].filter(Boolean);
			if (userdataIcon.until) {
				tooltipParts.push(
					formatTime({ milliseconds: Math.max(userdataIcon.until * 1000 - currentTime, 0) }, { type: "wordTimer", showDays: true }),
				);
			}

			return [
				{
					id: icon.id,
					icon: icon.icon,
					href: "url" in icon ? icon.url : undefined,
					tooltip: tooltipParts.join(" - ") || icon.description,
				},
			];
		});
	}
</script>

<Card size="sm" class="rounded-lg gap-2!">
	<CardHeader>
		<CardTitle class="min-w-0 truncate flex flex-wrap items-center justify-between w-full">
			<a class="hover:underline" href={statusInformation.href} target="_blank" rel="noreferrer">
				{statusInformation.country}
			</a>
			{#if statusInformation.status}
				<div class={`text-xs font-medium ${statusInformation.status.className}`}>{statusInformation.status.label}</div>
			{/if}
		</CardTitle>
	</CardHeader>
	{#if visibleIcons.length}
		<CardContent class="flex flex-wrap gap-1">
			{#each visibleIcons as icon (icon.id)}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props: _props })}
							<svelte:element
									this={icon.href ? "a" : "span"}
									{..._props}
									href={icon.href}
									target={icon.href ? "_blank" : undefined}
									rel={icon.href ? "noreferrer" : undefined}
									aria-label={icon.tooltip}
									class="block size-4 shrink-0 overflow-hidden"
							>
									<span
											class="block size-4"
											style={`background:url(https://torn.com/images/v2/svg_icons/sprites/user_status_icons_sprite.svg);background-position:-${(icon.id - 1) * 18}px 0`}
									></span>
							</svelte:element>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content sideOffset={4}>{icon.tooltip}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</CardContent>
	{/if}
</Card>
