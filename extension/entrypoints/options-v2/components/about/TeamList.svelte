<script lang="ts">
	import { Separator } from "@svelte/components/ui/separator";

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

<div class="grid grid-cols-2 lg:grid-cols-4 gap-2 ">
	{#each members as member (member.name)}
		<div class="rounded-lg border border-border p-2">
			{#if member.torn !== null}
				<a
					class="text-lg text-primary font-bold underline-offset-2 hover:underline"
					href={`https://www.torn.com/profiles.php?XID=${member.torn}`}
					target="_blank"
					rel="noreferrer"
				>
					{member.name}
				</a>
			{:else}
				<p class="text-lg text-primary font-bold">{member.name}</p>
			{/if}

			<p class="text-muted-foreground">{getTitle(member.title)}</p>
			<Separator class="my-1" />

			{#if member.donations?.length}
				<div class="flex flex-col gap-0.5">
					{#each member.donations as donation (donation.link)}
						<a
							class="underline-offset-1 hover:underline"
							href={donation.link}
							target="_blank"
							rel="noreferrer"
						>
							{donation.name}
						</a>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
