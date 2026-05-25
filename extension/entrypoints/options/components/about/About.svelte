<script lang="ts">
	import Contact from "./Contact.svelte";
	import CoreTeam from "./CoreTeam.svelte";
	import DataHealth from "./DataHealth.svelte";
	import MaintenanceButtons from "./MaintenanceButtons.svelte";
	import VersionDisplay from "./VersionDisplay.svelte";
</script>

<section class="space-y-4">
	<VersionDisplay />
	<DataHealth />
	<MaintenanceButtons />
	<Contact />
	<CoreTeam />
</section>
