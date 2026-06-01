<script lang="ts">
	import { elementBuilder } from "@utils/functions/dom";
	import { toast } from "svelte-sonner";
	import ExportMethod from "../ExportMethod.svelte";
	import { type ExportData, getExportData, importExportData, parseImportText } from "../export-data";

	let fileInput: HTMLInputElement | null = null;

	async function exportData(includeApi: boolean) {
		const data = JSON.stringify(await getExportData(includeApi), null, 4);
		const url = window.URL.createObjectURL(new Blob([data], { type: "application/json" }));

		elementBuilder({
			type: "a",
			href: url,
			attributes: { download: "torntools.json" },
		}).click();

		window.URL.revokeObjectURL(url);
	}

	async function importData() {
		fileInput?.click();
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
			toast.error(error instanceof Error ? error.message : "Import failed.");
		} finally {
			input.value = "";
		}
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

<input bind:this={fileInput} class="hidden" type="file" accept=".json,application/json" onchange={handleFileChange} />

<ExportMethod title="File"
              recommended
              description="Download a formatted file or import one from disk."
              allowApi={true}
              onExport={exportData}
              onImport={importData}
/>
