<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "@svelte/utils.js";
	import { Select as SelectPrimitive } from "bits-ui";
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDown';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
	bind:ref
	data-slot="select-scroll-down-button"
	class={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full", className)}
	{...restProps}
>
	<CaretDownIcon  />
</SelectPrimitive.ScrollDownButton>
