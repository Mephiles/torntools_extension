<script lang="ts">
	import { formatNumber } from "@common/utils/functions/formatting";
	import { isDividendStock } from "@common/utils/functions/torn";
	import RoiTable from "@extension/entrypoints/popup/components/stocks/RoiTable.svelte";
	import type { TornStock, UserStock } from "tornapi-typescript";

	interface BenefitsInformationProps {
		stock: TornStock;
		userStock: UserStock | null;
	}
	const { stock, userStock }: BenefitsInformationProps = $props();

	type BenefitStatus = "completed" | "awaiting" | "not-completed";

	function getNonDividendBenefitState(userStock: UserStock | null, frequency: number): { status: BenefitStatus; duration?: string } {
		if (userStock?.bonus?.increment) {
			if (userStock.bonus.available) return { status: "completed" };
			return { status: "awaiting", duration: `in ${userStock.bonus.progress}/${frequency} days.` };
		}

		return { status: "not-completed", duration: `after ${frequency} days.` };
	}

	function getDescriptionClass(status: BenefitStatus) {
		if (status === "completed") return "text-primary";
		else if (status === "awaiting") return "text-amber-600 dark:text-amber-400";
		else return "text-destructive";
	}

	const nonDividendBenefit = $derived(getNonDividendBenefitState(userStock, stock.bonus.frequency));
	const nonDividendDescriptionClass = $derived(getDescriptionClass(nonDividendBenefit.status));
</script>

<div class="space-y-1 rounded-md bg-muted p-2">
	{#if isDividendStock(stock.id)}
		<div>
			{#if userStock?.bonus}
				{
					userStock.bonus.available ?
							"Ready now!" :
							`Available in ${stock.bonus.frequency - userStock.bonus.progress}/${stock.bonus.frequency} days.`
				}
			{:else}
				Available every {stock.bonus.frequency} days.
			{/if}
		</div>
		<RoiTable {stock} {userStock} />
	{:else}
		<div>Required stocks: {formatNumber(userStock?.shares ?? stock.bonus.requirement)}{userStock ? `/${formatNumber(stock.bonus.requirement)}` : ""}</div>
		<div>
			<span class={nonDividendDescriptionClass}>{stock.bonus.description}</span>
			{#if nonDividendBenefit.duration}
				<span class="text-muted-foreground">{nonDividendBenefit.duration}</span>
			{/if}
		</div>
	{/if}
</div>
