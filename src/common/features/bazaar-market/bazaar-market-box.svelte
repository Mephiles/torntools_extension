<script lang="ts">
	import { fetchData } from "@common/utils/functions/api-fetcher.ts";
	import type { TornW3BResult } from "@common/utils/functions/api.types.ts";
	import { formatNumber } from "@common/utils/functions/formatting.ts";
	import { readableErrorMessage } from "@common/utils/functions/utilities.ts";
	import type { StaticItem } from "@common/utils/torn-api/items.types.ts";
	import BazaarListings, { type SortField, type SortOrder } from "@features/bazaar-market/BazaarListings.svelte";
	import { Spinner } from "@svelte/components/ui/spinner";
	import styles from "./bazaar-market.module.css";

	interface BazaarMarketBoxProps {
		item: StaticItem;
	}

	let { item }: BazaarMarketBoxProps = $props();

	let sortField: SortField = $state("price");
	let sortOrder: SortOrder = $state("ASC");
	let minQuantity: number = $state();
	let maxPrice: number = $state();
	let resultLimit: number = $state(100);

	let market = $derived.by(() => {
		const params: Record<string, any> = {};

		if (minQuantity) params.minQty = minQuantity;
		if (maxPrice) params.maxPrice = maxPrice;
		if (resultLimit) params.limit = resultLimit;

		return fetchData<TornW3BResult>("tornw3b", { relay: true, section: `marketplace/${item.id}`, params }).then<TornW3BResult>((result) => ({
			...result,
			listings: result.listings.filter((listing) => (!minQuantity || listing.quantity >= minQuantity) && (!maxPrice || listing.price <= maxPrice)),
		}));
	});
</script>

<div class={styles.bazaarMarket}>
	<div class={styles.header}>
		<span class={styles.title}>{item.name}</span>

		{#await market then result}
			<div class={styles.valueInformation}>
				<span>
					Value
					<strong>{formatNumber(result.market_price, { currency: true })}</strong>
				</span>
				<span>
					Average
					<strong>{formatNumber(result.bazaar_average, { currency: true })}</strong>
				</span>
			</div>
		{/await}
	</div>
	<div class={styles.controls}>
		<label class={styles.control}>
			Sort
			<select bind:value={sortField}>
				<option value="price">Price</option>
				<option value="quantity">Quantity</option>
			</select>
		</label>

		<label class={styles.control}>
			Order
			<select bind:value={sortOrder}>
				<option value="ASC">Asc</option>
				<option value="DESC">Desc</option>
			</select>
		</label>

		<label class={styles.control}>
			Min qty
			<input type="number" min="1" bind:value={minQuantity} />
		</label>

		<label class={styles.control}>
			Max price
			<input type="number" min="1" bind:value={maxPrice} />
		</label>

		<label class={styles.control}>
			Results
			<input type="number" min="1" max="100" bind:value={resultLimit} />
		</label>
	</div>

	{#await market}
		<p class={styles.loading}>
			<Spinner />
			Loading...
		</p>
	{:then result}
		<BazaarListings market={result} {sortField} {sortOrder} />
	{:catch error}
		<div class={styles.error}>
			Failed to load bazaar prices: {readableErrorMessage(error)}
		</div>
	{/await}
</div>
