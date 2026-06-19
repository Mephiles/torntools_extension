<script lang="ts">
	import ExternalServiceRequirement from "@/entrypoints/options/components/preferences/ExternalServiceRequirement.svelte";
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

<PreferenceSectionCard title="Information Reporting">
	<ExternalServiceRequirement services={["playgroundTorntools"]} />
	<span class="text-muted-foreground m-1 inline-block text-xs">
		Sometimes it might be necessary for us to collect information about very specific issues. These might share sensitive
		in-game information (like money on hand) with the developers. You should only enable these whenever asked by a
		developer to help them gather the information we need.
	</span>

	<div class="grid gap-1">
		<StorageSwitch path="settings.reporting.userdataInvalidOwner" label="Invalid userdata owner" description="Whenever the extension detects that it received an api response from another user, it sends that response and the request we made (with your api key redacted). This includes your player id" />
	</div>
</PreferenceSectionCard>
