<script lang="ts">
	import type {TornV1Stock} from "@common/utils/functions/api-v1.types";
	import { formatNumber } from "@common/utils/functions/formatting";
	import {
		getRequiredStocks,
		getRewardValue,
		getStockIncrement,
		getStockReward,
	} from "@common/utils/functions/torn";
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@svelte/components/ui/table";
	import type { UserStock } from "tornapi-typescript";

	const { stock, userStock }: { stock: TornV1Stock; userStock: UserStock | null } = $props();

	const ownedLevel = $derived(userStock ? getStockIncrement(stock.benefit.requirement, userStock.shares) : 0);
	const activeLevel = $derived(userStock?.bonus?.increment ?? 0);
	const rewardValue = $derived(getRewardValue(stock.benefit.description));
	const yearlyValue = $derived((rewardValue / stock.benefit.frequency) * 365);
</script>

<Table class="text-xs leading-tight">
	<TableHeader>
		<TableRow>
			<TableHead class="h-5 p-1">Incr.</TableHead>
			<TableHead class="h-5 p-1">Stocks</TableHead>
			<TableHead class="h-5 p-1">Cost</TableHead>
			<TableHead class="h-5 p-1">Reward</TableHead>
			<TableHead class="h-5 p-1">ROI</TableHead>
		</TableRow>
	</TableHeader>
	<TableBody>
		{#each [1, 2, 3, 4, 5] as level (level)}
			{@const stocks = getRequiredStocks(stock.benefit.requirement, level)}
			{@const previousStocks = getRequiredStocks(stock.benefit.requirement, level - 1)}
			{@const roi = (yearlyValue / ((stocks - previousStocks) * stock.current_price)) * 100}
			<TableRow class={level <= activeLevel ? "text-primary" : level <= ownedLevel ? "text-amber-600" : ""}>
				<TableCell class="p-1">{level}</TableCell>
				<TableCell class="p-1">{formatNumber(stocks)}</TableCell>
				<TableCell class="p-1">{formatNumber(stocks * stock.current_price, { currency: true })}</TableCell>
				<TableCell class="p-1">{getStockReward(stock.benefit.description, level)}</TableCell>
				<TableCell class="p-1">{rewardValue > 0 ? `${formatNumber(roi, { decimals: 1 })}%` : "N/A"}</TableCell>
			</TableRow>
		{/each}
	</TableBody>
</Table>
