<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
	import CaretRightIcon from "phosphor-svelte/lib/CaretRightIcon";
	import type {Snippet} from "svelte";

	interface StockSectionProps {
		label: string;
		children: Snippet;
	}
	let { label, children }: StockSectionProps = $props();

	let isOpen = $state(false);
</script>

<Button variant="ghost" size="sm" class="h-7 w-full justify-between px-2" onclick={() => isOpen = !isOpen}>
	{label}
	{#if isOpen}
		<CaretDownIcon size={14} />
	{:else}
		<CaretRightIcon size={14} />
	{/if}
</Button>

{#if isOpen}
	{@render children()}
{/if}