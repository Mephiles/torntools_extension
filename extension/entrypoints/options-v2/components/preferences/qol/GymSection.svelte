<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<PreferenceSectionCard title="Gym">
	<PreferenceSettingGroup>
		<StorageSwitch path="settings.pages.gym.specialist" label="Show specialist gym requirements" />
		<StorageSwitch path="settings.pages.gym.disableStats" label="Allow stats to be disabled" />
		<StorageSwitch path="settings.pages.gym.steadfast" label="Show current steadfast bonus for each stat" />
		<StorageSwitch path="settings.pages.gym.progress" label="Display estimated gym energy progress" />
		<StorageSwitch path="settings.pages.gym.graph" label="Display stat graph" externalServices={["tornstats"]} />
	</PreferenceSettingGroup>
</PreferenceSectionCard>
