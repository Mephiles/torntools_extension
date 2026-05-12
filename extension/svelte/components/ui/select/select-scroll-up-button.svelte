<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "@svelte/utils.js";
	import { Select as SelectPrimitive } from "bits-ui";
	import CaretUpIcon from 'phosphor-svelte/lib/CaretUp';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
	bind:ref
	data-slot="select-scroll-up-button"
	class={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full", className)}
	{...restProps}
>
	<CaretUpIcon  />
</SelectPrimitive.ScrollUpButton>
