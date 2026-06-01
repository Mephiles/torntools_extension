<script lang="ts">
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { ttStorage } from "@utils/context";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const cheapItemThreshold = $derived(String($settingsStore.pages.itemmarket.highlightCheapItems ?? ""));

	async function updateCheapItemThreshold(value: string) {
		const trimmedValue = value.trim();
		const nextValue = trimmedValue === "" ? "" : Number(trimmedValue);

		await ttStorage.change({ settings: { pages: { itemmarket: { highlightCheapItems: nextValue } } } });
	}
</script>

<div class="space-y-2">
	<PreferenceSectionCard title="Bazaar">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.bazaar.itemsCost" label="Show the total cost of buying an item" />
			<StorageSwitch path="settings.pages.bazaar.worth" label="Show the worth of the visited bazaar" />
			<StorageSwitch path="settings.pages.bazaar.fillMax" label="Fill Max">
				<StorageSwitch path="settings.pages.bazaar.maxBuyIgnoreCash" label="Ignore cash on hand" />
			</StorageSwitch>
			<StorageSwitch path="settings.pages.bazaar.highlightSubVendorItems" label="Highlight items less than the vendor sell price" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Shops">
		<PreferenceSettingGroup>
			<StorageSwitch path="settings.pages.shops.fillMax" label="Fill Max">
				<StorageSwitch path="settings.pages.shops.maxBuyIgnoreCash" label="Ignore cash on hand" />
			</StorageSwitch>
			<StorageSwitch path="settings.pages.shops.profit" label="Item profits" />
			<StorageSwitch path="settings.pages.shops.values" label="Item market values" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>

	<PreferenceSectionCard title="Item Market">
		<PreferenceSettingGroup>
			<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
				<Field.Content>
					<Field.Label for="financial-itemmarket-highlight-cheap-items">Highlight items below value</Field.Label>
					<Field.Description class="text-xs">Percentage below item value. Leave empty to disable the threshold.</Field.Description>
				</Field.Content>

				<Input
					id="financial-itemmarket-highlight-cheap-items"
					type="number"
					min="0"
					max="100"
					value={cheapItemThreshold}
					oninput={(event) => updateCheapItemThreshold(event.currentTarget.value)}
				/>
			</Field.Field>
			<StorageSwitch path="settings.pages.itemmarket.highlightCheapItemsSound" label="Play a sound when highlighting cheap items" />
			<StorageSwitch path="settings.pages.itemmarket.leftBar" label="Move the market bar to the left" />
			<StorageSwitch path="settings.pages.itemmarket.fillMax" label="Fill Max" />
		</PreferenceSettingGroup>
	</PreferenceSectionCard>
</div>
