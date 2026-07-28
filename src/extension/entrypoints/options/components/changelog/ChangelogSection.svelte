<script lang="ts">
	import { capitalizeText } from "@common/utils/functions/formatting";
	import type { DisplayableLog } from "../../../../utils/changelog";

	export let title: string;
	export let logs: DisplayableLog[];
</script>

<div class="mx-6 mb-2">
	<h3 class="font-bold">{capitalizeText(title)}</h3>

	{#each logs as log}
		<div class="ml-4" style:--contributor-color={log.color}>
			<span
				class="flex items-center before:mr-1 before:inline-block before:h-2 before:w-2 before:rounded-full before:border-2 before:border-(--contributor-color) before:bg-(--contributor-color) before:align-middle before:content-['']"
			>
				{@html log.html}
			</span>
		</div>
	{/each}
</div>
