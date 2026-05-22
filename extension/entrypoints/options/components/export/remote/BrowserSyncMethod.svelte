<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { toast } from "svelte-sonner";
	import { formatBytes } from "@/utils/common/functions/formatting";
	import { settingsStore } from "../../../stores/database-store.svelte";
	import ExportMethod from "../ExportMethod.svelte";
	import { importExportData } from "../export-data";
	import ClearRemoteStorageDialog from "./ClearBrowserSyncDialog.svelte";
	import RemoteSyncInformation from "./RemoteSyncInformation.svelte";
	import {
		clearRemoteSyncData,
		getByteLength,
		loadRemoteSyncData,
		REMOTE_SYNC_SOUND_CUSTOM_LIMIT,
		type RemoteSyncState,
		saveRemoteSyncData,
	} from "./remote-export";

	let busy = $state(false);
	let clearDialogOpen = $state(false);
	let soundCustomByteLength = $derived.by(() => {
		const soundCustom = $settingsStore?.notifications?.soundCustom;
		if (typeof soundCustom !== "string" || soundCustom.length === 0) return 0;

		return getByteLength(soundCustom);
	});

	let showExportWarning = $derived(soundCustomByteLength > REMOTE_SYNC_SOUND_CUSTOM_LIMIT);

	let remoteState = $state<RemoteSyncState>({ available: false, message: "Loading sync status..." });
	let stateLoading = $state(true);

	onMount(async () => {
		await refreshRemoteState();
	});

	async function refreshRemoteState() {
		stateLoading = true;
		try {
			remoteState = await loadRemoteSyncData();
		} catch (error) {
			remoteState = { available: false, message: "Failed to load sync data." };
			toast.error(error instanceof Error ? error.message : "Failed to load sync data.");
		} finally {
			stateLoading = false;
		}
	}

	function exportData() {
		saveRemoteSyncData()
			.then((data) => {
				remoteState = data;
				toast.success("Successfully saved your data to your browser sync.");
			})
			.catch(() => toast.error("Failed to export browser sync data."));
	}

	function importData() {
		loadRemoteSyncData()
			.then((state) => {
				if (!state.available) throw new Error("Expected remote sync data.");

				return importExportData(state.data);
			})
			.then(() => toast.success("Successfully loaded your data from your browser sync."))
			.catch(() => toast.error("Failed to import browser sync data."));
	}

	async function clearData() {
		busy = true;

		clearRemoteSyncData()
			.then(() => toast.success("Cleared browser sync data."))
			.catch(() => toast.error("Failed to clear browser sync data."))
			.finally(() => {
				refreshRemoteState();
				busy = false;
			});
	}
</script>

<ExportMethod title="Browser Sync"
              description="Use your browsers synchronized extension storage. Make sure extensions are synced."
              bind:busy={busy}
              allowApi={false}
              onExport={exportData}
              disableImport={!remoteState.available}
              onImport={importData}
>
	{#snippet information()}
		<RemoteSyncInformation information={remoteState} loading={stateLoading} />
	{/snippet}

	{#snippet extraButtons()}
		<Button size="sm" variant="destructive" disabled={busy || !remoteState.available}
		        onclick={() => clearDialogOpen = true}>
			Clear
		</Button>
	{/snippet}

	{#snippet exportWarning()}
		{#if showExportWarning}
			<div
				class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
				Your custom notification sound is larger than {formatBytes(REMOTE_SYNC_SOUND_CUSTOM_LIMIT)} and will not
				be included in the browser sync export.
			</div>
		{/if}
	{/snippet}
</ExportMethod>

<ClearRemoteStorageDialog bind:dialogOpen={clearDialogOpen} onConfirm={clearData} />
