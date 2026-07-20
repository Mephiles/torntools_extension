<script lang="ts">
	import PriorityServiceConfiguration
		from "@/entrypoints/options/components/preferences/PriorityServiceConfiguration.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Travel">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.travel.computer" label="Show a computer link while flying or abroad" />
			<StorageSwitch
				path="settings.pages.travel.table"
				label="Show a table of all countries with their item and stocks"
				externalServices={["prometheus", "tornintel", "yata"]}
			>
				{#snippet titleAction()}
					<PriorityServiceConfiguration
							title="Travel Data"
							services={[
								{
									name: "Prometheus",
									pathEnabled: "settings.servicePreferences.travelData.prometheus.enabled",
									pathPriority: "settings.servicePreferences.travelData.prometheus.priority"
								},
								{
									name: "Torn Intel",
									pathEnabled: "settings.servicePreferences.travelData.tornintel.enabled",
									pathPriority: "settings.servicePreferences.travelData.tornintel.priority"
								},
								{
									name: "YATA",
									pathEnabled: "settings.servicePreferences.travelData.yata.enabled",
									pathPriority: "settings.servicePreferences.travelData.yata.priority"
								}
						]} />
				{/snippet}

				<StorageSwitch path="settings.pages.travel.autoTravelTableCountry" label="Update country in travel table filter as per map selections" />
			</StorageSwitch>
			<StorageSwitch path="settings.pages.travel.flyingTime" label="Show the time when you would land when flying now" />
			<StorageSwitch path="settings.pages.travel.cooldownWarnings" label="Show warnings if cooldowns will be over when you land back in Torn" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Flying">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.travel.landingTime" label="Show the landing time when flying" />
			<StorageSwitch path="settings.pages.travel.cleanFlight" label="Hide plane and funfact box while flying" />
			<StorageSwitch path="settings.pages.travel.tabTitleTimer" label="Show travel time in tab title" />
			<StorageSwitch path="settings.pages.travel.hideInventoryButton" label="Show button to hide the travel inventory" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Abroad">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.travel.travelProfits" label="Show profits of items in market" />
			<StorageSwitch path="settings.pages.travel.fillMax" label="Show fill max button">
				<StorageSwitch path="settings.pages.travel.autoFillMax" label="Automatically fill max amount of stock" />
			</StorageSwitch>
			<StorageSwitch path="settings.pages.travel.efficientRehab" label="Efficiently rehab to not waste any natural decay">
				<StorageSwitch path="settings.pages.travel.efficientRehabSelect" label="Automatically set the slider to the current amount" />
			</StorageSwitch>
		</PreferenceSettingGroup>
	</PreferenceSectionCard>
</div>
