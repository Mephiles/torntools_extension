<script lang="ts">
	import { ttStorage } from "@common/utils/context";
	import { formatBytes } from "@common/utils/functions/formatting";
	import { Spinner } from "@svelte/components/ui/spinner";
	import { onMount } from "svelte";
	import { browser } from "wxt/browser";

	let storageSize = $state<string | null>(null);
	let storageSizeError = $state<string | null>(null);
	const manifest = browser.runtime.getManifest();
	const displayVersion = manifest.version_name ?? manifest.version;

	onMount(async () => {
		storageSizeError = null;

		try {
			storageSize = formatBytes(await ttStorage.getSize());
		} catch (error) {
			storageSize = null;
			storageSizeError = error instanceof Error ? error.message : "Failed to load disk usage.";
		}
	});
</script>

<section class="border-border bg-card rounded-lg border px-3 py-2">
	<h2 class="text-lg font-bold">Version</h2>

	<div class="mt-2 space-y-2 text-sm">
		<p>
			Version:
			<span class="font-medium">{displayVersion}</span>
		</p>
		<p class="flex items-center gap-1">
			Disk space used:
			{#if storageSize}
				<span class="font-medium">{storageSize}</span>
			{:else if storageSizeError}
				<span class="">{storageSizeError}</span>
			{:else}
				<Spinner />
			{/if}
		</p>
	</div>
</section>
