<script lang="ts">
	import Contact from "@/entrypoints/options-v2/components/about/Contact.svelte";
	import CoreTeam from "@/entrypoints/options-v2/components/about/CoreTeam.svelte";
	import DataHealth from "@/entrypoints/options-v2/components/about/DataHealth.svelte";
	import MaintenanceButtons from "@/entrypoints/options-v2/components/about/MaintenanceButtons.svelte";
	import VersionDisplay from "@/entrypoints/options-v2/components/about/VersionDisplay.svelte";
</script>

<section class="space-y-4">
	<VersionDisplay />
	<DataHealth />
	<MaintenanceButtons />
	<Contact />
	<CoreTeam />
</section>
