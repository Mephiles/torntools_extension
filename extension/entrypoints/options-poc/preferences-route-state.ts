import { writable } from "svelte/store";

export type PreferenceRouteState = {
	section?: string;
	subgroup?: string;
};

const defaultRouteState: PreferenceRouteState = {
	section: undefined,
	subgroup: undefined,
};

export const preferenceRouteState = writable<PreferenceRouteState>(defaultRouteState);

export function setPreferenceRouteState(nextState: PreferenceRouteState) {
	preferenceRouteState.set(nextState);
}

export function resetPreferenceRouteState() {
	preferenceRouteState.set(defaultRouteState);
}
