<script lang="ts">
	import type { Contributor } from "../../../../utils/changelog";

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
					class="flex items-center before:mr-1 before:inline-block before:h-2 before:w-2 before:rounded-full before:border-2 before:border-(--contributor-color) before:bg-(--contributor-color) before:align-middle before:content-['']"
				>
					{contributor.name} [{contributor.id}]
				</a>
			{:else}
				<span
					class="flex items-center before:mr-1 before:inline-block before:h-2 before:w-2 before:rounded-full before:border-2 before:border-(--contributor-color) before:bg-(--contributor-color) before:align-middle before:content-['']"
				>
					{contributor.name}
				</span>
			{/if}
		</div>
	{/each}
</div>
