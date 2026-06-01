<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<PreferenceSectionCard title="Debug Information">
	<div class="grid gap-1">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.developer" label="Developer errors" />
			<StorageSwitch path="settings.featureDisplay" label="Feature manager">
				<StorageSwitch path="settings.featureDisplayOnlyFailed" label="only failed" />
				<StorageSwitch path="settings.featureDisplayHideDisabled" label="hide disabled" />
				<StorageSwitch path="settings.featureDisplayHideEmpty" label="hide when empty" />
			</StorageSwitch>
		</PreferenceSettingGroup>
	</div>
</PreferenceSectionCard>
