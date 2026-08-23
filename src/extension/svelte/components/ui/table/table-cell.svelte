<script lang="ts">
	import { cn } from "@svelte/utils.js";
	import type { WithElementRef } from "@svelte/utils.js";
	import type { HTMLTdAttributes } from "svelte/elements";

	let { ref = $bindable(null), class: className, children, ...restProps }: WithElementRef<HTMLTdAttributes> = $props();
</script>

<td bind:this={ref} data-slot="table-cell" class={cn("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0", className)} {...restProps}>
	{@render children?.()}
</td>
