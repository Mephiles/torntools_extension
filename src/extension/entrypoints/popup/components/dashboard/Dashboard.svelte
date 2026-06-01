<script lang="ts">
	import Bars from "@extension/entrypoints/popup/components/dashboard/Bars.svelte";
	import Cooldowns from "@extension/entrypoints/popup/components/dashboard/Cooldowns.svelte";
	import ExtraInformation from "@extension/entrypoints/popup/components/dashboard/ExtraInformation.svelte";
	import FactionStakeouts from "@extension/entrypoints/popup/components/dashboard/FactionStakeouts.svelte";
	import Overview from "@extension/entrypoints/popup/components/dashboard/Overview.svelte";
	import Stakeouts from "@extension/entrypoints/popup/components/dashboard/Stakeouts.svelte";
	import { onMount } from "svelte";

	let now = $state(Date.now());

	onMount(() => {
		const interval = window.setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => window.clearInterval(interval);
	});
</script>

<div class="space-y-2">
	<Overview {now} />

	<Bars {now} />
	<Cooldowns {now} />

	<ExtraInformation {now} />

	<Stakeouts />
	<FactionStakeouts />
</div>
