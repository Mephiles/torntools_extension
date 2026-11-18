<script lang="ts">
	import Container from "@common/utils/components/container/container.svelte";
	import Table from "@common/utils/components/table/table.svelte";
	import type { TableColumn } from "@common/utils/components/table/table.types";
	import { ITEM_RESOLVER, ttStorage } from "@common/utils/context";
	import { ttCache } from "@common/utils/data/cache";
	import { filters } from "@common/utils/data/database";
	import { fetchData } from "@common/utils/functions/api-fetcher";
	import { formatNumber, formatTime } from "@common/utils/functions/formatting";
	import { readableErrorMessage, TO_MILLIS } from "@common/utils/functions/utilities";
	import type { OwnedItem, PriceMode, ValueResult, ValueRow } from "@features/category-value-calculator/category-value-calculation";
	import { calculateCategoryValues } from "@features/category-value-calculator/category-value-calculation";
	import CategoryValueCalculatorControls from "@features/category-value-calculator/category-value-calculator-controls.svelte";
	import type { UserInventoryItem, UserInventoryResponse } from "tornapi-typescript";
	import styles from "./category-value-calculator.module.css";

	interface CategoryValueCalculatorBoxProps {
		defaultCategory: string;
	}

	const CACHE_SECTION = "category-value-calculator";
	const CACHE_LIFETIME = TO_MILLIS.MINUTES * 15;
	const PAGE_SIZE = 100;

	interface CachedInventory {
		items: UserInventoryItem[];
		timestamp: number;
	}

	const columns: TableColumn<ValueRow>[] = [
		{ id: "name", title: "Item", width: 220 },
		{ id: "quantity", title: "Quantity", width: 80 },
		{ id: "price", title: "Applied price", width: 130 },
		{ id: "total", title: "Total", width: 130 },
	];

	let { defaultCategory }: CategoryValueCalculatorBoxProps = $props();

	const stored = filters.items.categoryValueCalculator;

	function initialCategory(): string {
		return stored.category || defaultCategory;
	}

	let category = $state<string>(initialCategory());
	let mode = $state<PriceMode>(stored.mode === "market" || stored.mode === "sell" ? stored.mode : "combo");
	let loading = $state(false);
	let error = $state<string>();
	let result = $state<ValueResult>();
	let dataTimestamp = $state<number>();

	$effect(() => {
		const selection = { category, mode };
		if (selection.category === stored.category && selection.mode === stored.mode) return;

		void ttStorage.change({ filters: { items: { categoryValueCalculator: selection } } });
	});

	function resolveItemValues(id: number) {
		const item = ITEM_RESOLVER.getFullItem(id);
		if (!item) return null;

		return {
			image: item.image,
			marketValue: item.value.market_price ?? null,
			sellPrice: item.value.sell_price ?? null,
		};
	}

	async function fetchInventory(itemCategory: string): Promise<CachedInventory> {
		const cached = ttCache.get<CachedInventory>(CACHE_SECTION, itemCategory);
		if (cached) return cached;

		const items: UserInventoryItem[] = [];
		let timestamp = 0;
		while (true) {
			const response = await fetchData<UserInventoryResponse>("tornv2", {
				section: "user",
				id: "inventory",
				params: { cat: itemCategory, offset: items.length, limit: PAGE_SIZE },
			});

			items.push(...response.inventory.items);
			timestamp = timestamp || response.inventory.timestamp;
			if (response.inventory.items.length < PAGE_SIZE || items.length >= (response._metadata?.total ?? items.length)) break;
		}

		// Torn caches the selection for 15 minutes from the timestamp it returns.
		const ttl = timestamp * TO_MILLIS.SECONDS + CACHE_LIFETIME - Date.now();
		if (ttl > 0) ttCache.set({ [itemCategory]: { items, timestamp } }, ttl, CACHE_SECTION);

		return { items, timestamp };
	}

	async function calculate() {
		loading = true;
		error = undefined;

		try {
			const inventory = await fetchInventory(category);
			const ownedItems: OwnedItem[] = inventory.items
				.filter((item) => !item.faction_owned)
				.map((item) => ({ id: item.id, name: item.name, amount: item.amount }));

			dataTimestamp = inventory.timestamp;
			result = calculateCategoryValues(ownedItems, resolveItemValues, mode);
		} catch (caught) {
			result = undefined;
			dataTimestamp = undefined;
			error = readableErrorMessage(caught);
		} finally {
			loading = false;
		}
	}
</script>

{#snippet nameCell(value: string, row: ValueRow)}
	<span class={styles.item}>
		{#if row.image}
			<img class={styles.itemIcon} src={row.image} alt="" />
		{/if}
		{value}
	</span>
{/snippet}

{#snippet priceCell(value: number, row: ValueRow)}
	{formatNumber(value, { currency: true })}
	{#if mode === "combo" && row.source}
		<span class={styles.priceSource} title={row.source === "market" ? "Market value" : "Sell value"}>{row.source === "market" ? "M" : "S"}</span>
	{/if}
{/snippet}

{#snippet totalCell(value: number)}
	{formatNumber(value, { currency: true })}
{/snippet}

<Container title="Category Value Calculator" class="mb10">
	<div class={styles.calculator}>
		<CategoryValueCalculatorControls bind:category bind:mode {loading} onCalculate={calculate} />

		{#if error}
			<div class={styles.error}>{error}</div>
		{/if}

		{#if result}
			{#if dataTimestamp}
				<div class={styles.updated}>Updated {formatTime(dataTimestamp * TO_MILLIS.SECONDS, { type: "ago" })}</div>
			{/if}

			{#if result.rows.length === 0}
				<div class={styles.message}>No items found in this category.</div>
			{:else}
				<Table
					{columns}
					data={result.rows}
					stretchColumns
					compact
					cells={{ name: nameCell, price: priceCell, total: totalCell }}
					summary={{
						name: "Total",
						quantity: result.totalQuantity,
						price: "",
						total: formatNumber(result.totalValue, { currency: true }),
					}}
				/>

				{#if result.unpriced.length > 0}
					<div class={styles.warning}>No price found for: {result.unpriced.join(", ")}</div>
				{/if}
			{/if}
		{/if}
	</div>
</Container>
