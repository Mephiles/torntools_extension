<script lang="ts">
	import { TRACKS } from "@common/pages/racing-page.ts";
	import { ttCache } from "@common/utils/data/cache";
	import { fetchData } from "@common/utils/functions/api-fetcher";
	import { TO_MILLIS } from "@common/utils/functions/utilities";
	import { countOwnedModelBuilds } from "@features/race-car-selector/car-ranking";
	import { getRecommendation } from "@features/race-car-selector/racing-recommendations";
	import { PDA_KEY } from "@userscripts/runtime/script-fetch";
	import { getEffectiveApi } from "@userscripts/settings/shared-settings";
	import { isPDA } from "@userscripts/utils/script-utils";
	import { onMount } from "svelte";
	import type { UserEnlistedCarsResponse, UserRaceCarDetails } from "tornapi-typescript";
	import styles from "./race-car-tracks.module.css";

	interface RaceCarTracksProps {
		value: Record<number, number>;
		onchange: (trackId: number, carId: number | null) => void;
	}

	let { value, onchange }: RaceCarTracksProps = $props();

	let status = $state<"loading" | "ready" | "unavailable">("loading");
	let cars = $state<UserRaceCarDetails[]>([]);
	let message = $state<string | null>(null);

	onMount(() => void loadCars());

	async function loadCars() {
		const key = isPDA() ? PDA_KEY : getEffectiveApi().torn.key;
		if (!key) {
			status = "unavailable";
			message = "Add your Torn API key under Connections to pick cars from your garage.";
			return;
		}

		try {
			let data = ttCache.get<UserEnlistedCarsResponse>("tt-enlisted-cars");
			if (!data) {
				data = await fetchData<UserEnlistedCarsResponse>("tornv2", { section: "user", selections: ["enlistedcars"], key, includeKey: true });
				ttCache.set({ "tt-enlisted-cars": data }, TO_MILLIS.MINUTES * 5);
			}

			cars = (data.enlistedcars ?? []).filter((car) => !car.is_removed);
			status = "ready";

			if (!cars.length) message = "You don't have any enlisted cars.";
		} catch {
			status = "unavailable";
			message = "Could not load your cars. Enter the car ID instead.";
		}
	}

	function storedCar(trackId: number): number | undefined {
		return value[trackId];
	}

	function unknownCar(trackId: number) {
		const stored = storedCar(trackId);
		if (stored === undefined || stored === 0 || cars.some((car) => car.id === stored)) return null;

		return stored;
	}

	function carLabel(car: UserRaceCarDetails) {
		return car.car_name ? `(${car.id}) ${car.car_item_name}: ${car.car_name}` : `(${car.id}) ${car.car_item_name}`;
	}

	function hint(trackName: string) {
		const recommendation = getRecommendation(trackName);
		if (!recommendation) return null;

		if (status !== "ready") return `Auto: ${recommendation.car}`;

		const owned = countOwnedModelBuilds(cars, recommendation);
		return `Auto: ${recommendation.car} — ${owned > 0 ? "in your garage" : "not in your garage"}`;
	}

	function changeCar(trackId: number, selected: string) {
		onchange(trackId, selected === "auto" ? null : parseInt(selected));
	}

	function changeCarId(trackId: number, raw: string) {
		const parsed = parseInt(raw);
		onchange(trackId, raw.trim() === "" || Number.isNaN(parsed) ? null : Math.max(0, parsed));
	}
</script>

{#if message}
	<p class={styles.message}>{message}</p>
{/if}

<div class={styles.rows}>
	{#each TRACKS as track (track.id)}
		{@const stored = storedCar(track.id)}
		{@const unknown = unknownCar(track.id)}
		{@const hintText = hint(track.name)}
		<div class={styles.row}>
			<span class={styles.track}>{track.name}</span>

			<div class={styles.choice}>
				{#if status === "loading"}
					<span class={styles.hint}>Loading your cars…</span>
				{:else if status === "ready"}
					<select class={styles.input} aria-label={track.name} onchange={(event) => changeCar(track.id, event.currentTarget.value)}>
						<option value="auto" selected={stored === undefined}>Auto (recommended)</option>
						<option value="0" selected={stored === 0}>No car (never auto-select)</option>
						{#each cars as car (car.id)}
							<option value={String(car.id)} selected={stored === car.id}>{carLabel(car)}</option>
						{/each}
						{#if unknown !== null}
							<option value={String(unknown)} selected>({unknown}) Unknown car</option>
						{/if}
					</select>
				{:else}
					<input
						class={styles.input}
						type="number"
						min="0"
						step="1"
						aria-label={track.name}
						placeholder="Car ID"
						value={stored ?? ""}
						onchange={(event) => changeCarId(track.id, event.currentTarget.value)}
					/>
				{/if}

				{#if hintText}
					<span class={styles.hint}>{hintText}</span>
				{/if}
			</div>
		</div>
	{/each}
</div>
