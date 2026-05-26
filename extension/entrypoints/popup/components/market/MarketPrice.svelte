<script lang="ts">
	import * as Table from "@svelte/components/ui/table";
	import { formatNumber } from "@/utils/common/functions/formatting";

	interface MarketPriceProps {
		title: string;
		listings: { amount: number, price: number }[];
	}
	const { title, listings }: MarketPriceProps = $props();
</script>

<section class="space-y-1">
	<h2 class="text-xs font-bold">{title}</h2>

	<Table.Root>
		<Table.Body>
			{#each listings as listing, index (index)}
				<Table.Row>
					<Table.Cell class="p-1">{formatNumber(listing.amount)}x</Table.Cell>
					<Table.Cell class="p-1 text-right font-medium">{formatNumber(listing.price, { currency: true })}</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={2} class="p-1 text-center text-muted-foreground">No listings found.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>
