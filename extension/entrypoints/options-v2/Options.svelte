<script lang="ts">
	import Router from "svelte-spa-router";
	import MissingPermissions from "@/entrypoints/options-v2/MissingPermissions.svelte";
	import About from "./components/about/About.svelte";
	import Changelog from "./components/changelog/Changelog.svelte";
	import Export from "./components/export/Export.svelte";
	import GlobalLayout from "./components/GlobalLayout.svelte";
	import Preferences from "./components/preferences/Preferences.svelte";
	import PreferencesRedirect from "./components/preferences/PreferencesRedirect.svelte";

	const routes = {
		"/changelog": Changelog,
		"/preferences": Preferences,
		"/preferences/*": Preferences,
		"/export": Export,
		"/about": About,
		"/": PreferencesRedirect,
	};
</script>

<MissingPermissions />
<GlobalLayout>
	<Router {routes} />
</GlobalLayout>
