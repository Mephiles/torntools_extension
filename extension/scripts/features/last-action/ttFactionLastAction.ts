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

			return true;
		},
		{ triggerCallback: true, liveReload: true }
	);

	let _members: FactionMember[] | undefined;

	function addListener() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (!feature.enabled()) return;

				addLastAction(true);
			});
		}
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(({ hasResults }) => {
			if (!feature.enabled()) return;

			removeLastAction();
			if (hasResults) addLastAction(true);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_SORT].push(() => {
			if (!feature.enabled()) return;

			removeLastAction();
			addLastAction(true);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE].push(() => {
			if (!feature.enabled()) return;

			removeLastAction();
			addLastAction(true);
		});
	}

	async function addLastAction(force: boolean) {
		if (isOwnFaction && !force) return;
		if (document.find(".tt-last-action")) return;

		await requireElement(".members-list .table-body > li");

		const id = isOwnFaction ? "own" : (await readFactionDetails()).id;
		if (!id) return;

		const members = await loadMembers(id);

		const list = document.find(".members-list .table-body");
		list.classList.add("tt-modified");
		const nowDate = Date.now();
		let maxHours = 0;
		list.findAll(":scope > li.table-row").forEach((row) => {
			// Don't show this for fallen players.
			if (row.find(".icons li[id*='icon77___']")) return;

			const userID = getUsername(row).id;
			const member = members.find((m) => m.id === userID);
			if (!member) return;
			const hours = ((nowDate - member.last_action.timestamp * 1000) / TO_MILLIS.HOURS).dropDecimals();

			const element = document.newElement({
				type: "div",
				class: "tt-last-action",
				text: `Last action: ${member.last_action.relative}`,
				attributes: {
					hours: hours,
				},
			});
			if (row.classList.contains("tt-hidden")) element.classList.add("tt-hidden");

			row.insertAdjacentElement("afterend", element);
			if (hours > maxHours) maxHours = hours;
		});
		list.setAttribute("max-hours", maxHours.toString());

		async function loadMembers(id: number | "own") {
			if (!_members) {
				if (ttCache.hasValue("faction-members", id)) {
					_members = ttCache.get<FactionMember[]>("faction-members", id);
				} else {
					_members = (
						await fetchData<FactionMembersResponse>("tornv2", {
							section: "faction",
							...(isNaN(parseInt(id.toString())) ? {} : { id }),
							selections: ["members"],
							silent: true,
							succeedOnError: true,
						})
					).members;

					ttCache.set({ [id]: _members }, TO_MILLIS.SECONDS * 30, "faction-members").then(() => {});
				}
			}

			return _members;
		}
	}

	function removeLastAction() {
		const list = document.find(".members-list .table-body.tt-modified");
		if (list) {
			list.findAll(":scope > div.tt-last-action").forEach((x) => x.remove());
			list.classList.remove("tt-modified");
		}
	}
})();
