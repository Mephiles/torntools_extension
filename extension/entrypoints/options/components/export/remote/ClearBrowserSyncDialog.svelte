<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Dialog from "@svelte/components/ui/dialog";

	interface ClearBrowserSyncDialogProps {
		dialogOpen: boolean;
		onConfirm: () => Promise<void>;
	}

	let { dialogOpen = $bindable(false), onConfirm }: ClearBrowserSyncDialogProps = $props();

	async function confirm() {
		await onConfirm();
		dialogOpen = false;
	}
</script>

<Dialog.Dialog bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Clear</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to clear the remote storage?
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<Button size="sm" variant="destructive" onclick={confirm}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>