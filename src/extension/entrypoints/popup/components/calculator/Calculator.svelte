<script lang="ts">
	import CalculatorInput from "@extension/entrypoints/popup/components/calculator/CalculatorInput.svelte";
	import type { CalculatorItem } from "@extension/entrypoints/popup/components/calculator/calculator";
	import ItemList from "@extension/entrypoints/popup/components/calculator/ItemList.svelte";
	import { localdataStore } from "../../stores/database-store.svelte.js";

	let selectedItems = $state<CalculatorItem[]>([]);

	$effect(() => {
		selectedItems = [...($localdataStore?.popup?.calculatorItems ?? [])];
	});
</script>

<div class="space-y-2 min-h-72">
	<CalculatorInput bind:selectedItems={selectedItems} />

	<ItemList bind:selectedItems={selectedItems} />
</div>
