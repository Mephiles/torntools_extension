const isOwnFaction = getSearchParameters().get("step") === "your";
(async () => {
	if (isOwnFaction) {
		addXHRListener(({ detail: { page, xhr } }) => {
			if (page === "factions") {
				const params = new URLSearchParams(xhr.requestBody);
				const step = params.get("step");

				if (step === "crimes") {
					loadCrimes().then(() => {});
				} else if (step === "getMoneyDepositors") {
					triggerCustomListener(EVENT_CHANNELS.FACTION_GIVE_TO_USER);
				} else if (step === "upgradeConfirm") {
					if (document.find(".faction-tabs .ui-tabs-active").dataset.case !== "upgrades") return;
					triggerCustomListener(EVENT_CHANNELS.FACTION_UPGRADE_INFO);
				}
			}
		});
		addFetchListener(({ detail: { page, fetch } }) => {
			if (page === "page") {
				const params = new URL(fetch.url).searchParams;
				const sid = params.get("sid");

				if (sid === "factionsProfile") {
					loadInfo().then(() => {});
				} else if (sid === "factionsNews") {
					loadMain().then(() => {});
				} else if (sid === "factionsControlMembers") {
					loadArmory().then(() => {});
				}
			}
		});

		await requireElement(".faction-tabs");

		// document.find(".faction-tabs li[data-case=mainTabContent]").addEventListener("click", loadMain);
		document.find(".faction-tabs li[data-case=armoury]").addEventListener("click", loadArmory);
		// document.find(".faction-tabs li[data-case=controls]").addEventListener("click", loadControls);

		switch (getFactionSubpage()) {
			case "main":
				loadMain().then(() => {});
				break;
			case "info":
				loadInfo().then(() => {});
				break;
			case "crimes":
				loadCrimes().then(() => {});
				break;
			case "armoury":
				loadArmory().then(() => {});
				break;
			case "controls":
				loadControls().then(() => {});
				break;
			default:
				break;
		}

		async function loadMain() {
			await requireElement(".announcement");

			triggerCustomListener(EVENT_CHANNELS.FACTION_MAIN);
		}

		async function loadInfo() {
			await requireElement(".faction-description, .members-list");

			triggerCustomListener(EVENT_CHANNELS.FACTION_INFO);

			loadMemberTable();
		}

		async function loadCrimes() {
			let loaded = false;

			requireElement("#faction-crimes .crimes-list", { maxCycles: 20 })
				.then(() => {
					loaded = true;
					triggerCustomListener(EVENT_CHANNELS.FACTION_CRIMES);
				})
				.catch((cause) => loaded || console.error(cause));
			requireElement("#faction-crimes-root [class*='buttonsContainer___']", { maxCycles: 20 })
				.then(async (buttonsContainer: Element) => {
					loaded = true;

					const list = await requireElement("#faction-crimes-root .page-head-delimiter + div:not([class])");
					await requireElement("[class*='loader___']", { parent: list, invert: true });
					list.classList.add("tt-oc2-list");

					triggerCustomListener(EVENT_CHANNELS.FACTION_CRIMES2);

					new MutationObserver(() => triggerCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_REFRESH)).observe(list, { childList: true });

					buttonsContainer.querySelectorAll("button").forEach((button) => {
						const tabName = button.querySelector("[class*='tabName___']").textContent.trim();

						new MutationObserver(() => {
							if (!button.className.includes("active___")) return;

							triggerCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_TAB, { tabName });
						}).observe(button, { attributes: true, attributeFilter: ["class"] });
					});
				})
				.catch((cause) => loaded || console.error(cause));
		}

		async function loadArmory() {
			const tab = await requireElement("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']");
			await requireElement(":scope > .ajax-preloader", { invert: true, parent: document.getElementById(tab.getAttribute("aria-controls")) });

			triggerCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, { section: getCurrentSection()! });
			new MutationObserver((mutations) => {
				if (
					!mutations.some((mutation) => {
						const addedNodes = [...mutation.addedNodes];

						return addedNodes
							.filter(isElement)
							.some(
								(node) =>
									node.classList.contains("item-list") ||
									(node.tagName === "DIV" && node.classList.contains("p10")) ||
									node.id === "inventory-container"
							);
					})
				)
					return;

				const mutation = mutations.find((mutation) => extractArmorySubcategory((mutation.target as Element).id) !== null);
				if (!mutation) return;

				triggerCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, { section: extractArmorySubcategory((mutation.target as Element).id) });
			}).observe(document.find("#faction-armoury-tabs"), { childList: true, subtree: true });

			function getCurrentSection() {
				const controls = document.find("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']").getAttribute("aria-controls");

				return extractArmorySubcategory(controls);
			}
		}

		async function loadControls() {
			await requireElement(".control-tabs");

			const giveToUser = document.find(".control-tabs > li[aria-controls='option-give-to-user']");

			if (giveToUser) {
				checkGiveToUser();
				giveToUser.addEventListener("click", () => checkGiveToUser());
			}

			function checkGiveToUser() {
				if (document.find(".control-tabs > li[aria-controls='option-give-to-user']").getAttribute("aria-selected")) {
					triggerCustomListener(EVENT_CHANNELS.FACTION_GIVE_TO_USER);
				}
			}
		}
	} else {
		loadMemberTable();
	}

	let observer: MutationObserver | undefined;

	function loadMemberTable() {
		const table = document.find(".members-list .table-body");

		handleFilter();
		handleSorting();
		handleIconUpdates();

		async function handleFilter() {
			const searchInput = await requireElement(".table-header input[class*='searchInput___']");

			searchInput.addEventListener("input", () => {
				disconnectObserver();

				if (table) {
					let handled = false;

					const timeout = setTimeout(() => {
						triggerCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, { hasResults: true });
						disconnectObserver();
						handled = true;
					}, 250);

					observer = new MutationObserver((mutations) => {
						if (handled) return;

						const reduced = Array.from(mutations).filter((mutation) =>
							Array.from(mutation.addedNodes).every((node) => !isElement(node) || !node.classList.contains(".tt-last-action"))
						);
						if (!reduced.length) return;

						handled = true;
						triggerCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, { hasResults: true });
						clearTimeout(timeout);
						disconnectObserver();
					});
					observer.observe(table, { childList: true });
				} else {
					triggerCustomListener(EVENT_CHANNELS.FACTION_NATIVE_FILTER, { hasResults: false });
				}
			});

			function disconnectObserver() {
				if (!observer) return;

				observer.disconnect();
				observer = undefined;
			}
		}

		async function handleSorting() {
			await requireElement(".members-list .table-header .c-pointer");

			for (const header of findAllElements(".members-list .table-header .c-pointer")) {
				header.addEventListener("click", sortListener);
			}

			function sortListener(event: MouseEvent) {
				const isFilter = (event.target as Element).closest("button, input");
				if (isFilter) return;

				const rows = findAllElements(".members-list .table-body .table-row");
				if (!rows.length) return;

				new MutationObserver((_mutations, observer) => {
					triggerCustomListener(EVENT_CHANNELS.FACTION_NATIVE_SORT);
					observer.disconnect();
				}).observe(document.find(".members-list .table-body"), { childList: true });
			}
		}

		async function handleIconUpdates() {
			const memberTable = await requireElement(".members-list .table-body");
			const observer = new MutationObserver((records) => {
				if (records.length > 1) return;

				for (const record of records) {
					const firstRemovedNode = record.removedNodes?.[0] as Element;
					if (!firstRemovedNode?.matches("#iconTray")) continue;

					const oldIconsCount = firstRemovedNode.children.length;
					const newIconsCount = (record.addedNodes?.[0] as Element).children.length;

					if (oldIconsCount > 0 && newIconsCount > 0 && oldIconsCount !== newIconsCount) {
						triggerCustomListener(EVENT_CHANNELS.FACTION_NATIVE_ICON_UPDATE);
						break;
					}
				}
			});
			observer.observe(memberTable, { childList: true, subtree: true });
		}
	}
})();

