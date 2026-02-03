(async () => {
	await requireFeatureManager();

	const feature = featureManager.registerFeature(
		"Disable Ally Attacks",
		"loader",
		() => settings.pages.profile.disableAllyAttacks && !!settings.alliedFactions.length,
		startListener,
		() => disableAttackButton(null),
		removeWarning,
		{
			storage: ["settings.pages.profile.disableAllyAttacks", "settings.alliedFactions"],
		},
		null
	);

	let closedOption = false;
	async function startListener() {
		addFetchListener(({ detail: { page, json } }) => {
			if (closedOption || !feature.enabled() || page !== "loader" || !json || !json.DB || !json.DB.defenderUser || !json.DB.defenderUser.factionID)
				return;

			disableAttackButton(parseInt(json.DB.defenderUser.factionID));
		});
	}

	async function disableAttackButton(factionID: number | null) {
		if (!factionID) return;
		if (document.find(".tt-disable-ally-attack")) return;

		const selector = mobile || tablet ? "[class*='playerArea__'] [class*='modal__']" : "[class*='players__'] #defender [class*='modal__']";
		if ((hasAPIData() && userdata.faction?.id === factionID) || settings.alliedFactions.some((ally) => ally === factionID)) {
			const node = await requireElement(selector);

			const warning = elementBuilder({
				type: "div",
				class: "tt-disable-ally-attack",
				text: "Blocked by TornTools. This player is an ally. Click here if you are sure to attack.",
			});
			warning.addEventListener("click", (event) => {
				event.preventDefault();
				event.stopImmediatePropagation();

				if (confirm("Are you sure you want to attack this ally?")) {
					(event.target as Element).remove();
					closedOption = true;
				}
			});

			node.insertAdjacentElement("afterbegin", warning);
		}
	}

	function removeWarning() {
		document.findAll(".tt-disable-ally-attack").forEach((x) => x.remove());
	}
})();
