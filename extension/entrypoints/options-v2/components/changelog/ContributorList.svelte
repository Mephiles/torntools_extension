<script lang="ts">
	import type { Contributor } from "@/utils/common/functions/changelog";

	export let contributors: Contributor[];
</script>

<div class="mx-6 mb-2">
	<h3 class="font-bold">Contributors</h3>

	{#each contributors as contributor}
		<div class="ml-4" style:--contributor-color={contributor.color}>
			{#if contributor.id}
				<a
					href={`https://www.torn.com/profiles.php?XID=${contributor.id}`}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1 before:bg-(--contributor-color) before:border-2 before:border-(--contributor-color) before:align-middle"
				>
					{contributor.name} [{contributor.id}]
				</a>
			{:else}
				<span class="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1 before:bg-(--contributor-color) before:border-2 before:border-(--contributor-color) before:align-middle">
					{contributor.name}
				</span>
			{/if}
		</div>
	{/each}
</div>
