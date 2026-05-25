<script lang="ts">
	import { apiStore } from "../../stores/database-store.svelte";
	import MaintenanceActionCard from "./MaintenanceActionButton.svelte";

	const hasApiKey = $derived(!!$apiStore?.torn?.key);
</script>

<section class="rounded-lg border border-border bg-card py-2 px-3">
	<h2 class="text-lg font-bold">Maintenance</h2>

	<div class="mt-2 grid gap-4 lg:grid-cols-[2fr_1fr]">
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
				<p class="text-sm text-muted-foreground">
					Data health checks are not relevant without an API key configured.
				</p>
			{/if}
		</section>

		<section class="space-y-2">
			<h3 class="text-sm font-bold">Other</h3>
			<div class="grid gap-2">
				<MaintenanceActionCard action="reinitialize-timers" label="Reinitialize timers" variant="outline"  />
				<MaintenanceActionCard action="clear-cache" label="Clear cache" variant="destructive" />
			</div>
		</section>
	</div>
</section>
