<script lang="ts">
	import type { HealthStatus } from "./data-health";

	let {
		label,
		status,
	}: {
		label: string;
		status: HealthStatus;
	} = $props();

	const statusText = $derived(
		status === "checking" ? "checking..." : status === "healthy" ? "likely okay" : "possibly corrupted",
	);
	const statusClass = $derived(
		status === "healthy"
			? "font-medium text-lime-600 dark:text-lime-400"
			: status === "corrupted"
				? "font-medium text-red-600 dark:text-red-400"
				: "font-medium text-muted-foreground",
	);
</script>

<article aria-label={`${label} data health`}>
	<p class="rounded-lg border border-border p-2 text-sm">
		<strong class="text-sm">{label}:</strong>
		<span class={statusClass}>{statusText}</span>
	</p>
</article>
