"use strict";

// Reformat profile page headings as "USERNAME [ID]".

(async () => {
	if (!getPageStatus().access) return;

	const IDs = {
		faction: null,
		player: null,
	};

	const query = getSearchParameters();
	const isOwnFaction = query.get("step").toLowerCase() === "your";

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
		if (isOwnFaction) {
			userdata.faction.faction_id ? (IDs.faction = userdata.faction.faction_id) : (IDs.player = userdata.player_id);
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (!feature.enabled || !settings.pages.faction.idBesideFactionName) return;

				addID();
			});
		} else
			switch (true) {
				case !isNaN(parseInt(query.get("ID"))):
					IDs.faction = parseInt(query.get("ID"));
					return addID();
				case !isNaN(parseInt(query.get("userID"))):
					IDs.player = parseInt(query.get("userID"));
					return addID();
				default:
					return false;
			}
	}

	async function addID() {
		if (!IDs.faction && !IDs.player) throw new Error("Neither Faction nor User ID could be parsed from the URL.");
		console.log(IDs);
		if (isOwnFaction) {
			if (getHashParameters().get("tab") !== "info") return false;
			const [id, container] = await Promise.all([getID(), requireElement("#react-root-faction-info .faction-info-wrap .title-black[role='heading']")]);
			container.firstChild.textContent += ` [${id}]`;
		} else {
			const [id, container] = await Promise.all([getID(), requireCondition(checkForFactionName)]);
			container.firstChild.textContent += ` [${id}]`;
		}

		async function getID() {
			if (!IDs.faction && !IDs.player) throw "Neither Faction nor User ID could be parsed from the URL.";
			if (IDs.faction) return IDs.faction;
			else return await fetchData("torn", { section: "user", selections: ["profile"], id: IDs.player }).then((j) => j.faction.faction_id);
		}

		function checkForFactionName() {
			const container = document.find(".faction-info-wrap .title-black[role='heading']");
			return container?.childNodes.length > 1 ? container : false;
		}
	}

	async function removeID() {
		if (isOwnFaction) {
			if (getHashParameters().get("tab") !== "info") return false;
			const container = document.find("#react-root-faction-info .faction-info-wrap .title-black[role='heading']");
			container.textContent = removeIDFromString(container.textContent);
		} else {
			const container = document.find(".faction-info-wrap .title-black[role='heading']");
			container.textContent = removeIDFromString(container.textContent);
		}

		function removeIDFromString(string) {
			const arr = string.split("[");
			arr.pop();
			return arr.join("[");
		}
	}
})();
