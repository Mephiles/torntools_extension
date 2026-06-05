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
			<span class="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1 before:bg-(--contributor-color) before:border-2 before:border-(--contributor-color) before:align-middle">
				{@html log.html}
			</span>
		</div>
	{/each}
</div>
