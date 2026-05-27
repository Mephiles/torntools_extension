<script lang="ts">
	import type { UserStock } from "tornapi-typescript";
	import RoiTable from "@/entrypoints/popup/components/stocks/RoiTable.svelte";
	import type { TornV1Stock } from "@/utils/common/functions/api-v1.types";
	import { formatNumber } from "@/utils/common/functions/formatting";
	import { isDividendStock } from "@/utils/common/functions/torn";

	interface BenefitsInformationProps {
		stock: TornV1Stock;
		userStock: UserStock | null;
	}
	const { stock, userStock }: BenefitsInformationProps = $props();

	type BenefitStatus = "completed" | "awaiting" | "not-completed";

	function getNonDividendBenefitState(userStock: UserStock | null, frequency: number): { status: BenefitStatus; duration?: string } {
		if (userStock?.bonus.increment !== null) {
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

	const nonDividendBenefit = $derived(getNonDividendBenefitState(userStock, stock.benefit.frequency));
	const nonDividendDescriptionClass = $derived(getDescriptionClass(nonDividendBenefit.status));
</script>

<div class="space-y-1 rounded-md bg-muted p-2">
	{#if isDividendStock(stock.stock_id)}
		<div>
			{#if userStock?.bonus}
				{
					userStock.bonus.available ?
							"Ready now!" :
							`Available in ${stock.benefit.frequency - userStock.bonus.progress}/${stock.benefit.frequency} days.`
				}
			{:else}
				Available every {stock.benefit.frequency} days.
			{/if}
		</div>
		<RoiTable stock={stock} userStock={userStock} />
	{:else}
		<div>Required stocks: {formatNumber(userStock?.shares ?? stock.benefit.requirement)}{userStock ? `/${formatNumber(stock.benefit.requirement)}` : ""}</div>
		<div>
			<span class={nonDividendDescriptionClass}>{stock.benefit.description}</span>
			{#if nonDividendBenefit.duration}
				<span class="ml-1 text-muted-foreground">{nonDividendBenefit.duration}</span>
			{/if}
		</div>
	{/if}
</div>
