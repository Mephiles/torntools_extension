<script lang="ts">
	import {
		apiStore,
		factiondataStore,
		stockdataStore,
		torndataStore,
		userdataStore,
	} from "@/entrypoints/options-v2/stores/database-store.svelte";
	import DataHealthCheck from "./DataHealthCheck.svelte";
	import {
		getHealthStatus,
		type HealthStatus,
		isFactiondataHealthy,
		isStockdataHealthy,
		isTorndataHealthy,
		isUserdataHealthy
	} from "./data-health";

	type HealthCheck = {
		label: string;
		status: HealthStatus;
	};

	const corruptionChecks: HealthCheck[] = $derived([
		{
			label: "Userdata",
			status: getHealthStatus($userdataStore, isUserdataHealthy),
		},
		{
			label: "Torndata",
			status: getHealthStatus($torndataStore, isTorndataHealthy),
		},
		{
			label: "Stockdata",
			status: getHealthStatus($stockdataStore, isStockdataHealthy),
		},
		{
			label: "Factiondata",
			status: getHealthStatus($factiondataStore, isFactiondataHealthy),
		},
	]);

	const hasApiKey = $derived(!!$apiStore?.torn?.key);
</script>


<section class="rounded-lg border border-border bg-card py-2 px-3">
	<h2 class="text-lg font-bold">Data health</h2>

	{#if hasApiKey}
		<div class="mt-2 gap-3 grid md:grid-cols-2">
			{#each corruptionChecks as check (check.label)}
				<DataHealthCheck label={check.label} status={check.status} />
			{/each}
		</div>
	{:else}
		<p class="mt-2 text-sm text-muted-foreground">
			Data health checks are not relevant without an API key configured.
		</p>
	{/if}
</section>
