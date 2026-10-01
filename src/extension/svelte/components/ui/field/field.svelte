<script lang="ts">
	import { fieldVariants } from "@svelte/components/ui/field/helper.ts";
	import type { FieldOrientation } from "@svelte/components/ui/field/helper.ts";
	import { cn } from "@svelte/utils.js";
	import type { WithElementRef } from "@svelte/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		orientation = "vertical",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		orientation?: FieldOrientation;
	} = $props();
</script>

<div bind:this={ref} role="group" data-slot="field" data-orientation={orientation} class={cn(fieldVariants({ orientation }), className)} {...restProps}>
	{@render children?.()}
</div>
