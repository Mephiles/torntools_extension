import type { JQuery } from "@/utils/common/type-helper";

export interface EfficientRehabDetails {
	ticks: number;
}

declare const $: (selector: string) => JQuery;

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	window.addEventListener("tt-efficient-rehab", (event: CustomEventInit<EfficientRehabDetails>) => {
		const $slider = $("#rehub-progress .ui-slider");
		const rehabPercentages = JSON.parse($slider.attr("data-percentages")) || [];

		const { ticks } = event.detail;
		if (!(ticks in rehabPercentages)) {
			console.warn("TornTools - Failed to update the rehab amount due to it being an invalid amount of ticks");
			return;
		}

		const percentage = rehabPercentages[ticks];

		$slider.slider("value", percentage).slider("option", "slide")({}, { value: $slider.slider("value") });
	});
	window.dispatchEvent(new CustomEvent("tt-injected--efficient-rehab"));
});
