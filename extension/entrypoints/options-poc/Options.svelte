<script lang="ts">
	import { onMount } from "svelte";
	import Router from "svelte-spa-router";
	import Header from "./Layout/Header.svelte";
	import About from "./Pages/About.svelte";
	import Changelog from "./Pages/Changelog.svelte";
	import Export from "./Pages/Export.svelte";
	import Preferences from "./Pages/Preferences.svelte";
	import PreferencesRedirect from "./Pages/PreferencesRedirect.svelte";
	import { initializeOptionsDatabase, settingsStore } from "./stores";

	const routes = {
		"/changelog": Changelog,
		"/preferences": Preferences,
		"/preferences/*": Preferences,
		"/": PreferencesRedirect,
		"/export": Export,
		"/about": About,
	};

	onMount(() => {
		let unsubscribe = () => {};

		void (async () => {
			await initializeOptionsDatabase();

			unsubscribe = settingsStore.subscribe((settings) => {
				if (!settings?.themes?.pages) return;

				let themeSetting = settings.themes.pages;
				if (themeSetting === "default") {
					themeSetting = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
				}

				document.documentElement.setAttribute("data-theme", "torntools");
				document.body.classList.toggle("dark-mode", themeSetting === "dark");
				document.body.classList.toggle("dark", themeSetting === "dark");
				document.body.classList.toggle("light", themeSetting !== "dark");
			});
		})();

		return () => {
			unsubscribe();
		};
	});
</script>

<div class="flex flex-col min-h-screen">
	<Header />
	<main class="flex-1 p-8 max-w-5xl mx-auto w-full box-border">
		<Router {routes} />
	</main>
</div>
