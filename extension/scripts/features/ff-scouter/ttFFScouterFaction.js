"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const SCOUTER_SERVICE = scouterService();

	const feature = featureManager.registerFeature(
		"FF Scouter Faction",
		"ff-scouter",
		() => settings.scripts.ffScouter.factionList,
		initialise,
		showFF,
		removeFF,
		{
			storage: ["settings.scripts.ffScouter.factionList", "settings.external.ffScouter"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.ffScouter) return "FFScouter not enabled.";
		}
	);

	function initialise() {
		if (isOwnFaction) {
			CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
				if (!feature.enabled()) return;

				await showFF(true);
			});
		}
	}

	async function showFF(force) {
		if (isOwnFaction && !force) return;

		await requireElement(".members-list .table-body > li");

		const list = document.find(".members-list .table-body");

		const memberIds = [...list.findAll("[class*='honorWrap___'] a[class*='linkWrap___']")].map((link) =>
			parseInt(new URL(link.href).searchParams.get("XID"))
		);

		SCOUTER_SERVICE.scoutGroup(memberIds)
			.then((scouts) => {
				list.classList.add("tt-modified-ff-scouter");

				const header = document.newElement({
					type: "li",
					class: ["table-cell", "lvl", "torn-divider", "divider-vertical", "tt-ff-scouter-faction-list-header"],
					text: "FF",
					attributes: { tabindex: "0" },
				});
				document.find(".table-header > .lvl").insertAdjacentElement("afterend", header);

				fillFF(list, Object.values(scouts));
			})
			.catch((reason) => {
				console.error("TT - Failed to scout ff for the faction.", reason);
			});
	}

	function fillFF(list, results) {
		list.findAll(":scope > li.table-row").forEach((row) => {
			// Don't show this for fallen players.
			if (row.find(".icons li[id*='icon77___']")) {
				row.dataset.ffScout = "N/A";
				return;
			}

			const userID = getUsername(row).id;
			const scout = results.find((r) => r.player_id === userID);
			if (!scout) {
				row.dataset.ffScout = "N/A";
				row.find(".table-cell.lvl").insertAdjacentElement(
					"afterend",
					document.newElement({
						type: "li",
						class: ["table-cell", "lvl", "tt-ff-scouter-faction-list-value"],
						text: "N/A",
					})
				);
				return;
			}

			const ff = scout.fair_fight;
			row.dataset.ffScout = ff;

			const backgroundColor = ffColor(ff);
			const textColor = contrastFFColor(backgroundColor);

			row.find(".table-cell.lvl").insertAdjacentElement(
				"afterend",
				document.newElement({
					type: "li",
					class: ["table-cell", "lvl", "tt-ff-scouter-faction-list-value"],
					text: ff !== null ? ff.toFixed(2) : "?",
					style: {
						backgroundColor: backgroundColor,
						color: textColor,
					},
				})
			);
		});
	}

	function removeFF() {
		document.find(".tt-ff-scouter-faction-list-header")?.remove();
		document.findAll(".tt-ff-scouter-faction-list-value").forEach((e) => e.remove());
	}
})();
