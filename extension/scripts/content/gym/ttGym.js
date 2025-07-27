"use strict";

(async () => {
	const STATS = {};
	addFetchListener((event) => {
		const { page, json, fetch } = event.detail;

		if (page === "gym") {
			const params = new URL(fetch.url).searchParams;
			const step = params.get("step");

			if (json && step === "getInitialGymInfo") {
				for (let stat in json.stats) {
					STATS[stat] = parseInt(json.stats[stat].value.replaceAll(",", ""));
				}

				requireElement("[class*='skeletonWrapper___']", { invert: true }).then(() => {
					triggerCustomListener(EVENT_CHANNELS.GYM_LOAD, { stats: STATS });
				});
			} else if (json && step === "train") {
				if (!json.success) return;

				STATS[json.stat.name] = parseInt(json.stat.newValue.replaceAll(",", ""));

				triggerCustomListener(EVENT_CHANNELS.GYM_TRAIN, { stats: STATS });
			}
		}
	});

	document.getElementById("gymroot").addEventListener("click", (event) => {
		const target = event.target;
		if (target.tagName !== "BUTTON" || (target.textContent !== "BACK TO GYM" && target.textContent !== "Cancel")) return;

		triggerGymLoadFromDOM();
	});

	triggerGymLoadFromDOM();

	function triggerGymLoadFromDOM() {
		new Promise(async (resolve) => {
			for (let stat of ["strength", "defense", "speed", "dexterity"]) {
				const el = await requireElement(`div[class*='gymContent_'] li[class*='${stat}_'] span[class*='propertyValue_']`);

				STATS[stat] = parseInt(el.textContent.replaceAll(",", ""));
			}

			triggerCustomListener(EVENT_CHANNELS.GYM_LOAD, { stats: STATS });
			resolve();
		}).then(() => {});
	}
})();
