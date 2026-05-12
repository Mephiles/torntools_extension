<script lang="ts">
	import Router from "svelte-spa-router";
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
		"/": PreferencesRedirect,
		"/export": Export,
		"/about": About,
	};
</script>

<GlobalLayout>
	<Router {routes} />
</GlobalLayout>