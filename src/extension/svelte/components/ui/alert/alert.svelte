<script lang="ts">
	import { alertVariants } from "@svelte/components/ui/alert/helper";
	import type { AlertVariant } from "@svelte/components/ui/alert/helper";
	import { cn } from "@svelte/utils.js";
	import type { WithElementRef } from "@svelte/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div bind:this={ref} data-slot="alert" role="alert" class={cn(alertVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</div>
