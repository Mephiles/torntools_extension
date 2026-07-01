<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSelect from "../StorageSelect.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const bloodBagOptions = [
		{ value: "none", label: "None" },
		{ value: "o+", label: "O+" },
		{ value: "o-", label: "O-" },
		{ value: "a+", label: "A+" },
		{ value: "a-", label: "A-" },
		{ value: "b+", label: "B+" },
		{ value: "b-", label: "B-" },
		{ value: "ab+", label: "AB+" },
		{ value: "ab-", label: "AB-" },
	];
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Items">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.items.quickItems" label="Show the quick items container" />
			<StorageSwitch
				path="settings.pages.items.drugDetails"
				label="Show details about drugs"
				description="Also affects other places where you can view item details."
			/>
			<StorageSelect
				items={bloodBagOptions}
				path="settings.pages.items.highlightBloodBags"
				label="Highlight blood bags"
				description="Also affects the faction armory."
			/>
			<StorageSwitch path="settings.pages.items.energyWarning" label="Warn if an item gives you energy over 1000" />
			<StorageSwitch path="settings.pages.items.medicalLife" label="Show life information when consuming medical items" />
			<StorageSwitch path="settings.pages.items.hideRecycleMessage" label="Hide the recycle message" />
			<StorageSwitch path="settings.pages.items.hideTooManyItemsWarning" label="Hide the too many items warning" />
			<StorageSwitch path="settings.pages.items.missingBooks" label="Display missing books" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Museum Sets">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.items.missingFlowers" label="Display missing flowers for a complete set" />
			<StorageSwitch path="settings.pages.items.missingPlushies" label="Display missing plushies for a complete set" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Item Effects">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.items.bookEffects" label="Show book effects" />
			<StorageSwitch path="settings.pages.items.canGains" label="Show energy drink gains" />
			<StorageSwitch path="settings.pages.items.candyHappyGains" label="Show candy happy gains" />
			<StorageSwitch path="settings.pages.items.nerveGains" label="Show alcohol nerve gains" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>
</div>
