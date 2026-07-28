<script lang="ts">
	import { TEAM } from "@common/utils/team";
	import TeamList from "./TeamList.svelte";
</script>

<section class="border-border bg-card rounded-lg border px-3 py-2">
	<h2 class="text-lg font-bold">Team</h2>
	<p class="text-muted-foreground text-sm">
		TornTools is free to use but if you feel like giving back to the developers then feel free to donate in-game or via one of the donation links.
	</p>

	<div class="my-2">
		<TeamList members={TEAM.filter((member) => member.core)} />
	</div>

	<p class="text-muted-foreground text-sm">
		and everyone else who contributed to our codebase, helped us beta-test, provided feedback, suggestions and bug reports, or just generally helped out in
		the Discord.
	</p>
</section>
