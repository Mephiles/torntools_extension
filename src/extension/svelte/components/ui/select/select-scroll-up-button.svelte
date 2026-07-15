<script lang="ts">
	import { cn, type WithoutChildrenOrChild } from "@svelte/utils.js";
	import { Select as SelectPrimitive } from "bits-ui";
	import CaretUpIcon from "phosphor-svelte/lib/CaretUp";

	let { ref = $bindable(null), class: className, ...restProps }: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
	bind:ref
	data-slot="select-scroll-up-button"
	class={cn("bg-popover top-0 z-10 flex w-full cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4", className)}
	{...restProps}
>
	<CaretUpIcon />
</SelectPrimitive.ScrollUpButton>
