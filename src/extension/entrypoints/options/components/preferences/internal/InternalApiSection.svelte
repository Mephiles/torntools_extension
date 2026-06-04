<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import type { BooleanPreferenceStoragePath } from "../preference-storage";
	import StorageNumber from "../StorageNumber.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import StorageText from "../StorageText.svelte";
	import ApiKeyCard from "./ApiKeyCard.svelte";

	const userSelections: { path: BooleanPreferenceStoragePath, label: string }[] = [
		{ path: "settings.apiUsage.user.bars", label: "Bars" },
		{ path: "settings.apiUsage.user.cooldowns", label: "Cooldowns" },
		{ path: "settings.apiUsage.user.travel", label: "Travel" },
		{ path: "settings.apiUsage.user.newevents", label: "Unread events" },
		{ path: "settings.apiUsage.user.newmessages", label: "Unread messages" },
		{ path: "settings.apiUsage.user.refills", label: "Refills" },
		{ path: "settings.apiUsage.user.stocks", label: "Stocks" },
		{ path: "settings.apiUsage.user.education", label: "Education" },
		{ path: "settings.apiUsage.user.networth", label: "Networth" },
		{ path: "settings.apiUsage.user.jobpoints", label: "Job points" },
		{ path: "settings.apiUsage.user.merits", label: "Merits" },
		{ path: "settings.apiUsage.user.perks", label: "Perks" },
		{ path: "settings.apiUsage.user.icons", label: "Icons" },
		{ path: "settings.apiUsage.user.ammo", label: "Ammo" },
		{ path: "settings.apiUsage.user.battlestats", label: "Battlestats" },
		{ path: "settings.apiUsage.user.crimes", label: "Crimes" },
		{ path: "settings.apiUsage.user.workstats", label: "Workstats" },
		{ path: "settings.apiUsage.user.skills", label: "Skills" },
		{ path: "settings.apiUsage.user.weaponexp", label: "Weapon experience" },
		{ path: "settings.apiUsage.user.properties", label: "Properties" },
		{ path: "settings.apiUsage.user.calendar", label: "Calendar" },
		{ path: "settings.apiUsage.user.missions", label: "Missions" },
		{ path: "settings.apiUsage.user.organizedcrime", label: "Organized crime" },
		{ path: "settings.apiUsage.user.personalstats", label: "Personal stats" },
		{ path: "settings.apiUsage.user.attacks", label: "Attacks" },
		{ path: "settings.apiUsage.user.money", label: "Money" },
		{ path: "settings.apiUsage.user.honors", label: "Honors" },
		{ path: "settings.apiUsage.user.medals", label: "Medals" },
		{ path: "settings.apiUsage.user.virus", label: "Virus" },
	];
</script>

<div class="space-y-2">
	<ApiKeyCard />

	<PreferenceSectionCard title="API Usage" description="All API usage is checked every 30 seconds.">
		<StorageText path="settings.apiUsage.comment" label="API call comment" />
		<StorageNumber path="settings.apiUsage.delayEssential" label="Essential userdata interval" min={30} />
		<StorageNumber path="settings.apiUsage.delayBasic" label="Basic userdata interval" min={30} />
		<StorageNumber path="settings.apiUsage.delayPassive" label="Passive userdata interval" min={30} />
		<StorageNumber path="settings.apiUsage.delayStakeouts" label="Stakeout interval" min={30} />
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Selections">
		<PreferenceSettingGroup
			title="User Selections"
			description="Disabling certain selections will silently disable certain features that rely on that api selection."
			contentClass="grid gap-1 grid-cols-2 md:grid-cols-3"
		>
			{#each userSelections as selection (selection.path)}
				<StorageSwitch path={selection.path} label={selection.label} compact />
			{/each}
		</PreferenceSettingGroup>
	</PreferenceSectionCard>
</div>
