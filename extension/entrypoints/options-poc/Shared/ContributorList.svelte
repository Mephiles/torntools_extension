<script lang="ts">
	import type { Contributor } from "../types";

	export let contributors: Contributor[];
</script>

<div class="ml-5 mb-2">
	<div class="font-bold">Contributors</div>
	{#each contributors as contributor}
		<div class="ml-8" style:--contributor-color={contributor.color || 'gray'}>
			{#if contributor.id}
				<a
					href={`https://www.torn.com/profiles.php?XID=${contributor.id}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<span class="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1 before:bg-(--contributor-color) before:border-2 before:border-(--contributor-color) before:align-middle">
						{contributor.name} [{contributor.id}]
					</span>
				</a>
			{:else}
				<span class="flex items-center before:content-[''] before:inline-block before:w-2 before:h-2 before:rounded-full before:mr-1 before:bg-(--contributor-color) before:border-2 before:border-(--contributor-color) before:align-middle">
					{contributor.name}
				</span>
			{/if}
		</div>
	{/each}
</div>
