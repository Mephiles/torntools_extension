"use strict";

(async () => {
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Armory Worth",
		"faction",
		() => settings.pages.faction.armoryWorth,
		addListener,
		addWorth,
		removeWorth,
		{
			storage: ["settings.pages.faction.armoryWorth"],
		},
		() => {
			if (!hasFactionAPIAccess()) return "No faction API access.";
		},
		{ liveReload: true }
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
			if (feature.enabled()) addWorth(true);
		});
	}

	async function addWorth(force) {
		if (!force) return;

		document.find(".tt-armory-worth")?.remove();

		const moneyLi = (await requireElement("#faction-info .f-info > li")).parentElement;
		// TODO - Migrate to V2 (faction/weapons).
		// TODO - Migrate to V2 (faction/armor).
		// TODO - Migrate to V2 (faction/temporary).
		// TODO - Migrate to V2 (faction/medical).
		// TODO - Migrate to V2 (faction/drugs).
		// TODO - Migrate to V2 (faction/boosters).
		// TODO - Migrate to V2 (faction/cesium).
		// FIXME - Migrate to V2 (faction/currency -> faction/balance).
		const selections = ["weapons", "armor", "temporary", "medical", "drugs", "boosters", "cesium", "currency"];

		if (userdata.faction && ttCache.hasValue("armory", userdata.faction.id)) {
			handleData(ttCache.get("armory", userdata.faction.id));
		} else {
			fetchData("torn", { section: "faction", selections })
				.then((data) => {
					handleData(data);

					ttCache.set({ [data.faction_id]: data }, TO_MILLIS.SECONDS * 30, "armory");
				})
				.catch((err) => {
					console.log("Error fetching armory data: ", err);
					moneyLi.classList.add("tt-modified");
					moneyLi.appendChild(
						document.newElement({
							type: "li",
							class: "tt-armory-worth",
							children: [
								document.newElement({ type: "span", text: "Armory value: ", class: "bold" }),
								document.newElement({
									type: "span",
									text: err.error === "Incorrect ID-entity relation" ? "No faction API access." : "Error during fetching API data.",
								}),
							],
						})
					);
				});
		}

		function handleData(data) {
			let total = 0;
			for (const type of selections) {
				if (data[type]) {
					for (const item of data[type]) {
						total += torndata.items[item.ID].market_value * item.quantity;
					}
				}
			}

			// Cesium
			// if (data.cesium) {
			// }

			// Points
			total += data.points * torndata.pawnshop.points_value;

			moneyLi.classList.add("tt-modified");
			moneyLi.appendChild(
				document.newElement({
					type: "li",
					class: "tt-armory-worth",
					children: [
						document.newElement({ type: "span", text: "Armory value: " }),
						document.newElement({ type: "span", text: formatNumber(total, { currency: true }) }),
					],
				})
			);
		}
	}

	function removeWorth() {
		document.findAll(".tt-armory-worth").forEach((x) => {
			x.parentElement.classList.remove("tt-modified");
			x.remove();
		});
	}
})();
