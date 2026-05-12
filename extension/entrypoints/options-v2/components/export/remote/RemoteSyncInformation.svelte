<script lang="ts">
	import { Spinner } from "@svelte/components/ui/spinner";
	import type { RemoteSyncState } from "@/entrypoints/options-v2/components/export/remote/remote-export";
	import { formatBytes, formatDate, formatTime } from "@/utils/common/functions/formatting";

	interface RemoteSyncInformationProps {
		information: RemoteSyncState;
		loading: boolean;
	}

	let { information, loading }: RemoteSyncInformationProps = $props();

</script>

<div class="mt-1 text-xs">
	{#if loading}
		<p class="text-muted-foreground flex items-center gap-1">
			<Spinner />
			Loading sync status...
		</p>
	{:else if information.available}
		<p>
			Last update:
			<span
				class="font-medium">{formatTime(information.data.date)} {formatDate(information.data.date, { showYear: true })}</span>
		</p>
		<p>
			Version:
			<span class="font-medium">{information.data.client.version}</span>
		</p>
		<p>
			Database size:
			<span class="font-medium">{formatBytes(information.data.client.space)}</span>
		</p>
	{:else if "message" in information}
		<p class="text-muted-foreground">{information.message}</p>
	{/if}
</div>