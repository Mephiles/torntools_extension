<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Checkbox } from "@svelte/components/ui/checkbox";
	import * as Dialog from "@svelte/components/ui/dialog";
	import type { Snippet } from "svelte";

	let {
		dialogOpen = $bindable(false),
		allowApi,
		includeApi = $bindable(false),
		onConfirm,
		warning,
	}: {
		dialogOpen: boolean;
		allowApi: boolean;
		includeApi: boolean;
		onConfirm: () => (Promise<void> | void);
		warning?: Snippet;
	} = $props();
</script>

<Dialog.Dialog bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Export</Dialog.Title>
			<Dialog.Description>
				Review what will be included before creating the export.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-3">
			<div class="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm">
				<h3 class="font-medium">Includes:</h3>
				<ul class="mt-2 list-disc space-y-0.5 pl-5 text-muted-foreground">
					<li>User ID and username</li>
					<li>Client version and database size</li>
					<li>Export date and time</li>
					<li>Version notice</li>
					<li>Preferences</li>
					<li>Filters and sorting</li>
					<li>Stakeouts, notes and quick items</li>
				</ul>
			</div>

			{@render warning?.()}

			{#if allowApi}
				<label class="flex items-start gap-2 rounded-lg border border-border/70 p-2 text-sm">
					<Checkbox bind:checked={includeApi} id="include-api" />
					<span>
						<span class="block font-medium">Include API key</span>
					</span>
				</label>
			{/if}
		</div>

		<Dialog.Footer>
			<Button size="sm" onclick={onConfirm}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
