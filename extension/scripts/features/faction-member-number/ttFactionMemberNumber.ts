(async () => {
	const feature = featureManager.registerFeature(
		"Member rank",
		"faction",
		() => settings.pages.faction.numberMembers,
		addListener,
		addNumbers,
		removeNumbers,
		{
			storage: ["settings.pages.faction.numberMembers"],
		},
		null
	);

	function addListener() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (!feature.enabled()) return;

				addNumbers(true);
			});
		}

		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(async () => {
			if (!feature.enabled()) return;

			removeNumbers();
			await addNumbers(true);
		});
	}

	async function addNumbers(force: boolean) {
		if (!force && isOwnFaction && getFactionSubpage() !== "info") return;

		if (document.find(".tt-member-index")) return;
		await requireElement(".faction-info-wrap .table-body > .table-row");

		const list = document.find(".faction-info-wrap .members-list");
		if (list.classList.contains("tt-modified")) return;
		list.classList.add("tt-modified");

		let reduced = 0;
		list.findAll(".table-body > .table-row").forEach((row, index) => {
			let text: string;
			if (row.find(".icons li[id*='icon77___']")) {
				text = "-";
				reduced++;
			} else {
				text = (index + 1 - reduced).toString();
			}

			row.insertAdjacentElement("afterbegin", document.newElement({ type: "div", class: "tt-member-index", text }));
		});
	}

	function removeNumbers() {
		document.findAll(".tt-member-index").forEach((element) => element.remove());
		document.find(".faction-info-wrap .members-list.tt-modified")?.classList.remove("tt-modified");
	}
})();
