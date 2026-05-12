<script lang="ts">
	type TeamMember = {
		name: string;
		title: string | string[];
		torn: number | null;
		donations?: { name: string; link: string }[];
	};

	let { members }: { members: TeamMember[] } = $props();

	function getTitle(title: TeamMember["title"]) {
		return Array.isArray(title) ? title.join(" + ") : title;
	}
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
	{#each members as member (member.name)}
		<div class="rounded-xl border border-border/70 p-4">
			{#if member.torn !== null}
				<a
					class="block text-lg font-bold text-primary underline-offset-4 hover:underline"
					href={`https://www.torn.com/profiles.php?XID=${member.torn}`}
					target="_blank"
					rel="noreferrer"
				>
					{member.name}
				</a>
			{:else}
				<p class="text-lg font-bold">{member.name}</p>
			{/if}

			<p class="mt-1 text-sm text-muted-foreground">{getTitle(member.title)}</p>

			{#if member.donations?.length}
				<div class="mt-4 border-t border-border/70 pt-4">
					<div class="space-y-2">
						{#each member.donations as donation (donation.link)}
							<a
								class="block text-sm font-medium text-primary underline-offset-4 hover:underline"
								href={donation.link}
								target="_blank"
								rel="noreferrer"
							>
								{donation.name}
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>
