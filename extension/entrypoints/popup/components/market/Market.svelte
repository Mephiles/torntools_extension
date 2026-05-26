<script lang="ts">
	import type { TornItem } from "tornapi-typescript";
	import ItemSearch from "@/entrypoints/popup/components/market/ItemSearch.svelte";
	import SearchResult from "@/entrypoints/popup/components/market/SearchResult.svelte";

	let selectedItem = $state<TornItem | null>(null);
</script>

<div class="space-y-2">
	<ItemSearch bind:selectedItem/>

	<SearchResult {selectedItem} />
</div>
