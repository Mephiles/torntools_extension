<script lang="ts">
	import StockSearch from "@extension/entrypoints/popup/components/stocks/StockSearch.svelte";
	import StocksTable from "@extension/entrypoints/popup/components/stocks/StocksTable.svelte";

	let query = $state("");
</script>

<div class="space-y-2">
	<StockSearch bind:query={query} />

	<StocksTable {query} />
</div>
