<script lang="ts">
	import StockSearch from "@extension/entrypoints/popup/components/stocks/StockSearch.svelte";
	import StocksTable from "@extension/entrypoints/popup/components/stocks/StocksTable.svelte";
	import type { StocksSortMode } from "@extension/entrypoints/popup/components/stocks/StocksTable.svelte";

	let query = $state("");
	let sortMode = $state<StocksSortMode>("default");
</script>

<div class="space-y-2">
	<StockSearch bind:query bind:sortMode />

	<StocksTable {query} {sortMode} />
</div>
