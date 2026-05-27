<script lang="ts">
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSelect from "../StorageSelect.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const dashboardOptions = $derived([
		{ value: "dashboard", label: "Dashboard", disabled: !$settingsStore.pages.popup.dashboard },
		{ value: "marketSearch", label: "Market search", disabled: !$settingsStore.pages.popup.marketSearch },
		{ value: "calculator", label: "Calculator", disabled: !$settingsStore.pages.popup.calculator },
		{ value: "stocksOverview", label: "Stocks overview", disabled: !$settingsStore.pages.popup.stocksOverview },
		{ value: "notifications", label: "Notifications history", disabled: !$settingsStore.pages.popup.notifications },
	]);
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Popup">
		<div class="grid gap-1">
			<PreferenceSettingGroup title="Tabs" contentClass="grid gap-1 grid-cols-2 md:grid-cols-3">
				<StorageSwitch path="settings.pages.popup.dashboard" label="Dashboard" compact />
				<StorageSwitch path="settings.pages.popup.marketSearch" label="Market search" compact />
				<StorageSwitch path="settings.pages.popup.calculator" label="Calculator" compact />
				<StorageSwitch path="settings.pages.popup.stocksOverview" label="Stocks overview" compact />
				<StorageSwitch path="settings.pages.popup.notifications" label="Notifications" compact />
			</PreferenceSettingGroup>

			<StorageSelect items={dashboardOptions} path="settings.pages.popup.defaultTab" label="Default tab" />
			<StorageSwitch path="settings.pages.popup.showStakeouts" label="Show stakeouts" />
			<StorageSwitch path="settings.pages.popup.showIcons" label="Show status icons" />
			<StorageSwitch path="settings.pages.popup.hoverBarTime" label="Show bar time on hover" />
			<StorageSwitch
				path="settings.pages.popup.bazaarUsingExternal"
				label="Populate bazaar prices using external services."
				externalServices={["tornw3b"]}
			/>
		</div>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Icon Bars">
		<div class="grid gap-1">
			<StorageSwitch path="settings.pages.icon.global" label="Icon bars" />

			<PreferenceSettingGroup title="Bars" contentClass="grid gap-1 grid-cols-2 md:grid-cols-3">
				<StorageSwitch path="settings.pages.icon.energy" label="Energy" compact />
				<StorageSwitch path="settings.pages.icon.nerve" label="Nerve" compact />
				<StorageSwitch path="settings.pages.icon.happy" label="Happy" compact />
				<StorageSwitch path="settings.pages.icon.life" label="Life" compact />
				<StorageSwitch path="settings.pages.icon.chain" label="Chain" compact />
				<StorageSwitch path="settings.pages.icon.travel" label="Travel" compact />
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>
</div>
