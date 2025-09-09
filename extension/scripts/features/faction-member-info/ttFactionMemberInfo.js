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

		let balance;
		if (ttCache.hasValue("faction-members-balance", userdata.faction.id)) {
			balance = ttCache.get("faction-members-balance", userdata.faction.id);
		} else {
			balance = (await fetchData("tornv2", { section: "faction", selections: ["balance"], silent: true, succeedOnError: true })).balance;

			ttCache.set({ [userdata.faction.id]: balance }, TO_MILLIS.SECONDS * 60, "faction-members-balance").then(() => {});
		}

		if (!balance) {
			console.log("TT - Failed to load faction balance.");
			return;
		}

		document.findAll(".members-list .table-body > li").forEach((li) => {
			const userID = getUsername(li).id;
			const userBalance = balance.members.find((m) => m.id === userID);
			if (!userBalance || (!userBalance.points && !userBalance.money)) return;

			// Don't show this for fallen players.
			if (li.find(".icons li[id*='icon77___']")) return;

			const memberInfo = document.newElement({ type: "div", class: "tt-member-info" });
			const parent = lastActionState && li.nextSibling?.className?.includes("tt-last-action") ? li.nextSibling : memberInfo;

			if (userBalance.points) {
				parent.appendChild(
					document.newElement({
						type: "div",
						class: "tt-points-balance",
						text: `Point Balance: ${formatNumber(userBalance.points)}`,
					})
				);
			}
			if (userBalance.money) {
				parent.appendChild(
					document.newElement({
						type: "div",
						class: "tt-money-balance",
						text: `Money Balance: ${formatNumber(userBalance.money, { currency: true })}`,
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
