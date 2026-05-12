<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import type { RemoteSyncState } from "../types";

	let {
		busy,
		remoteLoading,
		remoteState,
		remoteUpdatedText,
		remoteVersion,
		remoteSize,
		openExportDialog,
		openRemoteImportDialog,
		openRemoteClearDialog,
	}: {
		busy: boolean;
		remoteLoading: boolean;
		remoteState: RemoteSyncState;
		remoteUpdatedText: string | null;
		remoteVersion: string | null;
		remoteSize: string | null;
		openExportDialog: (action: "remote") => void;
		openRemoteImportDialog: () => void;
		openRemoteClearDialog: () => void;
	} = $props();
</script>

<section class="rounded-2xl border border-border bg-card p-6 shadow-sm">
	<h2 class="text-xl font-bold">Remote</h2>

	<div class="mt-4 rounded-xl border border-border/70 p-4">
		<div class="space-y-1">
			<h3 class="text-base font-medium">Browser sync</h3>
			<p class="text-sm text-muted-foreground">
				Exporting here uses your browser’s synced extension storage. Make sure extensions are synced.
			</p>
		</div>

		<div class="mt-4 space-y-2 text-sm">
			{#if remoteLoading}
				<p class="text-muted-foreground">Loading sync status...</p>
			{:else if remoteState.available}
				<p>
					Last update:
					<span class="font-medium">{remoteUpdatedText}</span>
				</p>
				<p>
					Version:
					<span class="font-medium">{remoteVersion}</span>
				</p>
				<p>
					Database size:
					<span class="font-medium">{remoteSize}</span>
				</p>
			{:else if "message" in remoteState}
				<p class="text-muted-foreground">{remoteState.message}</p>
			{/if}
		</div>

		<div class="mt-4 flex flex-wrap gap-3">
			<Button disabled={busy} onclick={() => openExportDialog("remote")}>Export</Button>
			<Button variant="outline" disabled={busy || !remoteState.available} onclick={openRemoteImportDialog}>Import</Button>
			<Button variant="destructive" disabled={busy || !remoteState.available} onclick={openRemoteClearDialog}>Clear</Button>
		</div>
	</div>
</section>
