<script lang="ts">
	import { Spinner } from "@svelte/components/ui/spinner";
	import { browser } from "wxt/browser";
	import { ttStorage } from "@/utils/common/data/storage";
	import { formatBytes } from "@/utils/common/functions/formatting";

	let storageSize = $state<string | null>(null);
	let storageSizeError = $state<string | null>(null);

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

<section class="rounded-lg border border-border bg-card py-2 px-3">
	<h2 class="text-lg font-bold">Version</h2>

	<div class="mt-2 space-y-2 text-sm">
		<p>
			Version:
			<span class="font-medium">{browser.runtime.getManifest().version}</span>
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