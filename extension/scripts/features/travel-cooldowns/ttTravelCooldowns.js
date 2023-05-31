"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isFlying() || isAbroad()) return;

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

		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY].push(handler);
		if (mobile || tablet) CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(handler);
		else CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_SELECT_TYPE].push(removeWarnings);
	}

	function showWarnings() {
		const container = document.find(
			mobile || tablet
				? "#tab-menu4 [id*='tab4-'][aria-hidden='false'] .travel-info-table-list[aria-selected*='true']"
				: ".travel-agency div[aria-expanded='true'] .travel-container.full-map[style='display: block;']"
		);
		if (!container) return;

		const element = mobile || tablet ? container.find(".flight-time-table") : container.find(".flight-time");
		if (!element) return;

		const duration = textToTime(mobile || tablet ? element.textContent.trim() : element.textContent.match(/(?<=- ).*/g)[0]) * 2;

		let cooldowns =
			mobile || tablet
				? container.parentElement.find(".show-confirm[aria-expanded='true'] .tt-cooldowns")
				: container.parentElement.find(".tt-cooldowns");
		if (!cooldowns) {
			cooldowns = document.newElement({
				type: "div",
				class: "tt-cooldowns",
				children: [
					document.newElement({ type: "div", class: "patter-left" }),
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

			if (!mobile && !tablet) container.insertAdjacentElement("beforebegin", cooldowns);
			else {
				container.parentElement.find(".show-confirm[aria-expanded='true'] .travel-container").insertAdjacentElement("afterend", cooldowns);
			}

			if (!hasFinishedEducation())
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
				document.newElement({ type: "div", class: ["cooldown", "investment", getDurationClass(userdata.city_bank.time_left)], text: investmentMessage })
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

		function getDurationClass(time) {
			return time * 1000 < duration ? "waste" : "";
		}

		function handleClass(element, time) {
			const isWasted = time * 1000 < duration;

			if (isWasted !== element.classList.contains("waste")) element.classList.toggle("waste");
		}
	}

	function removeWarnings() {
		document.findAll(".tt-cooldowns, .tt-cooldowns ~ .cooldown").forEach((cooldown) => cooldown.remove());
	}
})();
