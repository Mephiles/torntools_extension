<script lang="ts">
	import { replace, router } from "svelte-spa-router";
	import PreferencesContent from "./PreferencesContent.svelte";
	import PreferencesNavigation from "./PreferencesNavigation.svelte";
	import PreferencesSectionNavigation from "./PreferencesSectionNavigation.svelte";
	import { getPreferenceSections, resolvePreferenceRoute } from "./preferences";

	const routeParts = $derived(getRouteParts(router.location));
	const resolvedRoute = $derived(resolvePreferenceRoute(routeParts.group, routeParts.section));
	const activeGroup = $derived(resolvedRoute.group);
	const activeSections = $derived(getPreferenceSections(activeGroup));
	const activeSection = $derived(resolvedRoute.section);

	$effect(() => {
		if (!routeParts.isPreferencesRoute) return;

		if (resolvedRoute.route !== router.location) {
			void replace(resolvedRoute.route);
		}
	});

	function getRouteParts(location: string) {
		const match = location.match(/^\/preferences(?:\/([^/]+))?(?:\/([^/]+))?$/);
		const [, group, section] = match ?? [];

		return {
			isPreferencesRoute: !!match,
			group,
			section,
		};
	}
</script>

<section class="grid gap-2 lg:grid-cols-[11rem_1fr]">
	<PreferencesNavigation activeGroup={activeGroup.id} />

	<div class="space-y-2">
		{#if activeSections.length}
			<PreferencesSectionNavigation groupId={activeGroup.id} sections={activeSections} activeSection={activeSection?.id} />
		{/if}

		<PreferencesContent groupId={activeGroup.id} sectionId={activeSection?.id} />
	</div>
</section>
