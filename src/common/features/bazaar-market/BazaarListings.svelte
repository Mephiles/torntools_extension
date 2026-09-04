<script lang="ts">
	import type { TornW3BResult } from "@common/utils/functions/api.types.ts";
	import { formatNumber, formatTime } from "@common/utils/functions/formatting";
	import type { SortField, SortOrder } from "./bazaar-listings.types.ts";
	import styles from "./bazaar-market.module.css";

	interface BazaarListingsProps {
		market: TornW3BResult;
		sortField: SortField;
		sortOrder: SortOrder;
	}

	let { market, sortField, sortOrder }: BazaarListingsProps = $props();

	let sortedListings = $derived(
		Array.from(market.listings).sort((a, b) => {
			let sortValueA: number;
			let sortValueB: number;

			if (sortField === "price") {
				sortValueA = a.price;
				sortValueB = b.price;
			} else if (sortField === "quantity") {
				sortValueA = a.quantity;
				sortValueB = b.quantity;
			} else {
				return 0;
			}

			if (sortOrder === "ASC") return sortValueA - sortValueB;
			else return sortValueB - sortValueA;
		}),
	);
	let totalItems = $derived(market.listings.reduce((total, listing) => total + listing.quantity, 0));
</script>

<div class={styles.listWrapper}>
	<div class={styles.list}>
		{#each sortedListings as listing (listing.player_id)}
			<a href="https://www.torn.com/bazaar.php?userId={listing.player_id}" target="_blank" rel="noopener noreferrer" class={styles.listing}>
				<span class={styles.playerName}>{listing.player_name}</span>

				<div class={styles.details}>
					<span class={styles.price}>{formatNumber(listing.price, { currency: true })}</span>
					<span class={styles.quantity}>x{formatNumber(listing.quantity)}</span>
				</div>
				<div class={styles.updatedAt}>{formatTime({ seconds: listing.last_checked }, { type: "ago", short: true })}</div>
			</a>
		{/each}
	</div>
</div>

<div class={styles.footer}>
	{market.listings.length} bazaars | {totalItems} items
</div>
