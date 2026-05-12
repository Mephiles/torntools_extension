<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Spinner } from "@svelte/components/ui/spinner";
	import { type MaintenanceAction, runMaintenanceAction } from "./maintenance";

	let {
		action,
		label,
		variant,
	}: {
		action: MaintenanceAction;
		label: string;
		variant?: "outline" | "destructive";
	} = $props();

	let isBusy = $state(false);

	async function handleClick() {
		if (isBusy) return;

		isBusy = true;
		try {
			await runMaintenanceAction(action);
		} finally {
			isBusy = false;
		}
	}
</script>

<Button
	type="button"
	{variant}
	disabled={isBusy}
	aria-busy={isBusy}
	class="relative w-full justify-center cursor-pointer"
	onclick={handleClick}
>
	<span class:invisible={isBusy}>
		{label}
	</span>

	{#if isBusy}
		<Spinner class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-label={`${label} in progress`} />
	{/if}
</Button>
