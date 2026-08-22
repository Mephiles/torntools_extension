<script lang="ts">
	import ArrowSquareOutIcon from "phosphor-svelte/lib/ArrowSquareOutIcon";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import RaceCarLinks from "./RaceCarLinks.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.racing.winPercentage" label="Show win percentage of each car" />
			<StorageSwitch path="settings.pages.racing.upgrades" label="Show racing upgrade values" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<RaceCarLinks />
</div>
