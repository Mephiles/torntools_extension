"use strict";

// Reformat profile page headings as "USERNAME [ID]".

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Faction ID",
		"faction",
		() => settings.pages.faction.idBesideFactionName,
		initialise,
		null,
		removeID,
		{
			storage: ["settings.pages.faction.idBesideFactionName"],
		},
		null
	);

	function initialise() {
		if (isOwnFaction)
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (!feature.enabled() || !settings.pages.faction.idBesideFactionName) return;

				addID();
			});
	}

	async function addID() {
		if (document.getElementById("tt-faction-id")) return; // Element has already been added - second check in-case feature reinjects
		const selector = "div.faction-info-wrap > div.title-black"; // selector is the same for both
		const [id, container] = await Promise.all([getFactionID(), requireElement(selector)]);
		if (!id) throw new Error("Faction ID could not be found.");
		const span = document.newElement({ type: "span", text: ` [${id}]`, id: "tt-faction-id" });
		container.appendChild(span);
	}

	function removeID() {
		document.findAll("#tt-faction-id").forEach((element) => element.remove());
	}

	async function getFactionID() {
		if (isOwnFaction) {
			if (userdata.faction_id) return userdata.faction_id;
			const userID = userdata.player_id;
			if (!userID) return null; // ID could not be found
			return await getFactionIDFromUser(userID);
		}
		const hashparams = getSearchParameters();
		console.log(hashparams.get("ID"), hashparams.get("userID"));
		if (isIntNumber(hashparams.get("ID"))) return parseInt(hashparams.get("ID"));
		if (isIntNumber(hashparams.get("userID"))) return await getFactionIDFromUser(parseInt(hashparams.get("userID")));
		return null; // ID could not be found

		async function getFactionIDFromUser(userID) {
			const cached = ttCache.get("faction-id", userID);
			if (cached) return cached;
			const data = await fetchData("torn", { section: "user", selections: ["profile"], id: userID });
			const factionID = data.faction.faction_id;
			ttCache.set({ [userID]: factionID }, 3.5 * TO_MILLIS.DAYS, "faction-id");
			return factionID;
		}
	}
})();
