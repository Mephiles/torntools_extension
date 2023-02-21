"use strict";

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
		if (isInternal && !document.find(".faction-description")) return;

		displayBox();
	}

	async function displayBox() {
		if (isInternal && getHashParameters().get("tab") !== "info") return;

		const { content } = createContainer("Faction Stakeout", {
			class: "mt10",
			nextElement: await requireElement(".faction-info-wrap"),
		});

		const factionId = parseInt(document.find(".faction-info[data-faction]").dataset.faction);
		const hasStakeout = factionId in factionStakeouts && typeof factionStakeouts[factionId] !== "undefined";

		const checkbox = createCheckbox({ description: "Stakeout this faction." });
		checkbox.setChecked(hasStakeout);
		checkbox.onChange(() => {
			if (checkbox.isChecked()) {
				ttStorage.change({
					factionStakeouts: {
						[factionId]: { alerts: { chainReaches: false, memberCountDrops: false, rankedWarStarts: false } },
					},
				});

				alerts.classList.remove("tt-hidden");
			} else {
				ttStorage.change({ factionStakeouts: { [factionId]: undefined } });

				alerts.classList.add("tt-hidden");
			}
		});
		content.appendChild(checkbox.element);

		const chainReaches = createTextbox({ description: { before: "chain reaches" }, type: "text", attributes: { min: 1 }, style: { width: "100px" } });
		chainReaches.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { chainReaches: parseInt(chainReaches.getValue()) || false } } } });
		});

		const memberCountDrops = createTextbox({
			description: { before: "member count drops below", after: "members" },
			type: "number",
			attributes: { min: 1 },
		});
		memberCountDrops.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { memberCountDrops: parseInt(memberCountDrops.getValue()) || false } } } });
		});

		const rankedWarStarts = createCheckbox({ description: "ranked war starts" });
		rankedWarStarts.onChange(() => {
			if (!(factionId in factionStakeouts)) return;

			ttStorage.change({ factionStakeouts: { [factionId]: { alerts: { rankedWarStarts: rankedWarStarts.isChecked() } } } });
		});

		const alerts = document.newElement({
			type: "div",
			class: "alerts",
			children: [chainReaches.element, memberCountDrops.element, rankedWarStarts.element],
		});

		if (hasStakeout) {
			chainReaches.setValue(factionStakeouts[factionId].alerts.chainReaches);
			memberCountDrops.setValue(factionStakeouts[factionId].alerts.memberCountDrops);
			rankedWarStarts.setChecked(factionStakeouts[factionId].alerts.rankedWarStarts);
		} else {
			alerts.classList.add("tt-hidden");
		}

		content.appendChild(alerts);
	}

	function removeBox() {
		removeContainer("Faction Stakeout");
	}
})();
