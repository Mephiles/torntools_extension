<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Profile">
		<div class="grid gap-1">
			<PreferenceSettingGroup>
				<StorageSwitch path="settings.pages.profile.avgpersonalstats" label="Calculate average personal stats" />
				<StorageSwitch path="settings.pages.profile.idBesideProfileName" label='Reformat profile page headings as "USERNAME [ID]"' />
				<StorageSwitch path="settings.pages.profile.statusIndicator" label="Show user's status indicator next to their name" />
				<StorageSwitch path="settings.pages.profile.notes" label="Show profile notes" />
				<StorageSwitch path="settings.pages.profile.ageToWords" label="Show age of profile in words" />
			</PreferenceSettingGroup>

			<StorageSwitch path="settings.pages.profile.box" label="Show the profile box">
				<StorageSwitch path="settings.pages.profile.boxFetch" label="Automatically fetch data from the API" />
				<StorageSwitch path="settings.pages.profile.boxStats" label="Display personal stats" />
				<StorageSwitch path="settings.pages.profile.boxSpy" label="Show known spy results" />
				<StorageSwitch path="settings.pages.profile.boxStakeout" label="Enable stakeout options" />
				<StorageSwitch path="settings.pages.profile.boxAttackHistory" label="Show your attack history" />
			</StorageSwitch>
		</div>
	</PreferenceSectionCard>
</div>
