import { EVENT_HANDLER } from "@common/utils/context";
import { EVENT_CHANNELS } from "@common/utils/functions/events.ts";
import type { JQuery } from "@common/utils/type-helper";

declare const $: (selector: string) => JQuery;

export function injectEfficientRehabListeners(pageWindow: Window = window) {
	EVENT_HANDLER.registerListenerCrossWorld(pageWindow, EVENT_CHANNELS.EFFICIENT_REHAB, ({ ticks }) => {
		const $slider = $("#rehub-progress .ui-slider");
		const rehabPercentages = JSON.parse($slider.attr("data-percentages")!) || [];

		if (!(ticks in rehabPercentages)) {
			console.warn("TornTools - Failed to update the rehab amount due to it being an invalid amount of ticks");
			return;
		}

		const percentage = rehabPercentages[ticks];

		$slider.slider("value", percentage).slider("option", "slide")({}, { value: $slider.slider("value") });
	});
	EVENT_HANDLER.triggerEventCrossWorld(pageWindow, EVENT_CHANNELS.EFFICIENT_REHAB__INJECTED);
}
