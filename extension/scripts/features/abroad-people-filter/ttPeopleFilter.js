"use strict";

(async () => {
	if (!isAbroad()) return;

	featureManager.registerFeature(
		"People Filter",
		"travel",
		() => settings.pages.travel.peopleFilter,
		null,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.travel.peopleFilter"],
		},
		null
	);

	async function addFilters() {
		await requireElement(".users-list");

		const { content } = createContainer("People Filter", {
			class: "mt10",
			nextElement: document.find(".users-list-title"),
			filter: true,
		});

		const statistics = createStatistics("players");
		content.appendChild(statistics.element);

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const activityFilter = createFilterSection({
			type: "Activity",
			defaults: filters.abroadPeople.activity,
			callback: filtering,
		});
		filterContent.appendChild(activityFilter.element);

		const factionFilter = createFilterSection({
			title: "Faction",
			select: [...defaultFactionsItems, ...getFactions()],
			defaults: "",
			callback: filtering,
		});
		filterContent.appendChild(factionFilter.element);

		const specialFilter = createFilterSection({
			title: "Special",
			ynCheckboxes: ["New Player", "In Company", "In Faction", "Is Donator"],
			defaults: filters.abroadPeople.special,
			callback: filtering,
		});
		filterContent.appendChild(specialFilter.element);

		const statusFilter = createFilterSection({
			title: "Status",
			checkboxes: [
				{ id: "okay", description: "Okay" },
				{ id: "hospital", description: "Hospital" },
			],
			defaults: filters.abroadPeople.status,
			callback: filtering,
		});
		filterContent.appendChild(statusFilter.element);

		const levelFilter = createFilterSection({
			title: "Level Filter",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.abroadPeople.levelStart,
				valueHigh: filters.abroadPeople.levelEnd,
			},
			callback: filtering,
		});
		filterContent.appendChild(levelFilter.element);
		content.appendChild(filterContent);

		await filtering();

		async function filtering() {
			await requireElement(".users-list > li");
			// Get the set filters
			const activity = activityFilter.getSelections(content);
			const faction = factionFilter.getSelected(content).trim();
			const special = specialFilter.getSelections(content);
			const status = statusFilter.getSelections(content);
			const levels = levelFilter.getStartEnd();
			const levelStart = parseInt(levels.start);
			const levelEnd = parseInt(levels.end);

			// Update level slider counter
			levelFilter.updateCounter(`Level ${levelStart} - ${levelEnd}`, content);

			// Save filters
			await ttStorage.change({
				filters: {
					abroadPeople: {
						activity: activity,
						faction: faction,
						special: special,
						status: status,
						levelStart: levelStart,
						levelEnd: levelEnd,
					},
				},
			});
			// Actual Filtering
			for (const li of document.findAll(".users-list > li")) {
				showRow(li);
				// Activity
				if (
					activity.length &&
					!activity.some(
						(x) =>
							x.trim() ===
							li
								.find("#iconTray li")
								.getAttribute("title")
								.match(/(?<=<b>).*(?=<\/b>)/g)[0]
								.toLowerCase()
								.trim()
					)
				) {
					hideRow(li);
					continue;
				}

				// Faction
				const rowFaction = li.find(".user.faction");
				const factionImg = rowFaction.find(":scope > img");
				if (faction && faction !== "No faction" && faction !== "Unknown faction") {
					if (
						!rowFaction.href || // No faction
						(rowFaction.href && factionImg && factionImg.src === "https://factiontags.torn.com/0-0.png") || // Unknown faction
						(rowFaction.href && factionImg && faction !== factionImg.getAttribute("title").trim())
					) {
						hideRow(li);
						continue;
					}
				} else if (faction === "No faction") {
					if (rowFaction.href) {
						// Not "No faction"
						hideRow(li);
						continue;
					}
				} else if (faction === "Unknown faction") {
					if (!factionImg || (factionImg && factionImg.src !== "https://factiontags.torn.com/0-0.png")) {
						// Not "Unknown faction"
						hideRow(li);
						continue;
					}
				}

				// Special
				for (const key in special) {
					const value = special[key];
					if (value === "both") continue;

					if (value === "yes") {
						let matchesOneIcon = false;
						for (const icon of SPECIAL_FILTER_ICONS[key]) {
							if (li.find(`li[id^='${icon}']`)) {
								matchesOneIcon = true;
								break;
							}
						}

						if (!matchesOneIcon) {
							hideRow(li);
							// noinspection UnnecessaryContinueJS
							continue;
						}
					} else if (value === "no") {
						let matchesOneIcon = false;
						for (const icon of SPECIAL_FILTER_ICONS[key]) {
							if (li.find(`li[id^='${icon}']`)) {
								matchesOneIcon = true;
								break;
							}
						}

						if (matchesOneIcon) {
							hideRow(li);
							// noinspection UnnecessaryContinueJS
							continue;
						}
					}
				}

				// Status
				let matches_one_status = status.length === 0;
				for (const state of status) {
					if (li.find(".status").innerText.replace("STATUS:", "").trim().toLowerCase() === state) {
						matches_one_status = true;
						break;
					}
				}
				if (!matches_one_status) {
					hideRow(li);
					continue;
				}

				// Level
				const level = parseInt(li.find(".level").innerText.replace(/\D+/g, ""));
				if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
					hideRow(li);
					// noinspection UnnecessaryContinueJS
					continue;
				}
			}

			function showRow(li) {
				li.classList.remove("hidden");
			}

			function hideRow(li) {
				li.classList.add("hidden");
			}

			statistics.updateStatistics(document.findAll(".users-list > li:not(.hidden)").length, document.findAll(".users-list > li").length, content);
		}
	}

	function getFactions() {
		const rows = [...document.findAll(".users-list > li .user.faction")];
		const _factions = new Set(
			rows[0].find("img")
				? rows
						.map((row) => row.find("img"))
						.filter((img) => !!img)
						.map((img) => img.getAttribute("title").trim())
						.filter((tag) => !!tag)
				: rows.map((row) => row.innerText.trim()).filter((tag) => !!tag)
		);

		const factions = [];
		for (const faction of _factions) {
			factions.push({ value: faction, description: faction });
		}
		return factions;
	}

	function removeFilters() {
		removeContainer("People Filter");
		document.findAll(".users-list > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
