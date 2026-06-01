<script lang="ts">
	import type { CalculatorItem } from "@extension/entrypoints/popup/components/calculator/calculator";
	import { Button } from "@svelte/components/ui/button";
	import { Card, CardContent } from "@svelte/components/ui/card";
	import { Separator } from "@svelte/components/ui/separator";
	import { ttStorage } from "@utils/context";
	import { formatNumber } from "@utils/functions/formatting";
	import type { TornItem } from "tornapi-typescript";
	import { torndataStore } from "../../stores/database-store.svelte.js";


	interface ItemListProps {
		selectedItems: CalculatorItem[];
	}
	let { selectedItems = $bindable([]) }: ItemListProps = $props();

	const itemsMap = $derived<Record<string, TornItem>>($torndataStore?.itemsMap ?? {});
	const total = $derived(selectedItems.reduce((sum, item) => sum + (itemsMap[item.id]?.value?.market_price ?? 0) * item.amount, 0));

	async function clearItems() {
		selectedItems = [];
		await ttStorage.change({ localdata: { popup: { calculatorItems: [] } } });
	}
</script>

<Card size="sm" class="rounded-lg mx-1">
	<CardContent class="space-y-2 text-xs">
		{#each selectedItems as item (item.id)}
			{@const tornItem = itemsMap[item.id]}
			{#if tornItem}
				<div class="grid grid-cols-[64px_1fr_auto] gap-1">
					<span>{formatNumber(item.amount)}x</span>
					<span class="truncate">{tornItem.name}</span>
					<span>{formatNumber(item.amount * tornItem.value.market_price, { currency: true })}</span>
				</div>
			{/if}
		{:else}
			<div class="text-muted-foreground">No items selected.</div>
		{/each}

		{#if selectedItems.length}
			<Separator />
			<div class="flex justify-between gap-1">
				<Button size="sm" variant="outline" class="h-6" onclick={clearItems}>Clear</Button>
				<div class="text-right font-bold">Total: {formatNumber(total, { currency: true })}</div>
			</div>
		{/if}
	</CardContent>
</Card>
