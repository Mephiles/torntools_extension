<script lang="ts">
	import { ttStorage } from "@common/utils/data/storage";
	import { ALL_ICONS, } from "@common/utils/functions/torn";
	import { Badge } from "@svelte/components/ui/badge";
	import { Button } from "@svelte/components/ui/button";
	import * as Tooltip from "@svelte/components/ui/tooltip";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageNumber from "../StorageNumber.svelte";
	import StorageSelect from "../StorageSelect.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import CustomLinks from "./CustomLinks.svelte";
	import OfficialIcon from "./OfficialIcon.svelte";

	const npcServiceOptions = [
		{ value: "tornstats", label: "TornStats" },
		{ value: "yata", label: "YATA" },
		{ value: "loot-ranger", label: "Loot Rangers (service = LZPT)" },
	];

	const hiddenIconCount = $derived($settingsStore.hideIcons.length);

	async function updateHiddenIcons(nextIcons: string[]) {
		await ttStorage.change({ settings: { hideIcons: nextIcons } });
	}

	function toggleHiddenIcon(icon: string) {
		const current = $settingsStore.hideIcons;
		void updateHiddenIcons(current.includes(icon) ? current.filter((entry) => entry !== icon) : [...current, icon]);
	}

</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		<div class="grid gap-1">
			<PreferenceSettingGroup>
				<StorageSwitch path="settings.pages.sidebar.notes" label="Sidebar notes" />
				<StorageSwitch path="settings.pages.sidebar.companyAddictionLevel" label="Company addiction level" description="Only works if you are a company employee. Working in a city job or being a director doesn't provide this information." />
				<StorageSwitch path="settings.pages.sidebar.showJobPointsToolTip" label="Job points tooltip" />
				<StorageSwitch path="settings.pages.sidebar.barLinks" label="Make the energy and nerve bar link to a related page" />
				<StorageSwitch path="settings.pages.sidebar.highlightEnergy" label="Highlight energy when refill is unused" />
				<StorageSwitch path="settings.pages.sidebar.highlightNerve" label="Highlight nerve when refill is unused" />
				<StorageSwitch path="settings.pages.sidebar.pointsValue" label="Points value" />
				<StorageSwitch path="settings.updateNotice" label="Extension update notice" />

				<StorageSwitch path="settings.scripts.achievements.show" label="Display achievements">
					<StorageSwitch path="settings.scripts.achievements.completed" label="show completed" />
				</StorageSwitch>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Timers">
				<StorageSwitch path="settings.pages.sidebar.ocTimer" label="OC 1.0 ready time" />
				<StorageSwitch path="settings.pages.sidebar.oc2Timer" label="OC 2.0 ready time">
					<StorageSwitch path="settings.pages.sidebar.oc2TimerLevel" label="include crime level" />
					<StorageSwitch path="settings.pages.sidebar.oc2TimerPosition" label="include crime name and position" />
				</StorageSwitch>
				<StorageSwitch path="settings.pages.sidebar.factionOCTimer" label="Faction OC 1.0 ready time" />
				<StorageSwitch path="settings.pages.sidebar.cooldownEndTimes" label="Cooldown end times" />
				<StorageSwitch path="settings.pages.sidebar.rwTimer" label="Ranked war timer" />
				<StorageSwitch path="settings.pages.sidebar.virusTimer" label="Virus timer" />
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="Areas">
				<StorageSwitch path="settings.pages.sidebar.collapseAreas" label="Collapsible areas" />
				<StorageSwitch path="settings.pages.sidebar.settingsLink" label="TT settings link" />
				<StorageSwitch path="settings.pages.sidebar.hideGymHighlight" label="Hide gym highlight" />
				<StorageSwitch path="settings.pages.sidebar.hideNewspaperHighlight" label="Hide newspaper highlight" />
				<StorageNumber
					path="settings.pages.sidebar.upkeepPropHighlight"
					label="Property upkeep highlight"
					description="Highlight the properties area when your upkeep is at or above this threshold. Use 0 to disable."
					min={0}
				/>
			</PreferenceSettingGroup>

			<PreferenceSettingGroup title="NPCs" contentClass="grid gap-1">
				<StorageSwitch path="settings.pages.sidebar.npcLootTimes" label="NPC loot times" externalServices={["tornstats", "yata", "lzpt"]} />
				<StorageSelect
					items={npcServiceOptions}
					path="settings.pages.sidebar.npcLootTimesService"
					label="NPC loot source"
					description="Used when more than one NPC loot service is enabled."
				/>
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Hidden Sidebar Icons" description="Select Torn icons that should be hidden. Also affects the popup icons.">
		{#snippet action()}
			<Badge variant={hiddenIconCount ? "secondary" : "outline"}>{hiddenIconCount} hidden</Badge>
		{/snippet}

		<div class="flex flex-wrap gap-1">
			{#each ALL_ICONS as icon (icon.icon)}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props: _props })}
							<Button
								{..._props}
								type="button"
								size="icon-xs"
								variant={$settingsStore.hideIcons.includes(icon.icon) ? "default" : "outline"}
								onclick={() => toggleHiddenIcon(icon.icon)}
							>
								<OfficialIcon icon={icon.id} />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>{icon.description}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
		</div>
	</PreferenceSectionCard>

	<CustomLinks />
</div>
