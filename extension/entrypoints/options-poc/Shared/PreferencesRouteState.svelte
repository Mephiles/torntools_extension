<script lang="ts">
	import { onDestroy } from "svelte";
	import { replace } from "svelte-spa-router";
	import { getPreferenceGroupSubgroups, resolvePreferenceRoute } from "../preferences";
	import { resetPreferenceRouteState, setPreferenceRouteState } from "../preferences-route-state";
	import type { PreferenceGroupId, PreferenceSubgroupDefinition } from "../types";

	let { params = {} }: { params?: { section?: string; subgroup?: string } } = $props();

	$effect(() => {
		const resolved = resolvePreferenceRoute(params.section, params.subgroup, getStoredSubgroup);

		if (resolved.route !== currentRoute(params.section, params.subgroup)) {
			void replace(resolved.route);
			return;
		}

		setPreferenceRouteState({
			section: resolved.group,
			subgroup: resolved.subgroup || undefined,
		});
	});

	onDestroy(() => {
		resetPreferenceRouteState();
	});

	function currentRoute(section?: string, subgroup?: string) {
		if (!section) return "/preferences";
		return subgroup ? `/preferences/${section}/${subgroup}` : `/preferences/${section}`;
	}

	function getStoredSubgroup(group: PreferenceGroupId, subgroups: PreferenceSubgroupDefinition[]) {
		if (!subgroups.length || typeof localStorage === "undefined") return subgroups[0]?.id ?? "";
		const stored = localStorage.getItem(`tt-options2-subgroup:${group}`);
		return subgroups.some((entry) => entry.id === stored) ? stored ?? "" : subgroups[0]?.id ?? "";
	}
</script>
