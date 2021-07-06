"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isFlying() || isAbroad()) return;

	const feature = featureManager.registerFeature(
		"Flying Time",
		"travel",
		() => settings.pages.travel.flyingTime,
		initialise,
		showTime,
		removeTime,
		{
			storage: ["settings.pages.travel.flyingTime"],
		},
		null
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY].push(() => {
			if (!feature.enabled()) return;

			showTime();
		});
	}

	function showTime() {
		const container = document.find(".travel-agency > div[aria-expanded='true'] .travel-container.full-map[style='display: block;']");
		if (!container) return;

		// const travelTimer = container.find(".flight-time");

		// FIXME - Calculate flight duration.
		let duration = 0;

		// console.log("DKK showTime", container.find(".flight-time"));

		const now = new Date();
		const arrivalTime = new Date(now.getTime() + duration);
		const returnTime = new Date(now + duration * 2);

		const text = `Landing at ${format(arrivalTime)} | Return at ${format(returnTime)}`;

		let timer = document.find(".tt-flying-time");
		if (timer) timer.innerText = text;
		else {
			document.find("div.travel-agency:not([id])").appendChild(document.newElement({ type: "span", class: "tt-flying-time", text }));
		}

		function format(date) {
			if (date.getDate() === now.getDate()) return formatTime(date, { hideSeconds: true });
			else return `${formatTime(date, { hideSeconds: true })} ${formatDate(date)}`;
		}
	}

	function removeTime() {
		const timer = document.find(".tt-flying-time");
		if (timer) timer.remove();
	}
})();
