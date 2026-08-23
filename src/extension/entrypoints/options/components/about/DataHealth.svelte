<script lang="ts">
	import { apiStore, factiondataStore, stockdataStore, torndataStore, userdataStore } from "../../stores/database-store.svelte";
	import { getHealthStatus, isFactiondataHealthy, isStockdataHealthy, isTorndataHealthy, isUserdataHealthy } from "./data-health";
	import type { HealthStatus } from "./data-health";
	import DataHealthCheck from "./DataHealthCheck.svelte";

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

<section class="border-border bg-card rounded-lg border px-3 py-2">
	<h2 class="text-lg font-bold">Data health</h2>

	{#if hasApiKey}
		<div class="mt-2 grid gap-3 md:grid-cols-2">
			{#each corruptionChecks as check (check.label)}
				<DataHealthCheck label={check.label} status={check.status} />
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground mt-2 text-sm">Data health checks are not relevant without an API key configured.</p>
	{/if}
</section>
