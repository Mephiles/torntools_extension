<script lang="ts">
	import { badgeVariants } from "@svelte/components/ui/badge/helper";
	import type { BadgeVariant } from "@svelte/components/ui/badge/helper";
	import { cn } from "@svelte/utils.js";
	import type { WithElementRef } from "@svelte/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element this={href ? "a" : "span"} bind:this={ref} data-slot="badge" {href} class={cn(badgeVariants({ variant }), className)} {...restProps}>
	{@render children?.()}
</svelte:element>
