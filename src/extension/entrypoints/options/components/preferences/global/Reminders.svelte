<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<PreferenceSectionCard title="Reminders" description="Remind you of repeating tasks to not forget them.">
	<div class="grid gap-1">
		<StorageSwitch path="settings.scripts.reminders.show" label="Display reminders">
			<StorageSwitch path="settings.scripts.reminders.finished" label="Include finished tasks" />
		</StorageSwitch>

		<PreferenceSettingGroup description="What reminders should be included in the list?">
			<StorageSwitch path="settings.scripts.reminders.types.energyRefill" label="Energy Refill" />
			<StorageSwitch path="settings.scripts.reminders.types.nerveRefill" label="Nerve Refill" />
			<StorageSwitch path="settings.scripts.reminders.types.medicalCooldown" label="Medical Cooldown" />
			<StorageSwitch path="settings.scripts.reminders.types.boosterCooldown" label="Booster Cooldown" />
			<StorageSwitch path="settings.scripts.reminders.types.drugCooldown" label="Drug Cooldown" />
			<StorageSwitch path="settings.scripts.reminders.types.bankInvestment" label="Bank Investment" />
			<StorageSwitch path="settings.scripts.reminders.types.virusCoding" label="Virus Coding" />
			<StorageSwitch path="settings.scripts.reminders.types.missionReward" label="Mission Reward" />
			<StorageSwitch path="settings.scripts.reminders.types.oc" label="OC" />
			<StorageSwitch path="settings.scripts.reminders.types.ocItem" label="OC Item" />
			<StorageSwitch path="settings.scripts.reminders.types.race" label="Race" />
			<StorageSwitch path="settings.scripts.reminders.types.education" label="Education" />
		</PreferenceSettingGroup>
	</div>
</PreferenceSectionCard>
