<script lang="ts">
	let {
		version,
		storageSize,
		storageSizeError,
	}: {
		version: string;
		storageSize: string | null;
		storageSizeError: string | null;
	} = $props();
</script>

<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
	<h2 class="text-xl font-bold">Version</h2>

	<div class="mt-4 space-y-3 text-sm">
		<p>
			Version:
			<span class="font-medium">{version}</span>
		</p>
		<p>
			Disk space used:
			{#if storageSize}
				<span class="font-medium">{storageSize}</span>
			{:else if storageSizeError}
				<span class="text-red-600 dark:text-red-400">{storageSizeError}</span>
			{:else}
				<span class="text-muted-foreground">Loading...</span>
			{/if}
		</p>
		<p class="text-muted-foreground">Estimation of the stored data, not the extension files.</p>
	</div>
</section>
