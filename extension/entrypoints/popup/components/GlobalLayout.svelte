<script>
	import {Button} from "@svelte/components/ui/button/index.ts";
	import { Toaster } from "@svelte/components/ui/sonner";
	import * as Tooltip from "@svelte/components/ui/tooltip";
	import { ModeWatcher, setMode } from "mode-watcher";
	import {link, router} from "svelte-spa-router";
	import active from "svelte-spa-router/active";
	import { browser } from "wxt/browser";
	import { apiStore, initializeDatabaseStore, settingsStore } from "../stores/database-store.svelte.ts";
	import { getEnabledPopupTabs } from "../tabs.ts";

	let showNavigation = $derived(router.location !== "/initialize");
	let enabledTabs = $derived(getEnabledPopupTabs($settingsStore));
	let popupWidth = $state(432);

	onMount(() => {
		popupWidth = Math.min(432, screen.availWidth * 0.8);
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
	<div class="min-h-60 bg-background text-foreground" style:width={`${popupWidth}px`} style:min-width={`${popupWidth}px`}>
		{#if $apiStore?.torn?.error}
			<div class="border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
				{$apiStore.torn.error}
			</div>
		{/if}

		{#if showNavigation}
			<div class="border-b border-border p-1">
				<nav class="flex items-center gap-1 overflow-x-auto">
					{#if $apiStore?.torn?.key}
						{#each enabledTabs as tab (tab.path)}
							<a
									use:link
									use:active={{ path: tab.path, className: "bg-primary text-primary-foreground hover:bg-primary/90" }}
									href={tab.path}
									class="rounded-sm px-1 py-0.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground whitespace-nowrap"
							>
								{tab.label}
							</a>
						{/each}
					{/if}
					<Button variant="ghost" size="sm" class="ml-auto h-5 px-1 py-0.5 text-xs" onclick={() => browser.runtime.openOptionsPage()}>Settings</Button>
				</nav>
			</div>
		{/if}

		<main class="overflow-y-auto p-3">
			<slot />
		</main>
	</div>
</Tooltip.Provider>
