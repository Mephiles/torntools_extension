<script lang="ts">
	import { TRACKS } from "@common/pages/racing-page.ts";
	import { ttStorage } from "@common/utils/context";
	import { settingsStore, userdataStore } from "../../../stores/database-store.svelte";
	import ItemSelect from "../ItemSelect.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const enlistedCars = $derived(($userdataStore?.enlistedcars ?? []).filter((car) => !car.is_removed));

	const carItems = $derived([
		{ value: "", label: "No car" },
		...enlistedCars.map((car) => ({
			value: String(car.id),
			label: car.car_name ? `(${car.id}) ${car.car_item_name}: ${car.car_name}` : `(${car.id}) ${car.car_item_name}`,
		})),
	]);

	function getTrackCar(trackId: number) {
		return $settingsStore.pages.racing.trackCars[trackId] !== undefined ? String($settingsStore.pages.racing.trackCars[trackId]) : "";
	}

	async function setTrackCar(trackId: number, value: string) {
		const trackCars = { ...$settingsStore.pages.racing.trackCars };

		if (value === "") delete trackCars[trackId];
		else trackCars[trackId] = parseInt(value);

		await ttStorage.change({ settings: { pages: { racing: { trackCars } } } });
	}
</script>

<PreferenceSectionCard title="Race Car Selector">
	<StorageSwitch path="settings.pages.racing.carSelector" label="Auto-select your car for each race" />

	{#if enlistedCars.length}
		<div class="mt-2 space-y-1">
			{#each TRACKS as track (track.id)}
				<div class="border-border bg-background/60 rounded-md border p-2">
					<div class="grid items-center gap-2 md:grid-cols-[8rem_1fr]">
						<span class="text-sm">{track.name}</span>
						<ItemSelect
							items={carItems}
							placeholder="Select a car"
							value={getTrackCar(track.id)}
							onValueChange={(value) => void setTrackCar(track.id, value)}
						/>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="border-border text-muted-foreground mt-2 rounded-md border border-dashed p-2 text-center text-sm">No enlisted cars found.</p>
	{/if}
</PreferenceSectionCard>
