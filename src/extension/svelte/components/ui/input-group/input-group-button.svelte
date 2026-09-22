<script lang="ts">
	import { Button } from "@svelte/components/ui/button/index.js";
	import { inputGroupButtonVariants } from "@svelte/components/ui/input-group/button-helper.ts";
	import type { InputGroupButtonSize } from "@svelte/components/ui/input-group/button-helper.ts";
	import { cn } from "@svelte/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		type = "button",
		variant = "ghost",
		size = "xs",
		...restProps
	}: Omit<ComponentProps<typeof Button>, "href" | "size"> & {
		size?: InputGroupButtonSize;
	} = $props();
</script>

<Button bind:ref {type} data-size={size} {variant} class={cn(inputGroupButtonVariants({ size }), className)} {...restProps}>
	{@render children?.()}
</Button>