async function readFactionDetails() {
	const viewWarsLink = document.querySelector<HTMLAnchorElement>("a.view-wars")?.href;
	if (viewWarsLink) {
		const match = viewWarsLink.match(/ranked\/(\d+)/);
		if (match) {
			return { id: parseInt(match[1]) };
		}
	}

	const factionIDLink = document.querySelector<HTMLAnchorElement>(".faction-info a[href*='factionID']");
	if (factionIDLink) {
		const match = factionIDLink.href.match(/#factionID=(\d+)/);
		if (match) {
			return { id: parseInt(match[1]) };
		}
	}

	if (isOwnFaction && hasAPIData()) {
		if (userdata.faction) return { id: userdata.faction.id };

		const userID = userdata.profile.id;
		if (!userID) return null; // ID could not be found

		return { id: await getFactionIDFromUser(userID) };
	}

	const params = getSearchParameters();

	if (isIntNumber(params.get("ID"))) {
		return { id: parseInt(params.get("ID")) };
	}

	if (isIntNumber(params.get("userID")) && hasAPIData()) {
		return { id: await getFactionIDFromUser(parseInt(params.get("userID"))) };
	}

	return null; // ID could not be found

	async function getFactionIDFromUser(userID: number): Promise<number> {
		const cached = ttCache.get("faction-id", userID);
		if (cached) return cached;

		const data = await fetchData<UserFactionResponse>("tornv2", { section: "user", selections: ["faction"], id: userID });
		const factionID = data.faction?.id;

		void ttCache.set({ [userID]: factionID }, TO_MILLIS.DAYS, "faction-id");

		return factionID;
	}
}

function getFactionSubpage() {
	const hash = location.hash.replace("#/", "");
	if (!hash || hash.includes("war/")) return "main";

	const params = getHashParameters();
	if (params.has("tab")) return params.get("tab");

	if (hash.startsWith("#faction-")) {
		return hash.substring("#faction-".length);
	}

	return "";
}

function extractArmorySubcategory(controls: string): string | null {
	const params = new URLSearchParams(controls);

	if (params.has("sub")) {
		return params.get("sub")!;
	}

	if (controls.startsWith("armoury-")) {
		return controls.replace("armoury-", "");
	}

	return null;
}
