<script lang="ts">
	import { Separator } from "@svelte/components/ui/separator/index.js";
	import { cn } from "@svelte/utils.js";
	import type { Separator as SeparatorPrimitive } from "bits-ui";

	let { ref = $bindable(null), class: className, ...restProps }: SeparatorPrimitive.RootProps = $props();
</script>

<Separator bind:ref data-slot="select-separator" class={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)} {...restProps} />
