<script lang="ts">
	import type { CalculatorItem } from "@extension/entrypoints/popup/components/calculator/calculator";
	import CalculatorInput from "@extension/entrypoints/popup/components/calculator/CalculatorInput.svelte";
	import ItemList from "@extension/entrypoints/popup/components/calculator/ItemList.svelte";
	import { localdataStore } from "../../stores/database-store.svelte";

	let selectedItems = $state<CalculatorItem[]>([]);

	$effect(() => {
		selectedItems = [...($localdataStore?.popup?.calculatorItems ?? [])];
	});
</script>

<div class="min-h-72 space-y-2">
	<CalculatorInput bind:selectedItems />

	<ItemList bind:selectedItems />
</div>
