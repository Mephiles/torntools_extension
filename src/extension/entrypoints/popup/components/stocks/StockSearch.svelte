<script lang="ts">
	import type { StocksSortMode } from "@extension/entrypoints/popup/components/stocks/StocksTable.svelte";
	import * as InputGroup from "@svelte/components/ui/input-group/index.js";
	import * as Select from "@svelte/components/ui/select";
	import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";

	interface StockSearchProps {
		query: string;
		sortMode: StocksSortMode;
	}
	let { query = $bindable(""), sortMode = $bindable<StocksSortMode>("default") }: StockSearchProps = $props();

	const sortItems = [
		{ value: "default" as const, label: "Default" },
		{ value: "costToNext" as const, label: "Next BB" },
	];
	const sortLabel = $derived(sortItems.find((item) => item.value === sortMode)?.label ?? "Default");
</script>

<div class="flex items-center gap-1 p-1 pb-0">
	<InputGroup.Root class="bg-input/30 border-input/30 min-w-0 flex-1">
		<InputGroup.Input bind:value={query} placeholder="Search stocks..." class="text-sm" />
		<InputGroup.Addon>
			<MagnifyingGlassIcon class="size-4 opacity-50" />
		</InputGroup.Addon>
	</InputGroup.Root>

	<Select.Root
		type="single"
		value={sortMode}
		onValueChange={(value) => {
			if (value === "default" || value === "costToNext") sortMode = value;
		}}
	>
		<Select.Trigger size="sm" class="w-[8.5rem] shrink-0 text-xs">
			{sortLabel}
		</Select.Trigger>
		<Select.Content>
			{#each sortItems as item (item.value)}
				<Select.Item value={item.value} label={item.label}>{item.label}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
