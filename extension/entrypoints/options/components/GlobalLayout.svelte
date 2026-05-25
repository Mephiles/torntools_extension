<script>
	import { Separator } from "@svelte/components/ui/separator/index.ts";
	import { Toaster } from "@svelte/components/ui/sonner";
	import * as Tooltip from "@svelte/components/ui/tooltip";
	import { ModeWatcher, setMode } from "mode-watcher";
	import { link } from "svelte-spa-router";
	import active from "svelte-spa-router/active";
	import { initializeDatabaseStore, settingsStore } from "../stores/database-store.svelte";

	const navigation = [
		{ name: "Changelog", path: "/changelog" },
		{ name: "Preferences", path: "/preferences", activePath: /^\/preferences(?:\/.*)?$/ },
		{ name: "Export", path: "/export" },
		{ name: "About", path: "/about" },
	];

	onMount(() => {
		initializeDatabaseStore();

		const unsubscribeTheme = settingsStore.subscribe((settings) => {
			const pageTheme = settings?.themes?.pages;
			if (!pageTheme) return;

			setMode(pageTheme === "default" ? "system" : pageTheme);
		});

		return () => {
			unsubscribeTheme();
		};
	});
</script>

<ModeWatcher track={false} />
<Toaster richColors />

<Tooltip.Provider>
<div class="flex flex-col min-h-screen">
	<header class="px-5 py-2 flex items-center justify-center gap-5">
		<nav>
			<ul class="flex gap-4">
				{#each navigation as item (item.path)}
					<li>
						<a use:link
						   use:active={{path: item.activePath ?? item.path, className: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-900"}}
						   href={item.path}
						   class="px-2 py-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							{item.name}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		<div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
		<nav>
			<ul class="flex gap-4">
				<li>
					<a
						href="/targets.html"
						target="_blank"
						rel="noopener noreferrer"
						class="px-2 py-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						Targets
					</a>
				</li>
			</ul>
		</nav>
	</header>

	<Separator class="bg-gray-300 dark:bg-gray-600" />

	<main class="p-8 max-w-5xl mx-auto w-full">
		<slot />
	</main>
</div>
</Tooltip.Provider>
