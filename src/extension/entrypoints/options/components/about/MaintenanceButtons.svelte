<script lang="ts">
	import { apiStore } from "../../stores/database-store.svelte";
	import MaintenanceActionCard from "./MaintenanceActionButton.svelte";

	const hasApiKey = $derived(!!$apiStore?.torn?.key);
</script>

<section class="border-border bg-card rounded-lg border px-3 py-2">
	<h2 class="text-lg font-bold">Maintenance</h2>

	<div class="mt-2 grid gap-4 lg:grid-cols-[1fr_1fr]">
		<section class="space-y-2">
			<h3 class="text-sm font-bold">Force update</h3>

			{#if hasApiKey}
				<div class="grid gap-2 sm:grid-cols-2">
					<MaintenanceActionCard action="userdata" label="Userdata" />
					<MaintenanceActionCard action="torndata" label="Torndata" />
					<MaintenanceActionCard action="stocks" label="Stocks" />
					<MaintenanceActionCard action="factiondata" label="Factiondata" />
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">Forced data fetched are not relevant without an API key configured.</p>
			{/if}
		</section>

		<section class="space-y-2">
			<h3 class="text-sm font-bold">Clear data</h3>
			<div class="grid gap-2 sm:grid-cols-2">
				<MaintenanceActionCard action="clear-userdata" label="Clear userdata" variant="destructive" />
				<MaintenanceActionCard action="clear-torndata" label="Clear torndata" variant="destructive" />
				<MaintenanceActionCard action="clear-stocks" label="Clear stocks" variant="destructive" />
				<MaintenanceActionCard action="clear-factiondata" label="Clear factiondata" variant="destructive" />
				<MaintenanceActionCard action="clear-cache" label="Clear cache" variant="destructive" />
			</div>
		</section>

		<section class="space-y-2">
			<h3 class="text-sm font-bold">Other</h3>
			<div class="grid gap-2">
				<MaintenanceActionCard action="reinitialize-timers" label="Reinitialize timers" variant="outline" />
			</div>
		</section>
	</div>
</section>
