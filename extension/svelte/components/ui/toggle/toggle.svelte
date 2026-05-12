<script lang="ts">
	import { ToggleSize, ToggleVariant, toggleVariants } from "@svelte/components/ui/toggle/helper";
	import { cn } from "@svelte/utils.js";
	import { Toggle as TogglePrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		pressed = $bindable(false),
		class: className,
		size = "default",
		variant = "default",
		...restProps
	}: TogglePrimitive.RootProps & {
		variant?: ToggleVariant;
		size?: ToggleSize;
	} = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	bind:pressed
	data-slot="toggle"
	class={cn(toggleVariants({ variant, size }), className)}
	{...restProps}
/>
