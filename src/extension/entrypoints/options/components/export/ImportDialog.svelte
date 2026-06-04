<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Dialog from "@svelte/components/ui/dialog";
	import type { Snippet } from "svelte";

	let {
		dialogOpen = $bindable(false),
		allowApi,
		onConfirm,
		extraInput,
	}: {
		dialogOpen: boolean;
		allowApi: boolean;
		onConfirm: () => Promise<void>;
		extraInput?: Snippet;
	} = $props();
</script>

<Dialog.Dialog bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Import</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3">
			{@render extraInput?.()}

			<div class="rounded-lg border border-border bg-muted/30 p-3 text-sm">
				<h3 class="font-medium">Following items will be overwritten:</h3>
				<ul class="mt-2 list-disc space-y-0.5 pl-5 text-muted-foreground">
					<li>Version notice</li>
					<li>Preferences</li>
					<li>Filters and sorting</li>
					<li>Stakeouts</li>
					<li>Notes</li>
					<li>Quick Items, crimes and jail bust / bail</li>
					{#if allowApi}
						<li>API Key (if present in the export)</li>
					{/if}
				</ul>
			</div>
		</div>

		<Dialog.Footer>
			<Button size="sm" onclick={onConfirm}>Import</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
