<script lang="ts">
	import * as Table from "@svelte/components/ui/table";
	import { formatNumber } from "@/utils/common/functions/formatting";

	type Listing = {
		amount: number;
		price: number;
	};

	let { listings }: { listings: Listing[] } = $props();
</script>

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
