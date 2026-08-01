<script lang="ts">
	import { formatNumber } from "@common/utils/functions/formatting";
	import * as Table from "@svelte/components/ui/table";

	interface MarketPriceProps {
		title: string;
		href?: string;
		listings: { amount: number; price: number }[];
	}
	const { title, href, listings }: MarketPriceProps = $props();
</script>

<section class="space-y-1">
	<h2 class="text-xs font-bold">
		{#if href}
			<a class="hover:underline" {href} target="_blank" rel="noreferrer">{title}</a>
		{:else}
			{title}
		{/if}
	</h2>

	<Table.Root>
		<Table.Body>
			{#each listings as listing, index (index)}
				<Table.Row>
					<Table.Cell class="p-1">{formatNumber(listing.amount)}x</Table.Cell>
					<Table.Cell class="p-1 text-right font-medium">{formatNumber(listing.price, { currency: true })}</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={2} class="text-muted-foreground p-1 text-center">No listings found.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>
