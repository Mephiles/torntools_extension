"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"OC NNB",
		"faction",
		() => settings.pages.faction.ocNnb,
		initialiseListeners,
		startFeature,
		removeNNBs,
		{
			storage: ["settings.pages.faction.ocNnb", "settings.external.yata"],
		},
		async () => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.yata && !settings.external.tornstats) return "YATA or TornStats not enabled";
			else if (!!userdata.organizedCrime) return "No OC 1 data.";

			await checkDevice();
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(() => {
			if (!feature.enabled()) return;

			showNNB();
		});
	}

	function startFeature() {
		if (!document.find(".faction-crimes-wrap")) return;

		showNNB();
	}

	async function showNNB() {
		const data = await loadData().catch((error) => console.error("TT - Unhandled error. Report this to the TornTools developers!", error));
		if (!data) return;

		populateCrimes();
		populateSelection();

		async function loadData() {
			const data = {};

			if (settings.external.tornstats) await loadTornstats();
			if (settings.external.yata) await loadYATA();

			return data;

			async function loadTornstats() {
				let result;
				if (ttCache.hasValue("crimes", "tornstats")) {
					result = ttCache.get("crimes", "tornstats");
				} else {
					try {
						result = await fetchData(FETCH_PLATFORMS.tornstats, { section: "faction/crimes", relay: true });

						if (result.status) {
							ttCache.set({ tornstats: result }, TO_MILLIS.HOURS, "crimes").then(() => {});
						}
					} catch (error) {
						console.log("TT - Failed to load crimes from TornStats.", error);
						return;
					}
				}

				if (result.status) {
					for (const [user, value] of Object.entries(result.members)) {
						if (user in data) {
							data[user].nnb = value.natural_nerve;
							data[user].degree = !!value.psych_degree;
							data[user].federal_judge = !!value.federal_judge;
							data[user].merits = value.crime_success;
							data[user].verified = !!value.verified;
						} else {
							data[user] = {
								nnb: value.natural_nerve,
								degree: !!value.psych_degree,
								federal_judge: !!value.federal_judge,
								merits: value.crime_success,
								verified: !!value.verified,
							};
						}
					}
				}
			}

			async function loadYATA() {
				let result;
				if (ttCache.hasValue("crimes", "yata")) {
					result = ttCache.get("crimes", "yata");
				} else {
					try {
						result = await fetchData("yata", { section: "faction/crimes/export", includeKey: true, relay: true });

						ttCache.set({ yata: result }, TO_MILLIS.HOURS, "crimes").then(() => {});
					} catch (error) {
						console.log("TT - Failed to load crimes from YATA.", error);
						return;
					}
				}

				for (const [user, value] of Object.entries(result.members)) {
					if (!value.NNB) continue;

					if (user in data) {
						const { verified, nnb } = data[user];
						if (!verified && nnb !== value.NNB) data[user].nnb = value.NNB;
					} else {
						data[user] = {
							nnb: value.NNB,
							verified: true,
						};
					}
				}
			}
		}

		function populateCrimes() {
			for (const row of document.findAll(".organize-wrap .crimes-list .details-list > li > ul")) {
				row.findAll(`.level${mobile ? ", .member, .stat" : ""}`).forEach((element) => element.classList.add("tt-modified"));

				const stat = row.find(".stat");
				if (row.classList.contains("title")) {
					stat.parentElement.insertBefore(
						document.newElement({
							type: "li",
							class: "tt-nnb",
							text: "NNB",
							children: [document.newElement({ type: "div", class: "t-delimiter" })],
						}),
						stat
					);
					continue;
				}

				const id = row.find(".h").getAttribute("href").split("XID=")[1];
				if (id in data) {
					const { nnb, verified } = data[id];

					stat.insertAdjacentElement("beforebegin", document.newElement({ type: "li", class: "tt-nnb", text: `${verified ? "" : "*"}${nnb}` }));
				} else {
					stat.insertAdjacentElement("beforebegin", document.newElement({ type: "li", class: "tt-nnb", text: "N/A" }));
				}
			}
		}

		function populateSelection() {
			for (const row of document.findAll(".plans-list .item")) {
				row.findAll(`.offences${mobile ? ", .member, .level, .act" : ""}`).forEach((element) => element.classList.add("tt-modified"));

				const act = row.find(".act");
				if (row.classList.contains("title")) {
					act.parentElement.insertBefore(
						document.newElement({
							type: "li",
							class: "tt-nnb short",
							text: "NNB",
							children: [document.newElement({ type: "div", class: "t-delimiter" })],
						}),
						act
					);
					continue;
				}

				const id = row.find(".h").getAttribute("href").split("XID=")[1];
				if (id in data) {
					const { nnb, verified } = data[id];

					act.insertAdjacentElement("beforebegin", document.newElement({ type: "li", class: "tt-nnb short", text: `${verified ? "" : "*"}${nnb}` }));
				} else {
					act.insertAdjacentElement("beforebegin", document.newElement({ type: "li", class: "tt-nnb short", text: "N/A" }));
				}
			}
		}
	}

	function removeNNBs() {
		for (const nnb of document.findAll(".tt-nnb")) nnb.remove();
		for (const nnb of document.findAll(".crimes-list ul.plans-list .tt-modified")) nnb.remove();
	}
})();
