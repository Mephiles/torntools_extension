<script lang="ts">
	import { Textarea } from "@svelte/components/ui/textarea";
	import { toast } from "svelte-sonner";
	import { toClipboard } from "@/utils/common/functions/utilities";
	import ExportMethod from "../ExportMethod.svelte";
	import { type ExportData, getExportData, importExportData, parseImportText } from "../export-data";

	let importText = $state("");

	async function exportData(includeApi: boolean) {
		const data = JSON.stringify(await getExportData(includeApi));
		const copied = toClipboard(data);
		if (!copied) {
			toast.error("Failed to copy the export to your clipboard.");
			return;
		}

		toast.success("Copied database to your clipboard.");
	}

	async function importData() {
		const data = parseImportText(importText);
		await handleImportData(data);
	}

	async function handleImportData(data: ExportData) {
		try {
			await importExportData(data);
			toast.success("Imported data.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Couldn't save the imported database.");
		}
	}
</script>

<ExportMethod title="Clipboard"
              description="Copy a compact version of the database, or paste one back in manually."
              allowApi={true}
              onExport={exportData}
              onImport={importData}
>
	{#snippet extraImportInput()}
		<Textarea bind:value={importText} rows={6} class="text-xs" placeholder="Paste your exported JSON here." />
	{/snippet}
</ExportMethod>
