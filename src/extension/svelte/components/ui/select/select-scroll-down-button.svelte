<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "@svelte/utils.js";
	import { Select as SelectPrimitive } from "bits-ui";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDown";

	let { ref = $bindable(null), class: className, ...restProps }: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> = $props();
</script>

<SelectPrimitive.ScrollDownButton
	bind:ref
	data-slot="select-scroll-down-button"
	class={cn("bg-popover bottom-0 z-10 flex w-full cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)}
	{...restProps}
>
	<CaretDownIcon />
</SelectPrimitive.ScrollDownButton>
