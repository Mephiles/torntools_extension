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

	const { mobile, tabletVertical } = await checkDevice();

	function initialise() {
		if (mobile || tabletVertical) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY].push(() => {
				if (!feature.enabled()) return;

				showTime();
			});
			CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(() => {
				if (!feature.enabled()) return;

				showTime();
			});
		} else {
			CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE].push(() => {
				if (!feature.enabled()) return;

				showTime();
			});
		}
	}

	async function showTime() {
		const container = await requireElement(
			mobile || tabletVertical ? "[class*='destinationList___'] .expanded[class*='destination___']" : "[class*='destinationPanel___']"
		);
		if (!container) return;

		const durationText = container.querySelector(
			["[class*='flightDetailsGrid'] > :nth-child(2) span[aria-hidden]", "[class*='confirmPanel___'] p:nth-child(2) [class*='emphasis___']"].join(", ")
		)?.textContent;
		if (!durationText) return;

		const duration = textToTime(durationText);

		const now = new Date();
		const arrivalTime = new Date(now.getTime() + duration);
		const returnTime = new Date(now.getTime() + duration * 2);

		const text = `Landing at ${format(arrivalTime)} | Return at ${format(returnTime)}`;

		let timer = document.find(".tt-flying-time");
		if (timer) timer.textContent = text;
		else {
			document.find("#travel-root").appendChild(document.newElement({ type: "span", class: "tt-flying-time", text }));
		}
		function format(date: Date) {
			if (date.getDate() === now.getDate()) return formatTime(date, { hideSeconds: true });
			else return `${formatTime(date, { hideSeconds: true })} ${formatDate(date)}`;
		}
	}

	function removeTime() {
		const timer = document.find(".tt-flying-time");
		if (timer) timer.remove();
	}
})();
