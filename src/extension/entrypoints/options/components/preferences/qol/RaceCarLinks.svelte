<script lang="ts">
	import { TRACKS } from "@common/pages/racing-page.ts";
	import { ttStorage } from "@common/utils/context";
	import { countOwnedModelBuilds } from "@features/race-car-selector/car-ranking";
	import { formatGearbox, getGuideSetup, getRecommendation } from "@features/race-car-selector/racing-recommendations";
	import { settingsStore, userdataStore } from "../../../stores/database-store.svelte";
	import ItemSelect from "../ItemSelect.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";

	const enlistedCars = $derived(($userdataStore?.enlistedcars ?? []).filter((car) => !car.is_removed));

	const carItems = $derived([
		{ value: "", label: "Auto (recommended)" },
		{ value: "0", label: "No car (never auto-select)" },
		...enlistedCars.map((car) => ({
			value: String(car.id),
			label: car.car_name ? `(${car.id}) ${car.car_item_name}: ${car.car_name}` : `(${car.id}) ${car.car_item_name}`,
		})),
	]);

	function getTrackCar(trackId: number) {
		return $settingsStore.pages.racing.trackCars[trackId] !== undefined ? String($settingsStore.pages.racing.trackCars[trackId]) : "";
	}

	async function setTrackCar(trackId: number, value: string) {
		await ttStorage.update("settings", (settings) => {
			if (value === "") delete settings.pages.racing.trackCars[trackId];
			else settings.pages.racing.trackCars[trackId] = parseInt(value);
		});
	}

	function getAutoHint(trackName: string) {
		const recommendation = getRecommendation(trackName);
		if (!recommendation) return "";

		const setup = getGuideSetup(trackName);
		const setupText = [formatGearbox(setup.gearbox), setup.turbo.toUpperCase()].filter(Boolean).join(" ");
		const car = setupText ? `${recommendation.car} (${setupText})` : recommendation.car;
		const owned = countOwnedModelBuilds(enlistedCars, recommendation);

		return `Auto: ${car} - ${owned > 0 ? "in your garage" : "not in your garage"}`;
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
							placeholder="Auto (recommended)"
							value={getTrackCar(track.id)}
							onValueChange={(value) => void setTrackCar(track.id, value)}
						/>
					</div>
					<p class="text-muted-foreground mt-1 text-xs">{getAutoHint(track.name)}</p>
				</div>
			{/each}
		</div>
	{:else}
		<p class="border-border text-muted-foreground mt-2 rounded-md border border-dashed p-2 text-center text-sm">No enlisted cars found.</p>
	{/if}
</PreferenceSectionCard>
