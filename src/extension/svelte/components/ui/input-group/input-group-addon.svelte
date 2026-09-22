<script lang="ts">
	import { inputGroupAddonVariants } from "@svelte/components/ui/input-group/addon-helper.ts";
	import type { InputGroupAddonAlign } from "@svelte/components/ui/input-group/addon-helper.ts";
	import { cn } from "@svelte/utils.js";
	import type { WithElementRef } from "@svelte/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		align = "inline-start",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		align?: InputGroupAddonAlign;
	} = $props();
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="input-group-addon"
	data-align={align}
	class={cn(inputGroupAddonVariants({ align }), className)}
	onclick={(e) => {
		if ((e.target as HTMLElement).closest("button")) {
			return;
		}
		e.currentTarget.parentElement?.querySelector("input")?.focus();
	}}
	{...restProps}
>
	{@render children?.()}
</div>
