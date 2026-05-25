<script lang="ts">
	import * as AlertDialog from "@svelte/components/ui/alert-dialog";
	import { Button } from "@svelte/components/ui/button";

	interface ConfirmActionProps {
		title: string;
		description: string;
		onConfirm: () => void | Promise<void>;
	}

	let { title, description, onConfirm }: ConfirmActionProps = $props();
	let dialogOpen = $state(false);

	async function confirm() {
		await onConfirm();
		dialogOpen = false;
	}
</script>

<AlertDialog.Root bind:open={dialogOpen}>
	<Button variant="destructive" onclick={() => (dialogOpen = true)}>Reset</Button>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>{description}</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<Button variant="destructive" onclick={confirm}>Reset</Button>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
