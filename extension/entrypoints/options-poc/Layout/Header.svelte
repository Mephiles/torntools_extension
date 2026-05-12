<script lang="ts">
	import { link } from "svelte-spa-router";
	import active from "svelte-spa-router/active";

	const navItems = [
		{ name: "Changelog", path: "/changelog" },
		{ name: "Preferences", path: "/preferences", activePath: /^\/preferences(?:\/.*)?$/ },
		{ name: "Export", path: "/export" },
		{ name: "About", path: "/about" },
	];
</script>

<header class="border-b border-gray-300 px-5 py-2.5 flex items-center justify-center gap-5 dark:border-gray-600">
	<nav class="flex">
		<ul class="flex list-none m-0 p-0 gap-4">
			{#each navItems as item (item.path)}
				<li>
					<a
						use:link
						use:active={{path: item.activePath ?? item.path, className: "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-900"}}
						href={item.path}
						class="no-underline text-inherit px-2.5 py-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						{item.name}
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
	<nav class="flex">
		<ul class="flex list-none m-0 p-0 gap-4">
			<li>
				<a
					href="/targets.html"
					target="_blank"
					rel="noopener noreferrer"
					class="no-underline text-inherit px-2.5 py-1 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					Targets
				</a>
			</li>
		</ul>
	</nav>
</header>
