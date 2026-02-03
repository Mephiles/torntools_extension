(async () => {
	const scopesList = {
		factions: "faction",
		UserList: "userlist",
		hospital: "hospital",
		jail: "jail",
	};

	const feature = featureManager.registerFeature(
		"User Alias",
		scopesList[getPage()],
		() => Object.keys(settings.userAlias).length > 0,
		addListeners,
		addAlias,
		removeAlias,
		{
			storage: ["settings.userAlias"],
		},
		null
	);

	const SELECTORS: Record<string, { items: string }> = {
		UserList: { items: ".user-info-list-wrap > li[class*='user'] .user.name" },
		factions: { items: ".members-list .table-body > li .user.name" },
		hospital: { items: ".user-info-list-wrap > li .user.name" },
		jail: { items: ".user-info-list-wrap > li .user.name" },
	};

	function addListeners() {
		document.addEventListener("click", (event) => {
			if (feature.enabled() && isElement(event.target) && event.target.closest(".pagination-wrap a[href]")) addAlias();
		});
		if (typeof isOwnFaction !== "undefined" && isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(() => {
				if (feature.enabled()) addAlias();
			});
		}
	}

	async function addAlias() {
		removeAlias();

		const currentSelector = SELECTORS[getPage() as keyof typeof SELECTORS];
		await requireElement(currentSelector.items);
		const list = document.findAll<HTMLAnchorElement>(currentSelector.items);
		list.forEach((li) => {
			const liID = li.href.split("?XID=")[1].getNumber();
			if (!settings.userAlias[liID]) return;

			const aliasSpan = elementBuilder({ type: "span", class: "tt-user-alias-list", text: settings.userAlias[liID].alias });
			li.insertAdjacentElement("afterend", aliasSpan);
		});
	}

	function removeAlias() {
		document.findAll(".tt-user-alias-list").forEach((x) => x.remove());
	}
})();
