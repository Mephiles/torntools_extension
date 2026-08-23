<script lang="ts">
	import { cn } from "@svelte/utils.js";
	import type { WithoutChild } from "@svelte/utils.js";
	import { Accordion as AccordionPrimitive } from "bits-ui";
	import CaretDownIcon from "phosphor-svelte/lib/CaretDown";
	import CaretUpIcon from "phosphor-svelte/lib/CaretUp";

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps["level"];
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			"focus-visible:ring-ring/50 focus-visible:border-ring focus-visible:after:border-ring **:data-[slot=accordion-trigger-icon]:text-muted-foreground group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
		<CaretDownIcon
			data-slot="accordion-trigger-icon"
			class="cn-accordion-trigger-icon pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
		/>
		<CaretUpIcon
			data-slot="accordion-trigger-icon"
			class="cn-accordion-trigger-icon pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
		/>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
