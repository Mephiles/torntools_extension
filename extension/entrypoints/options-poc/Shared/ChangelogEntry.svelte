<script lang="ts">
	import { AccordionContent, AccordionItem, AccordionTrigger } from "@svelte/components/ui/accordion";
	import { cn } from "@svelte/utils";
	import { daySuffix } from "@/utils/common/functions/formatting";
	import { MONTHS } from "@/utils/common/functions/utilities";
	import { CONTRIBUTORS } from "@/utils/common/team";
	import type { ChangelogEntry, Contributor } from "../types";
	import ChangelogSection from "./ChangelogSection.svelte";
	import ContributorList from "./ContributorList.svelte";

	export let entry: ChangelogEntry;
	export let isFirst = false;

	$: contributors = Object.values(entry.logs)
		.flat()
		.map((log) => (log as { message: string | string[]; contributor: string }).contributor)
		.filter((value, i, self) => !!value && self.indexOf(value) === i)
		.map<Contributor>((contributor) => {
			if (contributor in CONTRIBUTORS) {
				return {
					key: contributor,
					...CONTRIBUTORS[contributor],
				};
			} else {
				return {
					key: contributor,
					name: contributor,
				};
			}
		});

	function getTitle(): string {
		const parts: string[] = [];

		parts.push(getVersion());
		if (entry.date && typeof entry.date === "object") {
			parts.push(`${MONTHS[entry.date.getMonth()]}, ${daySuffix(entry.date.getDate())} ${entry.date.getFullYear()}`);
		}
		if (entry.title) parts.push(entry.title);

		return parts.join(" - ");
	}

	function getVersion(): string {
		const parts: string[] = [];

		parts.push(`v${entry.version.major}`);
		parts.push(entry.version.minor.toString());
		if (entry.version.build) parts.push(entry.version.build.toString());

		return parts.join(".");
	}
</script>

<AccordionItem value={getVersion()} class="border rounded-lg">
	<AccordionTrigger class={cn("px-2.5", isFirst ? "text-red-600" : "")}>
		{getTitle()}
	</AccordionTrigger>
	<AccordionContent>
		<ContributorList {contributors} />

		{#each Object.entries(entry.logs) as [title, logs]}
			<ChangelogSection {title} {logs} {contributors} />
		{/each}
	</AccordionContent>
</AccordionItem>
