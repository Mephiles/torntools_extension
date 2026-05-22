<script lang="ts">
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";
	import ItemsSection from "./ItemsSection.svelte";
	import MarketsSection from "./MarketsSection.svelte";
	import MoneySection from "./MoneySection.svelte";

	interface FinancialGroupProps {
		sectionId?: string;
	}

	let { sectionId }: FinancialGroupProps = $props();
</script>

{#if sectionId === "money"}
	<MoneySection />
{:else if sectionId === "markets"}
	<MarketsSection />
{:else if sectionId === "items"}
	<ItemsSection />
{:else}
	<SectionNotFound />
{/if}
