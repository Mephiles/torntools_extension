(async () => {
	const { mobile } = await checkDevice();

	const feature = featureManager.registerFeature(
		"Show Faction Spy",
		"faction",
		() => settings.pages.faction.showFactionSpy,
		registerListeners,
		fetchAndAddSpies,
		removeSpies,
		{
			storage: [
				"settings.pages.faction.showFactionSpy",
				"settings.external.tornstats",
				"settings.external.yata",
				"scripts.statsEstimate.global",
				"scripts.statsEstimate.factions",
				"scripts.statsEstimate.wars",
				"scripts.statsEstimate.rankedWars",
			],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.tornstats && !settings.external.yata) return "Both TornStats and YATA are disabled.";
			else if (
				settings.scripts.statsEstimate.global &&
				settings.scripts.statsEstimate.factions &&
				settings.scripts.statsEstimate.wars &&
				settings.scripts.statsEstimate.rankedWars
			)
				return "Stats Estimate is not disabled for any of factions, wars or ranked wars.";

			return true;
		}
	);

	function registerListeners() {
		window.addEventListener("hashchange", async (e) => {
			if (!feature.enabled()) return;

			if (e.newURL.includes("#/war/rank")) await fetchAndAddSpies();
			else removeSpies(true);
		});
	}

	async function fetchAndAddSpies() {
		removeSpies();

		if (location.hash.includes("#/war/rank")) await showRWSpies();

		// No need for members spies of user's faction.
		if (isOwnFaction) return;

		// Add spy data to members list.
		const factionDetails = await readFactionDetails();
		if (!factionDetails) throw new Error("Faction ID could not be found.");

		const spies = await fetchSpies(factionDetails.id);

		await requireElement(".members-list .table-body > li .status");

		const tableBody = document.querySelector(".members-list .table-body");
		tableBody.classList.add("tt-modified-faction-spy");

		[...tableBody.children].forEach((row) => {
			const memberID = row.querySelector(".member.icons [href*='/profiles.php']")?.getAttribute("href").split("XID=")[1];
			if (!memberID) return;
			let spyData = spies[memberID];

			let statFields = [];
			let title = "";
			if (spyData) {
				for (const stat of ["strength", "defense", "speed", "dexterity", "total"])
					spyData[stat] = formatNumber(spyData[stat], { shorten: 3, decimals: 3 });
				spyData.timestamp = formatTime({ seconds: spyData.timestamp as number }, { type: "ago", short: true });

				const allFields = [
					`Strength: ${spyData.strength}`,
					`Defense: ${spyData.defense}`,
					`Speed: ${spyData.speed}`,
					`Dexterity: ${spyData.dexterity}`,
					`Total: ${spyData.total}`,
					`⏱: ${spyData.timestamp}`,
				];

				statFields = allFields.slice(mobile ? 4 : 0).map((text) => elementBuilder({ type: "div", text: text }));
				title = allFields.join("\n");
			} else statFields.push(elementBuilder({ type: "div", text: "No spy found." }));

			const spyElement = elementBuilder({
				type: "div",
				class: "tt-faction-spy",
				children: statFields,
				attributes: { title },
			});
			row.appendChild(spyElement);
		});
	}

	async function showRWSpies() {
		const enemiesMembersList = await requireElement(".act[class*='warListItem__'] ~ .descriptions .faction-war .enemy-faction.left .members-list");
		const enemyFactionID = enemiesMembersList.querySelector("a[href*='/factions.php?step=profile&ID=']").getAttribute("href").split("ID=")[1];

		const spies = await fetchSpies(enemyFactionID);

		[...enemiesMembersList.children].forEach((row) => {
			const memberID = row.querySelector("a[href*='/profiles.php']").getAttribute("href").split("XID=")[1];
			let spyData = spies[memberID];

			let statFields = [];
			let title = "";
			if (spyData) {
				for (const stat of ["strength", "defense", "speed", "dexterity", "total"])
					spyData[stat] = formatNumber(spyData[stat], { shorten: 3, decimals: 3 });
				spyData.timestamp = formatTime({ seconds: spyData.timestamp as number }, { type: "ago", short: true });

				const allFields = [
					`Strength: ${spyData.strength}`,
					`Defense: ${spyData.defense}`,
					`Speed: ${spyData.speed}`,
					`Dexterity: ${spyData.dexterity}`,
					`Total: ${spyData.total}`,
					`⏱: ${spyData.timestamp}`,
				];

				statFields = allFields.slice(4).map((text) => elementBuilder({ type: "div", text: text }));
				title = allFields.join("<br>");
			} else statFields.push(elementBuilder({ type: "div", text: "No spy found." }));

			const spyElement = elementBuilder({
				type: "div",
				class: "tt-faction-rw-spy",
				children: statFields,
				attributes: { title },
			});
			row.appendChild(spyElement);
		});
	}

	interface Spy {
		strength: number;
		defense: number;
		speed: number;
		dexterity: number;
		total: number;
		timestamp: number | string;
	}

	async function fetchSpies(factionID: number) {
		let spies: Record<string, Spy> = {};

		if (settings.external.tornstats) {
			let data: TornstatsFactionSpyResponse;
			if (ttCache.hasValue("faction-spy-tornstats", factionID)) data = ttCache.get<TornstatsFactionSpyResponse>("faction-spy-tornstats", factionID);
			else {
				data = await fetchData<TornstatsFactionSpyResponse>(FETCH_PLATFORMS.tornstats, { section: "spy/faction", id: factionID });
				void ttCache.set({ [factionID]: data }, TO_MILLIS.HOURS, "faction-spy-tornstats");
			}

			if (data.status && data.faction.spies) {
				for (const memberID of Object.keys(data.faction.members)) spies[memberID] = data.faction.members[memberID].spy;
			}
		} else if (settings.external.yata) {
			let data: YATASpyResponse;
			if (ttCache.hasValue("faction-spy-yata", factionID)) data = ttCache.get<YATASpyResponse>("faction-spy-yata", factionID);
			else {
				data = await fetchData<YATASpyResponse>("yata", { relay: true, section: "spies", includeKey: true, params: { faction: factionID } });
				void ttCache.set({ [factionID]: data }, TO_MILLIS.HOURS, "faction-spy-yata");
			}

			if (Object.keys(data.spies).length) {
				for (const [memberID, spyData] of Object.entries(data.spies))
					spies[memberID] = {
						strength: spyData.strength,
						defense: spyData.defense,
						speed: spyData.speed,
						dexterity: spyData.dexterity,
						total: spyData.total,
						timestamp: spyData.update,
					};
			}
		} else throw new Error("Please enable TornStats or YATA.");

		// Sometimes, the modifications of the `spies` object causes unnecessary
		// modifications during storage. Returning a clone instead.
		return window.structuredClone(spies);
	}

	function removeSpies(onlyRWSpies = false) {
		if (!onlyRWSpies) {
			document.querySelector(".tt-modified-faction-spy")?.classList.remove("tt-modified-faction-spy");
			findAllElements(".tt-faction-spy").forEach((x) => x.remove());
		}
		findAllElements(".tt-faction-rw-spy").forEach((x) => x.remove());
	}
})();
