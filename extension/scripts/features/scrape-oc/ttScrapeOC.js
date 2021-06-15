"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	featureManager.registerFeature("Scrape OC", "faction", true, initialiseListeners, null, null, null, () => {
		if (hasAPIData() && factiondata && !factiondata.isManual) return "Scraping not needed.";
	});

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(readCrimes);
	}

	async function readCrimes() {
		let time;
		const member = document.find(`.crimes-list > li.item-wrap .team > a[href="/profiles.php?XID=${userdata.player_id}"]`);
		if (member) {
			const status = member.closest(".item-wrap").find(".status");

			if (status.innerText === "Ready") time = Date.now();
			else time = Date.now() + textToTime(status.innerText);
		} else {
			time = -1;
		}

		await ttStorage.change({ factiondata: { userCrime: time, isManual: true } });
	}
})();
