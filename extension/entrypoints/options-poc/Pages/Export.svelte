<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import { Checkbox } from "@svelte/components/ui/checkbox";
	import * as Dialog from "@svelte/components/ui/dialog";
	import { Textarea } from "@svelte/components/ui/textarea";
	import { onMount } from "svelte";
	import { formatBytes, formatDate, formatTime } from "@/utils/common/functions/formatting";
	import { toClipboard } from "@/utils/common/functions/utilities";
	import {
		clearRemoteSyncData,
		getExportData,
		getRemoteSyncExportPreview,
		importExportData,
		loadRemoteSyncData,
		MAX_IMPORT_SIZE,
		REMOTE_SYNC_SOUND_CUSTOM_LIMIT,
		saveRemoteSyncData,
	} from "../export-data";
	import ExportLocalSection from "../Shared/ExportLocalSection.svelte";
	import ExportRemoteSection from "../Shared/ExportRemoteSection.svelte";
	import StatusAlert from "../Shared/StatusAlert.svelte";
	import type { ExportData, RemoteSyncState } from "../types";

	type ActionKind = "clipboard" | "file" | "remote";
	type Status = { type: "success" | "error"; text: string } | null;

	let includeApi = $state(false);
	let manualImportText = $state("");
	let status = $state<Status>(null);
	let busy = $state(false);

	let exportDialogOpen = $state(false);
	let manualImportDialogOpen = $state(false);
	let remoteImportDialogOpen = $state(false);
	let clearRemoteDialogOpen = $state(false);
	let pendingExportAction = $state<ActionKind | null>(null);
	let omitRemoteSoundCustomWarning = $state(false);

	let remoteState = $state<RemoteSyncState>({ available: false, message: "Loading sync status..." });
	let remoteLoading = $state(true);

	let fileInput: HTMLInputElement | null = null;

	onMount(async () => {
		await refreshRemoteState();
	});

	function setStatus(type: "success" | "error", text: string) {
		status = { type, text };
	}

	function clearStatus() {
		status = null;
	}

	async function refreshRemoteState() {
		remoteLoading = true;
		try {
			remoteState = await loadRemoteSyncData();
		} catch (error) {
			remoteState = { available: false, message: "Failed to load sync data." };
			setStatus("error", error instanceof Error ? error.message : "Failed to load sync data.");
		} finally {
			remoteLoading = false;
		}
	}

	async function openExportDialog(action: ActionKind) {
		if (action === "remote") {
			try {
				const preview = await getRemoteSyncExportPreview();
				omitRemoteSoundCustomWarning = preview.omittedSoundCustom;
			} catch (error) {
				setStatus("error", error instanceof Error ? error.message : "Failed to prepare the export.");
				return;
			}
		} else {
			omitRemoteSoundCustomWarning = false;
		}

		pendingExportAction = action;
		exportDialogOpen = true;
	}

	async function confirmExport() {
		if (!pendingExportAction) return;

		busy = true;
		status = null;

		try {
			if (pendingExportAction === "clipboard") {
				const data = JSON.stringify(await getExportData(includeApi));
				const copied = toClipboard(data);
				if (!copied) {
					setStatus("error", "Failed to copy the export to your clipboard.");
					return;
				}

				setStatus("success", "Copied database to your clipboard.");
			} else if (pendingExportAction === "file") {
				const data = JSON.stringify(await getExportData(includeApi), null, 4);
				const link = document.createElement("a");
				const url = window.URL.createObjectURL(new Blob([data], { type: "application/json" }));

				link.href = url;
				link.download = "torntools.json";
				link.click();
				window.URL.revokeObjectURL(url);

				setStatus("success", "Downloaded database export.");
			} else {
				await saveRemoteSyncData();
				await refreshRemoteState();
				setStatus("success", "Saved data in your browser synchronized storage.");
			}

			exportDialogOpen = false;
		} catch (error) {
			console.error(error);
			setStatus("error", error instanceof Error ? error.message : "Export failed.");
		} finally {
			busy = false;
		}
	}

	async function handleImportData(data: ExportData) {
		busy = true;
		status = null;

		try {
			const { importedApi } = await importExportData(data);
			setStatus("success", importedApi ? "Imported data and refreshed API-backed services." : "Imported data.");
		} catch (error) {
			setStatus("error", error instanceof Error ? error.message : "Couldn't save the imported database.");
		} finally {
			busy = false;
		}
	}

	function parseImportText(text: string): ExportData {
		if (text.length > MAX_IMPORT_SIZE) {
			throw new Error("Maximum file size exceeded. (5MB)");
		}

		try {
			return JSON.parse(text) as ExportData;
		} catch (error) {
			console.error("Couldn't read the imported data.", error);
			throw new Error("Couldn't read the imported data.");
		}
	}

	async function confirmManualImport() {
		try {
			const data = parseImportText(manualImportText);
			await handleImportData(data);
			manualImportDialogOpen = false;
			manualImportText = "";
		} catch (error) {
			setStatus("error", error instanceof Error ? error.message : "Import failed.");
		}
	}

	function openFileImport() {
		fileInput?.click();
	}

	function openManualImportDialog() {
		manualImportDialogOpen = true;
	}

	function openRemoteImportDialog() {
		remoteImportDialogOpen = true;
	}

	function openRemoteClearDialog() {
		clearRemoteDialogOpen = true;
	}

	async function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const data = parseImportText(text);
			await handleImportData(data);
		} catch (error) {
			setStatus("error", error instanceof Error ? error.message : "Import failed.");
		} finally {
			input.value = "";
		}
	}

	async function confirmRemoteImport() {
		if (!remoteState.available) return;

		await handleImportData(remoteState.data);
		remoteImportDialogOpen = false;
	}

	async function confirmRemoteClear() {
		busy = true;
		status = null;

		try {
			await clearRemoteSyncData();
			await refreshRemoteState();
			setStatus("success", "Cleared sync data.");
			clearRemoteDialogOpen = false;
		} catch (error) {
			setStatus("error", error instanceof Error ? error.message : "Failed to clear sync data.");
		} finally {
			busy = false;
		}
	}

	function getRemoteUpdated() {
		return remoteState.available ? new Date(remoteState.data.date) : null;
	}

	function getRemoteSize() {
		return remoteState.available ? formatBytes(remoteState.data.client.space) : null;
	}

	function getRemoteUpdatedText() {
		const updated = getRemoteUpdated();
		return updated ? `${formatTime(updated)} ${formatDate(updated, { showYear: true })}` : null;
	}

	function getRemoteVersion() {
		return remoteState.available ? remoteState.data.client.version : null;
	}
