<script lang="ts">
	import { Accordion } from "@svelte/components/ui/accordion";
	import { onMount } from "svelte";
	import { ttStorage } from "@/utils/common/data/storage";
	import ChangelogEntry from "../Shared/ChangelogEntry.svelte";
	import type { Changelog, ChangelogEntry as ChangelogEntryType, ImportedChangelog } from "../types";

	let changelog: Changelog = [];
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			const response = await fetch(browser.runtime.getURL("/changelog.json"));
			const data: ImportedChangelog = await response.json();

			// Process dates
			changelog = data.map((entry) => {
				const log: ChangelogEntryType = {
					...entry,
					date: false,
				}

				// Convert the date to something usable
				if (typeof entry.date === "string") {
					log.date = new Date(entry.date);
				}

				// Remove all empty log sections
				Object.entries(entry.logs)
					.filter(([, logs]) => !logs.length)
					.forEach(([section]) => delete entry.logs[section])

				return log;
			});

			await ttStorage.change({ version: { showNotice: false } });
		} catch (e) {
			error = e instanceof Error ? e.message : "Failed to load changelog.";
		} finally {
			loading = false;
		}
	});
</script>

<section>
	{#if loading}
		<p class="text-center mt-5">Loading changelog...</p>
	{:else if error}
		<p class="text-center mt-5 text-red-600">Error: {error}</p>
	{:else}
		<Accordion type="multiple" class="gap-2">
			{#each changelog as entry, index}
				<ChangelogEntry {entry} isFirst={index === 0} />
			{/each}
		</Accordion>
		<p class="text-center mt-5">The rest is history..</p>
	{/if}
</section>
