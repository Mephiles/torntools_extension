(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	const isInternal = params.get("step") === "your";
	if (!isInternal && params.get("step") !== "profile") return;

	const feature = featureManager.registerFeature(
		"Faction Stakeouts",
		"faction",
		() => settings.pages.faction.stakeout,
		isInternal ? initialiseListeners : null,
		startFeature,
		removeBox,
		{
			storage: ["settings.pages.faction.stakeout"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
			if (!feature.enabled()) return;

			displayBox();
		});
	}

	function startFeature() {
		if (isInternal && !document.querySelector(".faction-description")) return;

		displayBox();
	}

	async function displayBox() {
		if (isInternal && getFactionSubpage() !== "info") return;

		const { content } = createContainer("Faction Stakeout", {
			class: "mt10",
			nextElement: await requireElement(".faction-info-wrap"),
		});

		const factionId = parseInt(
			(await requireElement(".faction-info-wrap .f-war-list .table-row [class*='factionWrap__'] a[href*='/factions.php']"))
				.getAttribute("href")
				.split("&ID=")[1]
		);
		const hasStakeout = factionId in factionStakeouts && typeof factionStakeouts[factionId] === "object" && typeof factionStakeouts[factionId] !== "number";

		const checkbox = createCheckbox({ description: "Stakeout this faction." });
		checkbox.setChecked(hasStakeout);
		checkbox.onChange(() => {
			if (checkbox.isChecked()) {
				ttStorage.change({
					// @ts-expect-error Pre-migration shenanigans
					factionStakeouts: {
						[factionId]: { alerts: { chainReaches: false, memberCountDrops: false, rankedWarStarts: false, inRaid: false, inTerritoryWar: false } },
					},
				});

				alertsWrap.classList.remove("tt-hidden");
			} else {
				ttStorage.change({ factionStakeouts: { [factionId]: undefined } });

				alertsWrap.classList.add("tt-hidden");
				findAllElements<HTMLInputElement>("input[type='text'], input[type='number']", content).forEach((input) => (input.value = ""));
				findAllElements<HTMLInputElement>("input[type='checkbox']", content).forEach((input) => (input.checked = false));
			}
		});
		content.appendChild(checkbox.element);

		const chainReaches = createTextbox({ description: { before: "chain reaches" }, type: "text", attributes: { min: "1" }, style: { width: "100px" } });
		chainReaches.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			let value: number | false = parseInt(chainReaches.getValue());
			if (isNaN(value) || value < 0) value = false;

			// @ts-expect-error Pre-migration shenanigans
			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { chainReaches: value } } } });
		});

		const memberCountDrops = createTextbox({
			description: { before: "member count drops below", after: "members" },
			type: "number",
			attributes: { min: "1" },
		});
		memberCountDrops.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			// @ts-expect-error Pre-migration shenanigans
			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { memberCountDrops: parseInt(memberCountDrops.getValue()) || false } } } });
		});

		const rankedWarStarts = createCheckbox({ description: "ranked war" });
		rankedWarStarts.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			// @ts-expect-error Pre-migration shenanigans
			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { rankedWarStarts: rankedWarStarts.isChecked() } } } });
		});

		const inRaid = createCheckbox({ description: "raid" });
		inRaid.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			// @ts-expect-error Pre-migration shenanigans
			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { inRaid: inRaid.isChecked() } } } });
		});

		const inTerritoryWar = createCheckbox({ description: "territory war" });
		inTerritoryWar.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			// @ts-expect-error Pre-migration shenanigans
			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { inTerritoryWar: inTerritoryWar.isChecked() } } } });
		});

		const alertsWrap = elementBuilder({
			type: "div",
			class: "alerts-wrap",
			children: [
				createAlertSection("General", [chainReaches.element, memberCountDrops.element]),
				createAlertSection("Wars", [rankedWarStarts.element, inRaid.element, inTerritoryWar.element]),
			],
		});

		if (factionId in factionStakeouts && typeof factionStakeouts[factionId] !== "number") {
			chainReaches.setNumberValue(factionStakeouts[factionId].alerts.chainReaches || "");
			memberCountDrops.setNumberValue(factionStakeouts[factionId].alerts.memberCountDrops || "");
			rankedWarStarts.setChecked(factionStakeouts[factionId].alerts.rankedWarStarts);
			inRaid.setChecked(factionStakeouts[factionId].alerts.inRaid);
			inTerritoryWar.setChecked(factionStakeouts[factionId].alerts.inTerritoryWar);
		} else {
			alertsWrap.classList.add("tt-hidden");
		}

		content.appendChild(alertsWrap);

		function createAlertSection(title: string, elements: Element[]) {
			return elementBuilder({
				type: "div",
				class: "alerts",
				children: [elementBuilder({ type: "strong", text: title }), ...elements],
			});
		}
	}

	function removeBox() {
		removeContainer("Faction Stakeout");
	}
})();