</script>

<svelte:head>
	<title>TornTools - Export</title>
</svelte:head>

<input bind:this={fileInput} class="hidden" type="file" accept=".json,application/json" onchange={handleFileChange} />

<section class="space-y-8">
	<div class="space-y-6">
		<ExportLocalSection {busy} {openExportDialog} {openManualImportDialog} {openFileImport} />
		<ExportRemoteSection
			{busy}
			{remoteLoading}
			{remoteState}
			remoteUpdatedText={getRemoteUpdatedText()}
			remoteVersion={getRemoteVersion()}
			remoteSize={getRemoteSize()}
			{openExportDialog}
			{openRemoteImportDialog}
			{openRemoteClearDialog}
		/>
	</div>
</section>

<StatusAlert {status} onClear={clearStatus} />

<Dialog.Dialog bind:open={exportDialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Export</Dialog.Title>
			<Dialog.Description>
				Review what will be included before creating the export.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<div class="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
				<h3 class="font-medium">Following information will be exported:</h3>
				<ul class="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
					<li>User ID and username</li>
					<li>Client version and database size</li>
					<li>Export date and time</li>
					<li>Version notice</li>
					<li>Preferences</li>
					<li>Filter and sorting settings</li>
					<li>Stakeouts</li>
					<li>Notes</li>
					<li>Quick items, crimes and jail bust / bail</li>
				</ul>
			</div>

			{#if pendingExportAction === "remote" && omitRemoteSoundCustomWarning}
				<div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
					Your custom notification sound is larger than {formatBytes(REMOTE_SYNC_SOUND_CUSTOM_LIMIT)} and will not be included in the browser sync export.
				</div>
			{/if}

			{#if pendingExportAction !== "remote"}
				<label class="flex items-start gap-3 rounded-lg border border-border/70 p-3 text-sm">
					<Checkbox bind:checked={includeApi} id="include-api" />
					<span>
						<span class="block font-medium">Include API key</span>
					</span>
				</label>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" disabled={busy} onclick={() => (exportDialogOpen = false)}>Cancel</Button>
			<Button disabled={busy} onclick={confirmExport}>{busy ? "Working..." : "Confirm"}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>

<Dialog.Dialog bind:open={manualImportDialogOpen}>
	<Dialog.Content class="sm:max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Import</Dialog.Title>
			<Dialog.Description>
				Paste the JSON export below. This will overwrite the imported settings on this profile.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<Textarea bind:value={manualImportText} rows={12} class="font-mono text-xs" placeholder="Paste your TornTools export JSON here." />

			<div class="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
				<h3 class="font-medium">Import will overwrite:</h3>
				<ul class="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
					<li>Version notice</li>
					<li>Preferences</li>
					<li>Filter and sorting settings</li>
					<li>Stakeouts</li>
					<li>Notes</li>
					<li>Quick items, crimes and jail bust / bail</li>
					<li>API key if it exists in the imported export</li>
				</ul>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" disabled={busy} onclick={() => (manualImportDialogOpen = false)}>Cancel</Button>
			<Button disabled={busy || !manualImportText.trim()} onclick={confirmManualImport}>{busy ? "Importing..." : "Import"}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>

<Dialog.Dialog bind:open={remoteImportDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Import Browser Sync Data</Dialog.Title>
			<Dialog.Description>
				This will overwrite the local exportable settings with the data stored in browser sync.
			</Dialog.Description>
		</Dialog.Header>

		<div class="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
			Remote imports include version notice, preferences, filters, stakeouts, notes, and quick items data.
		</div>

		<Dialog.Footer>
			<Button variant="outline" disabled={busy} onclick={() => (remoteImportDialogOpen = false)}>Cancel</Button>
			<Button disabled={busy || !remoteState.available} onclick={confirmRemoteImport}>{busy ? "Importing..." : "Import"}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>

<Dialog.Dialog bind:open={clearRemoteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Clear Browser Sync Data</Dialog.Title>
			<Dialog.Description>
				This will remove the remote export saved in synchronized browser storage.
			</Dialog.Description>
		</Dialog.Header>

		<Dialog.Footer>
			<Button variant="outline" disabled={busy} onclick={() => (clearRemoteDialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" disabled={busy} onclick={confirmRemoteClear}>{busy ? "Clearing..." : "Clear"}</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Dialog>
