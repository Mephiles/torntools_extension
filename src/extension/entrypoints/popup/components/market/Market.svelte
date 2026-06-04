<script lang="ts">
	import ItemSearch from "@extension/entrypoints/popup/components/market/ItemSearch.svelte";
	import SearchResult from "@extension/entrypoints/popup/components/market/SearchResult.svelte";
	import type { TornItem } from "tornapi-typescript";

	let selectedItem = $state<TornItem | null>(null);
</script>

<div class="space-y-2">
	<ItemSearch bind:selectedItem/>

	<SearchResult {selectedItem} />
</div>
