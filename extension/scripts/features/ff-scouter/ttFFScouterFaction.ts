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

			return true;
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

	async function showFF(force: boolean) {
		if (isOwnFaction && !force) return;

		await requireElement(".members-list .table-body > li");

		const list = document.querySelector(".members-list .table-body");

		const memberIds = findAllElements<HTMLAnchorElement>("[class*='honorWrap___'] a[class*='linkWrap___']", list).map((link) =>
			parseInt(new URL(link.href).searchParams.get("XID"))
		);

		SCOUTER_SERVICE.scoutGroup(memberIds)
			.then((scouts) => {
				list.classList.add("tt-modified-ff-scouter");

				const header = elementBuilder({
					type: "li",
					class: ["table-cell", "lvl", "torn-divider", "divider-vertical", "tt-ff-scouter-faction-list-header"],
					text: "FF",
					attributes: { tabindex: "0" },
				});
				document.querySelector(".table-header > .lvl").insertAdjacentElement("afterend", header);

				fillFF(list, Object.values(scouts));
			})
			.catch((reason) => {
				console.error("TT - Failed to scout ff for the faction.", reason);
			});
	}

	function fillFF(list: Element, results: ScouterResult[]) {
		findAllElements(":scope > li.table-row", list).forEach((row) => {
			// Don't show this for fallen players.
			if (row.querySelector(".icons li[id*='icon77___']")) {
				row.dataset.ffScout = "N/A";
				return;
			}

			const userID = getUsername(row).id;
			const scout = results.find((r) => r.player_id === userID);
			if ("message" in scout || scout.fair_fight === null) {
				row.dataset.ffScout = "N/A";
				row.querySelector(".table-cell.lvl").insertAdjacentElement(
					"afterend",
					elementBuilder({
						type: "li",
						class: ["table-cell", "lvl", "tt-ff-scouter-faction-list-value"],
						text: "N/A",
					})
				);
				return;
			}

			const ff = scout.fair_fight;
			row.dataset.ffScout = ff.toString();

			const backgroundColor = ffColor(ff);
			const textColor = contrastFFColor(backgroundColor);

			row.querySelector(".table-cell.lvl").insertAdjacentElement(
				"afterend",
				elementBuilder({
					type: "li",
					class: ["table-cell", "lvl", "tt-ff-scouter-faction-list-value"],
					text: ff.toFixed(2),
					style: {
						backgroundColor: backgroundColor,
						color: textColor,
					},
				})
			);
		});
	}

	function removeFF() {
		document.querySelector(".tt-ff-scouter-faction-list-header")?.remove();
		findAllElements(".tt-ff-scouter-faction-list-value").forEach((e) => e.remove());
	}
})();
