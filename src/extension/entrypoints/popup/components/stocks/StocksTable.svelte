<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import type {DatabaseSettings, DatabaseStockdata, DatabaseUserdata} from "@common/utils/data/database";
	import type {TornV1Stock} from "@common/utils/functions/api-v1.types";
	import { applyPlural, dropDecimals, formatNumber } from "@common/utils/functions/formatting";
	import { getStockBoughtPrice } from "@common/utils/functions/torn";
	import BenefitInformation from "@extension/entrypoints/popup/components/stocks/BenefitInformation.svelte";
	import StockSection from "@extension/entrypoints/popup/components/stocks/StockSection.svelte";
	import { Card, CardContent, CardHeader, CardTitle } from "@svelte/components/ui/card";
	import { Input } from "@svelte/components/ui/input";
	import type { UserStock } from "tornapi-typescript";
	import { settingsStore, stockdataStore, userdataStore } from "../../stores/database-store.svelte";


	interface StocksTableProps {
		query: string;
	}
	const { query }: StocksTableProps = $props();

	const rows = $derived(getRows($stockdataStore, $userdataStore, $settingsStore, query));

	function getRows(stockdata: DatabaseStockdata, userdata: DatabaseUserdata, settings: DatabaseSettings, search: string) {
		const keyword = search.trim().toLowerCase();
		return Object.entries(stockdata ?? {})
			.filter(([id]) => id !== "date")
			.map(([id, stock]) => {
				if (typeof stock === "number") return null;
				const userStock = settings?.apiUsage?.user?.stocks ? ((userdata?.stocks ?? []).find((entry: UserStock) => entry.id === Number(id)) ?? null) : null;
				return { id: Number(id), stock, userStock };
			})
			.filter((row): row is { id: number; stock: TornV1Stock; userStock: UserStock | null } => !!row)
			.filter((row) => {
				if (!keyword) return !!row.userStock;
				return keyword === "*" || `${row.stock.name} (${row.stock.acronym})`.toLowerCase().includes(keyword);
			});
	}

	async function setAlert(stockId: number, key: "priceReaches" | "priceFalls", value: string) {
		await ttStorage.change({
			settings: {
				notifications: {
					types: { stocks: { [stockId]: { [key]: value ? Number.parseFloat(value) : 0 } } },
				},
			},
		});
	}

	function getProfit(stock: TornV1Stock, userStock: UserStock | null) {
		if (!userStock) return null;

		const boughtPrice = getStockBoughtPrice(userStock).boughtPrice;
		return {
			boughtPrice,
			value: dropDecimals((stock.current_price - boughtPrice) * userStock.shares),
		};
	}
</script>

<div class="space-y-2 mx-1">
	{#each rows as row (row.id)}
		{@const profit = getProfit(row.stock, row.userStock)}
		<Card size="sm" class="rounded-lg">
			<CardHeader>
				<CardTitle class="flex items-start justify-between gap-2 text-sm">
					<a class="truncate text-foreground hover:underline" href={`https://www.torn.com/stockexchange.php?stock=${row.stock.acronym}`} target="_blank" rel="noreferrer">
						{row.stock.name.length > 35 ? row.stock.acronym : row.stock.name}
					</a>
					{#if profit}
							<span class={profit.value > 0 ? "text-primary" : profit.value < 0 ? "text-destructive" : "text-muted-foreground"}>
								{profit.value > 0 ? "+" : profit.value < 0 ? "-" : ""}{formatNumber(Math.abs(profit.value), { currency: true })}
							</span>
					{/if}
				</CardTitle>
				{#if row.userStock}
					<div class="text-xs text-muted-foreground">({formatNumber(row.userStock.shares, { shorten: 2 })} share{applyPlural(row.userStock.shares)})</div>
				{/if}
			</CardHeader>
			<CardContent class="space-y-1 text-xs">
				<StockSection label="Price Information">
					<div class="grid grid-cols-2 gap-1 rounded-md bg-muted p-2">
						<span>Current price: {formatNumber(row.stock.current_price, { decimals: 2, currency: true })}</span>
						<span>Total shares: {formatNumber(row.stock.total_shares)}</span>
						{#if profit}
							<span>Bought at: {formatNumber(profit.boughtPrice, { decimals: 2, currency: true })}</span>
						{/if}
					</div>
				</StockSection>

				<StockSection label="Benefit Information">
					<BenefitInformation stock={row.stock} userStock={row.userStock} />
				</StockSection>

				<StockSection label="Alerts">
					<div class="grid grid-cols-[auto_1fr] items-center gap-2 rounded-md bg-muted p-2">
						<label for={`stock-${row.id}-reaches`}>Price reaches</label>
						<Input id={`stock-${row.id}-reaches`} type="number" min="0" class="h-7" value={$settingsStore?.notifications?.types?.stocks?.[row.id]?.priceReaches ?? ""} onchange={(event) => setAlert(row.id, "priceReaches", event.currentTarget.value)} />
						<label for={`stock-${row.id}-falls`}>Price falls to</label>
						<Input id={`stock-${row.id}-falls`} type="number" min="0" class="h-7" value={$settingsStore?.notifications?.types?.stocks?.[row.id]?.priceFalls ?? ""} onchange={(event) => setAlert(row.id, "priceFalls", event.currentTarget.value)} />
					</div>
				</StockSection>
			</CardContent>
		</Card>
	{:else}
		<div class="text-sm text-muted-foreground">No stocks found.</div>
	{/each}
</div>
