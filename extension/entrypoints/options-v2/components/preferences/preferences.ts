import {
	DEFAULT_GROUP_ID,
	PREFERENCE_GROUPS,
	type PreferenceGroup,
	type PreferenceGroupId,
	type PreferenceSection,
} from "@/entrypoints/options-v2/components/preferences/configuration";

function getPreferenceGroup(id?: string | null): PreferenceGroup {
	return PREFERENCE_GROUPS.find((group) => group.id === id) ?? PREFERENCE_GROUPS[0];
}

export function getPreferenceSections(group: PreferenceGroup): readonly PreferenceSection[] {
	return group.sections ?? [];
}

function getPreferenceSection(group: PreferenceGroup, sectionId?: string | null): PreferenceSection | undefined {
	return getPreferenceSections(group).find((section) => section.id === sectionId);
}

export function getPreferenceGroupRoute(groupId: PreferenceGroupId) {
	return groupId === DEFAULT_GROUP_ID ? "/preferences" : `/preferences/${groupId}`;
}

export function getPreferenceSectionRoute(groupId: PreferenceGroupId, sectionId: string) {
	return `/preferences/${groupId}/${sectionId}`;
}

export function resolvePreferenceRoute(groupId?: string | null, sectionId?: string | null) {
	const group = getPreferenceGroup(groupId);
	const sections = getPreferenceSections(group);
	const section = getPreferenceSection(group, sectionId) ?? sections[0];
	const sectionRoute = section ? getPreferenceSectionRoute(group.id, section.id) : undefined;

	return {
		group,
		section,
		route: sectionRoute ?? getPreferenceGroupRoute(group.id),
	};
}
