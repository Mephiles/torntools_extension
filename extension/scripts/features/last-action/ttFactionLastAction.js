"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Last Action",
		"last action",
		() => settings.scripts.lastAction.factionMember,
		addListener,
		addLastAction,
		removeLastAction,
		{
			storage: ["settings.scripts.lastAction.factionMember"],
		},
		() => {
			if (!hasAPIData()) return "No API access!";
		},
		{ triggerCallback: true, liveReload: true }
	);

	function addListener() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
				if (!feature.enabled()) return;

				await addLastAction(true);
			});
		}
	}

	async function addLastAction(force) {
		if (isOwnFaction && !force) return;
		if (document.find(".tt-last-action")) return;

		await requireElement(".members-list .table-body > li");

		const id = isOwnFaction ? "own" : parseInt(document.find(".faction-info-wrap .faction-info").dataset.faction);
		if (!id) return;

		let members;
		if (ttCache.hasValue("faction-members", id)) {
			members = ttCache.get("faction-members", id);
		} else {
			members = (
				await fetchData("torn", {
					section: "faction",
					...(isNaN(id) ? {} : { id }),
					selections: ["basic"],
					silent: true,
					succeedOnError: true,
				})
			).members;

			ttCache.set({ [id]: members }, TO_MILLIS.SECONDS * 30, "faction-members").then(() => {});
		}

		const list = document.find(".members-list .table-body");
		list.classList.add("tt-modified");
		const nowDate = Date.now();
		let maxHours = 0;
		list.findAll(":scope > li").forEach((row) => {
			const userID = getUsername(row).id;
			const hours = ((nowDate - members[userID].last_action.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals();

			const element = document.newElement({
				type: "div",
				class: "tt-last-action",
				text: `Last action: ${members[userID].last_action.relative}`,
				attributes: {
					hours: hours,
				},
			});
			if (row.classList.contains("tt-hidden")) element.classList.add("tt-hidden");

			row.insertAdjacentElement("afterend", element);
			if (hours > maxHours) maxHours = hours;
		});
		list.setAttribute("max-hours", maxHours);
	}

	function removeLastAction() {
		const list = document.find(".members-list .table-body.tt-modified");
		if (list) {
			list.findAll(":scope > div.tt-last-action").forEach((x) => x.remove());
			list.classList.remove("tt-modified");
		}
	}
})();
