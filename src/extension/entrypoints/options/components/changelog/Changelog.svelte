<script lang="ts">
	import { ttStorage } from "@common/utils/data/storage";
	import { readableChangelog, toDisplayableChangelogEntry } from "@extension/utils/changelog";
	import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@svelte/components/ui/accordion";
	import { Badge } from "@svelte/components/ui/badge";
	import { cn } from "@svelte/utils";
	import { onMount } from "svelte";
	import ChangelogSection from "./ChangelogSection.svelte";
	import ContributorList from "./ContributorList.svelte";

	const changelog = readableChangelog().map(toDisplayableChangelogEntry);

	onMount(() => {
		void ttStorage.change({ version: { showNotice: false } });
	});
</script>

<Accordion type="multiple" class="gap-2">
	{#each changelog as entry, index (entry.version)}
		<AccordionItem value={entry.version} class="border rounded-lg">
			<AccordionTrigger class={cn("px-2.5", index === 0 ? "text-red-600" : "")}>
				{entry.title}

				{#if entry.beta}
					<Badge variant="secondary" class="ml-1">
						BETA
					</Badge>
				{/if}
			</AccordionTrigger>
			<AccordionContent>
				<ContributorList contributors={entry.contributors} />

				{#each Object.entries(entry.logs) as [title, logs] (title)}
					<ChangelogSection {title} {logs} />
				{/each}
			</AccordionContent>
		</AccordionItem>
	{/each}
</Accordion>
