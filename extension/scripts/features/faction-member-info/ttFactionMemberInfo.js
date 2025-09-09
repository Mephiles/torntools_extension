"use strict";

(async () => {
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Member Info",
		"faction",
		() => settings.pages.faction.memberInfo,
		addListener,
		addInfo,
		removeInfo,
		{
			storage: ["settings.pages.faction.memberInfo"],
		},
		() => {
			if (!hasFactionAPIAccess()) return "No API access!";
		},
		{ liveReload: true }
	);

	let lastActionState = settings.scripts.lastAction.factionMember;

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (!feature.enabled()) return;

			await addInfo(true);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(async ({ name }) => {
			if (!feature.enabled()) return;

			if (name === "Last Action") {
				lastActionState = true;
				await addInfo(true);
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_DISABLED].push(async ({ name }) => {
			if (!feature.enabled()) return;

			if (name === "Last Action") {
				lastActionState = false;
				await addInfo(true);
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_FILTER].push(({ hasResults }) => {
			if (!feature.enabled()) return;

			removeInfo();
			if (hasResults) addInfo(true);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_NATIVE_SORT].push(() => {
			if (!feature.enabled()) return;

			removeInfo();
			addInfo(true);
		});
	}

	async function addInfo(force) {
		if (!force) return;
		removeInfo();

		await requireElement(".members-list .table-body > li");
		if (lastActionState) await requireElement(".members-list .table-body.tt-modified > .tt-last-action");

		let donations;
		if (ttCache.hasValue("faction-members-donations", userdata.faction.id)) {
			donations = ttCache.get("faction-members-donations", userdata.faction.id);
		} else {
			// FIXME - Migrate to V2 (faction/donations -> faction/balance).
			donations = (await fetchData("torn", { section: "faction", selections: ["donations"], silent: true, succeedOnError: true })).donations;

			ttCache.set({ [userdata.faction.id]: donations }, TO_MILLIS.SECONDS * 60, "faction-members-donations").then(() => {});
		}

		if (!donations) {
			console.log("TT - Failed to load donations.");
			return;
		}

		document.findAll(".members-list .table-body > li").forEach((li) => {
			const userID = getUsername(li).id;
			if (!donations[userID] || (!donations[userID].points_balance && !donations[userID].money_balance)) return;

			// Don't show this for fallen players.
			if (li.find(".icons li[id*='icon77___']")) return;

			const memberInfo = document.newElement({ type: "div", class: "tt-member-info" });
			const parent = lastActionState && li.nextSibling?.className?.includes("tt-last-action") ? li.nextSibling : memberInfo;

			if (donations[userID].points_balance) {
				parent.appendChild(
					document.newElement({
						type: "div",
						class: "tt-points-balance",
						text: `Point Balance: ${formatNumber(donations[userID].points_balance)}`,
					})
				);
			}
			if (donations[userID].money_balance) {
				parent.appendChild(
					document.newElement({
						type: "div",
						class: "tt-money-balance",
						text: `Money Balance: ${formatNumber(donations[userID].money_balance, { currency: true })}`,
					})
				);
			}

			if (lastActionState && li.nextSibling?.className?.includes("tt-last-action")) {
				li.nextSibling.classList.add("tt-modified");
			} else if (memberInfo.hasChildNodes()) {
				li.insertAdjacentElement("afterend", memberInfo);
			}
		});
	}

	function removeInfo() {
		document.findAll(".tt-member-info, .tt-points-balance, .tt-money-balance").forEach((x) => x.remove());
		document.findAll(".tt-last-action.tt-modified").forEach((x) => x.classList.remove("modified"));
	}
})();
