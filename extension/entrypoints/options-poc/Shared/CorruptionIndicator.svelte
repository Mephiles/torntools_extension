<script lang="ts">
	let {
		label,
		healthy,
	}: {
		label: string;
		healthy: boolean;
	} = $props();
</script>

<div class="rounded-xl border border-border/70 p-4">
	<p class="text-sm">
		<span class="font-bold">{label}:</span>
		<span class={healthy ? "font-medium text-lime-600 dark:text-lime-400" : "font-medium text-red-600 dark:text-red-400"}>
			{healthy ? "likely okay" : "possibly corrupted"}
		</span>
	</p>
</div>
