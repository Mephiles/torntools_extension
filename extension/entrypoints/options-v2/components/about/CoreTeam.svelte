<script lang="ts">
	import TeamList from "@/entrypoints/options-v2/components/about/TeamList.svelte";
	import { TEAM } from "@/utils/common/team";
</script>

<section class="rounded-lg border border-border bg-card py-2 px-3">
	<h2 class="text-lg font-bold">Team</h2>
	<p class="text-sm text-muted-foreground">
		TornTools is free to use but if you feel like giving back to the developers then feel free to donate in-game or via one of the donation links.
	</p>

	<div class="my-2">
		<TeamList members={TEAM.filter((member) => member.core)} />
	</div>

	<p class="text-sm text-muted-foreground">
		and everyone else who contributed to our codebase, helped us beta-test, provided feedback, suggestions and bug reports, or just generally helped out in the Discord.
	</p>
</section>