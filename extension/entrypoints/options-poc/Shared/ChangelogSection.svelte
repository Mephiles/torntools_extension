<script lang="ts">
	import { capitalizeText } from "@/utils/common/functions/formatting";
	import type { Contributor } from "../types";

	export let title: string;
	export let logs: { message: string | string[]; contributor: string }[];
	export let contributors: Contributor[];

	function getContributorColor(contributorKey: string): string {
		const contributor = contributors.find((c) => c.key === contributorKey);
		return contributor?.color || "gray";
	}

	// biome-ignore lint/correctness/noUnusedVariables: false positive
	function formatMessage(message: string | string[]): string {
		if (typeof message === "string") return message;
		return message.join("<br>");
	}
</script>

<div class="ml-5 mb-2">
	<div class="font-bold">{capitalizeText(title)}</div>
	{#each logs as log}
		<div class="ml-8" style:--contributor-color={getContributorColor(log.contributor)}>
			<span class="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1 before:bg-(--contributor-color) before:border-2 before:border-(--contributor-color) before:align-middle">
				{@html formatMessage(log.message)}
			</span>
		</div>
	{/each}
</div>
