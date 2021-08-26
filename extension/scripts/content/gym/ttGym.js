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

				triggerCustomListener(EVENT_CHANNELS.GYM_LOAD, { stats: STATS });
			} else if (json && step === "train") {
				if (!json.success) return;

				STATS[json.stat.name] = parseInt(json.stat.newValue.replaceAll(",", ""));

				triggerCustomListener(EVENT_CHANNELS.GYM_TRAIN, { stats: STATS });
			}
		}
	});

	new Promise(async (resolve) => {
		for (let stat of ["strength", "defense", "speed", "dexterity"]) {
			await requireElement(`#${stat}-val`);

			STATS[stat] = parseInt(document.find(`#${stat}-val`).textContent.replaceAll(",", ""));
		}

		triggerCustomListener(EVENT_CHANNELS.GYM_LOAD, { stats: STATS });
		resolve();
	}).then(() => {});
})();
