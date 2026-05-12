<script lang="ts">
	import {
		type ButtonSize,
		type ButtonVariant,
		buttonVariants,
	} from "@svelte/components/ui/button/index.js";
	import { cn } from "@svelte/utils.js";
	import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

	let {
		ref = $bindable(null),
		class: className,
		variant = "outline",
		size = "default",
		...restProps
	}: AlertDialogPrimitive.CancelProps & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	} = $props();
</script>

<AlertDialogPrimitive.Cancel
	bind:ref
	data-slot="alert-dialog-cancel"
	class={cn(buttonVariants({ variant, size }), "cn-alert-dialog-cancel", className)}
	{...restProps}
/>
