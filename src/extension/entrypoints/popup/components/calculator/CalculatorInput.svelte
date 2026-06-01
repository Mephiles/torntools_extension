<script lang="ts">
	import type { CalculatorItem } from "@extension/entrypoints/popup/components/calculator/calculator";
	import * as Command from "@svelte/components/ui/command";
	import { Input } from "@svelte/components/ui/input";
	import { ttStorage } from "@utils/context";
	import { isHTMLElement } from "@utils/functions/dom";
	import { onMount } from "svelte";
	import type { TornItem } from "tornapi-typescript";
	import { torndataStore } from "../../stores/database-store.svelte.js";

	interface CalculatorInputProps {
		selectedItems: CalculatorItem[];
	}
	let { selectedItems = $bindable() }: CalculatorInputProps = $props();

	let query = $state("");
	let commandRef = $state<HTMLElement | null>(null);

	const items = $derived(($torndataStore?.items ?? []) as TornItem[]);
	const matches = $derived(getMatches(items, query));
	const listOpen = $derived(!!query.trim());

	onMount(() => {
		function handlePointerDown(event: PointerEvent) {
			if (!isHTMLElement(event.target) || commandRef?.contains(event.target)) return;

			query = "";
		}

		document.addEventListener("pointerdown", handlePointerDown);
		return () => document.removeEventListener("pointerdown", handlePointerDown);
	});

	function getMatches(sourceItems: TornItem[], search: string) {
		const keyword = search.trim().toLowerCase();
		if (!keyword) return [];

		const id = Number.parseInt(keyword, 10);
		return sourceItems
			.filter((item) => item.name.toLowerCase().includes(keyword) || (!Number.isNaN(id) && item.id === id))
			.slice(0, 30);
	}

	async function setAmount(id: string, amount: number) {
		const nextItems = selectedItems.filter((item) => item.id !== id);
		if (amount > 0) nextItems.push({ id, amount });
		selectedItems = nextItems;
		await ttStorage.change({ localdata: { popup: { calculatorItems: selectedItems } } });
	}
</script>

<Command.Root bind:ref={commandRef} shouldFilter={false} class="relative h-auto overflow-visible rounded-md bg-transparent p-0">
	<Command.Input bind:value={query} placeholder="Search item ..." />

	{#if listOpen}
		<Command.List class="mt-1 max-h-52 w-full rounded-md bg-popover p-1 absolute top-full z-10">
			<Command.Empty class="p-2">No items found.</Command.Empty>
			<Command.Group class="p-0">
				{#each matches as item (item.id)}
					<Command.Item value={`${item.id}-${item.name}`} class="">
						<label class="truncate text-xs" for={`calculator-${item.id}`}>{item.name}</label>
						<Command.Shortcut class="w-20 tracking-normal">
							<Input
								id={`calculator-${item.id}`}
								type="number"
								min="0"
								class="h-7 text-xs"
								value={selectedItems.find((selected) => selected.id === item.id.toString())?.amount ?? ""}
								oninput={(event) => setAmount(item.id.toString(), Number.parseInt(event.currentTarget.value) || 0)}
							/>
						</Command.Shortcut>
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.List>
	{/if}
</Command.Root>
