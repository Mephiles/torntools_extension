<script lang="ts">
	import { Button } from "@svelte/components/ui/button";

	type ForceTarget = "userdata" | "torndata" | "stocks" | "factiondata";
	type MaintenanceAction = ForceTarget | "reinitialize-timers" | "clear-cache";

	let {
		busyAction,
		onAction,
	}: {
		busyAction: MaintenanceAction | null;
		onAction: (action: MaintenanceAction) => void | Promise<void>;
	} = $props();

	const actions: {
		action: MaintenanceAction;
		label: string;
		description?: string;
		variant?: "outline" | "destructive";
	}[] = [
		{
			action: "userdata",
			label: "Force userdata",
		},
		{
			action: "torndata",
			label: "Force torndata",
		},
		{
			action: "stocks",
			label: "Force stocks",
		},
		{
			action: "factiondata",
			label: "Force factiondata",
		},
		{
			action: "reinitialize-timers",
			label: "Reinitialize timers",
			variant: "outline",
		},
		{
			action: "clear-cache",
			label: "Clear cache",
			variant: "destructive",
		},
	];
</script>

<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
	<h2 class="text-xl font-bold">Maintenance</h2>
	<p class="mt-2 text-sm text-muted-foreground">
		Use these controls when debugging stale data, resetting background timers, or clearing cached responses.
	</p>

	<div class="mt-4 grid gap-4 md:grid-cols-2">
		{#each actions as item (item.action)}
			<div class="rounded-xl border border-border/70 p-4">
				<h3 class="text-base font-medium">{item.label}</h3>
				<p class="mt-2 text-sm text-muted-foreground">{item.description}</p>
				<div class="mt-4">
					<Button
						variant={item.variant}
						disabled={busyAction !== null}
						onclick={() => onAction(item.action)}
					>
						{busyAction === item.action ? "Working..." : item.label}
					</Button>
				</div>
			</div>
		{/each}
	</div>
</section>
