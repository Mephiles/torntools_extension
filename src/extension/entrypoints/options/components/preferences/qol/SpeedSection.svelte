<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		<StorageSwitch path="settings.pages.crimes.quickCrimes" label="Quick Crimes" />
		<StorageSwitch path="settings.pages.trade.openChat" label="Chat button in trades" />
	</PreferenceSectionCard>


	<PreferenceSectionCard title="No Confirm">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.scripts.noConfirm.itemEquip" label="Equipping items" />
			<StorageSwitch path="settings.scripts.noConfirm.tradeAccept" label="Accepting trades" />
			<StorageSwitch path="settings.scripts.noConfirm.pointsMarketBuy" label="Buying points from the market" />
			<StorageSwitch path="settings.scripts.noConfirm.pointsMarketRemove" label="Removing points from the market" />
			<StorageSwitch path="settings.scripts.noConfirm.abroadItemBuy" label="Buying items aboard" disabled description="Disabled until further notice." />
			<StorageSwitch path="settings.scripts.noConfirm.propertiesSell" label="Selling your properties" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>
</div>
