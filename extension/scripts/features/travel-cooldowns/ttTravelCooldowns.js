"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isFlying()) return;

	const feature = featureManager.registerFeature(
		"Travel Cooldowns",
		"travel",
		() => settings.pages.travel.cooldownWarnings,
		initialiseListeners,
		showWarnings,
		removeWarnings,
		{
			storage: ["settings.pages.travel.cooldownWarnings"],
		},
		async () => {
			if (
				!hasAPIData() ||
				!settings.apiUsage.user.bars ||
				!settings.apiUsage.user.cooldowns ||
				!settings.apiUsage.user.education ||
				!settings.apiUsage.user.money
			)
				return "No API access.";

			await checkDevice();
		}
	);

	function initialiseListeners() {
		const handler = () => {
			if (!feature.enabled()) return;

			showWarnings();
		};

		if (mobile || tablet) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY].push(handler);
			CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(handler);
		} else {
			CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_DESTINATION_UPDATE].push(handler);
		}
	}

	async function showWarnings() {
		const container = await requireElement(
			mobile || tablet ? "[class*='destinationList___'] .expanded[class*='destination___']" : "[class*='destinationPanel___']"
		);
		if (!container) return;

		const durationText = container.querySelector(
			["[class*='flightDetailsGrid'] > :nth-child(2) span[aria-hidden]", "[class*='confirmPanel___'] p:nth-child(2) [class*='emphasis___']"].join(", ")
		)?.textContent;
		if (!durationText) return;

		const duration = textToTime(durationText) * 2;
		let cooldowns = container.parentElement.find(".tt-cooldowns");
		if (!cooldowns) {
			cooldowns = document.newElement({
				type: "div",
				class: "tt-cooldowns",
				children: [
					document.newElement({
						type: "div",
						class: "travel-wrap",
						children: [
							document.newElement({
								type: "div",
								class: ["cooldown", "energy", getDurationClass(userdata.energy.fulltime)],
								text: "Energy",
							}),
							document.newElement({ type: "div", class: ["cooldown", "nerve", getDurationClass(userdata.nerve.fulltime)], text: "Nerve" }),
							document.newElement({ type: "div", class: ["cooldown", "drug", getDurationClass(userdata.cooldowns.drug)], text: "Drug" }),
							document.newElement({
								type: "div",
								class: ["cooldown", "booster", getDurationClass(userdata.cooldowns.booster)],
								text: "Booster",
							}),
							document.newElement({
								type: "div",
								class: ["cooldown", "medical", getDurationClass(userdata.cooldowns.medical)],
								text: "Medical",
							}),
						],
					}),
					document.newElement({ type: "div", class: "patter-right" }),
					document.newElement({ type: "div", class: "clear" }),
				],
			});

			if (!hasFinishedEducation() || userdata.education_current > 0)
				cooldowns.insertAdjacentElement(
					"afterend",
					document.newElement({
						type: "div",
						class: ["cooldown", "education", getDurationClass(userdata.education_timeleft)],
						text: "Your education course will end before you return!",
					})
				);

			const investmentMessage = userdata.city_bank.time_left
				? "Your bank will be ready for investment before you return!"
				: "You have no bank investment going on.";
			cooldowns.insertAdjacentElement(
				"afterend",
				document.newElement({
					type: "div",
					class: ["cooldown", "investment", getDurationClass(userdata.city_bank.time_left)],
					text: investmentMessage,
				})
			);
		} else {
			handleClass(cooldowns.find(".energy"), userdata.energy.fulltime);
			handleClass(cooldowns.find(".nerve"), userdata.nerve.fulltime);
			handleClass(cooldowns.find(".drug"), userdata.cooldowns.drug);
			handleClass(cooldowns.find(".booster"), userdata.cooldowns.booster);
			handleClass(cooldowns.find(".medical"), userdata.cooldowns.medical);
			if (!hasFinishedEducation()) handleClass(cooldowns.parentElement.find(".education"), userdata.education_timeleft);
			handleClass(cooldowns.parentElement.find(".investment"), userdata.city_bank.time_left);
		}

		if (!mobile && !tablet) container.insertAdjacentElement("beforebegin", cooldowns);
		else {
			container.find("[class*='expandable___']").insertAdjacentElement("afterend", cooldowns);
		}

		function getDurationClass(time) {
			return time * 1000 < duration ? "waste" : "";
		}

		function handleClass(element, time) {
			if (!element) return;

			const isWasted = time * 1000 < duration;

			if (isWasted !== element.classList.contains("waste")) element.classList.toggle("waste");
		}
	}

	function removeWarnings() {
		document.findAll(".tt-cooldowns, .tt-cooldowns ~ .cooldown").forEach((cooldown) => cooldown.remove());
	}
})();
