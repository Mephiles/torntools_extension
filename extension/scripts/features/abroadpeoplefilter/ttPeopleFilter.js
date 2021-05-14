"use strict";

(async () => {
	featureManager.registerFeature(
		"People Filter",
		"travel",
		() => settings.pages.travel.peopleFilter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.travel.peopleFilter"],
		},
		null
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.PEOPLE_SWITCH_PAGE].push(filtering);
	}

	async function addFilters() {
		await requireElement(".users-list");

		const { content } = createContainer("People Filter", {
			nextElement: document.find(".users-list-title"),
		});
		content.innerHTML = `
			<div class="filter-header">
				<div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">${
					document.findAll(".users-list > *").length
				}</span> users</div>
			</div>
			<div class="filter-content">
				<div class="filter-wrap" id="activity-filter">
					<div class="filter-heading">Activity</div>
					<div class="filter-multi-wrap">
						<div class="tt-checkbox-wrap">
							<input type="checkbox" value="online" id="tt-people-filter-online">
							<label for="tt-people-filter-online">Online</label>
						</div>
						<div class="tt-checkbox-wrap">
							<input type="checkbox" value="idle" id="tt-people-filter-idle">
							<label for="tt-people-filter-idle">Idle</label>
						</div>
						<div class="tt-checkbox-wrap">
							<input type="checkbox" value="offline" id="tt-people-filter-offline">
							<label for="tt-people-filter-offline">Offline</label>
						</div>
					</div>
				</div>
				<div class="filter-wrap">
					<div class="filter-heading">Faction</div>
					<div class="filter-multi-wrap">
						<select name="faction" id="tt-faction-filter">
							<option selected value="">none</option>
							<option disabled value="------">------</option>
						</select>
					</div>
				</div>
				<div class='filter-wrap'>
					<div class='filter-heading'>Special</div>
					<div class="filter-multi-wrap">
						<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='newplayer-yes'>N:<input type='checkbox' value='newplayer-no'>New Player</div>
						<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='incompany-yes'>N:<input type='checkbox' value='incompany-no'>In Company</div>
						<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='infaction-yes'>N:<input type='checkbox' value='infaction-no'>In Faction</div>
						<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='isdonator-yes'>N:<input type='checkbox' value='isdonator-no'>Is Donator</div>
					</div>
				</div>
				<div class="filter-wrap" id="status-filter">
					<div class="filter-heading">Status</div>
					<div class="filter-multi-wrap">
						<div class="tt-checkbox-wrap">
							<input type="checkbox" id="status-okay" value="okay">
							<label for="status-okay">Okay</label>
						</div>
						<div class="tt-checkbox-wrap">
							<input type="checkbox" id="status-hospital" value="hospital">
							<label for="status-hospital">Hospital</label>
						</div>
					</div>
				</div>
			</div>
		`;
		if (hasAPIData() && Object.keys(userdata) && userdata.faction && userdata.faction.faction_tag)
			content.find("#tt-faction-filter").appendChild(
				document.newElement({
					type: "option",
					text: userdata.faction.faction_tag,
					attributes: {
						value: userdata.faction.faction_tag,
					},
				})
			);
		const levelFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "level-filter",
			children: [
				newSlider(),
				document.newElement({
					type: "div",
					class: "level-filter-info-wrap",
					children: [document.newElement({ type: "span", class: "level-filter-info" })],
				}),
			],
		});
		content.find(".filter-content").appendChild(levelFilter);

		// Set up the filters
		for (const activity of filters.abroad.activity) {
			content.find(`#activity-filter [value="${activity}"]`).checked = true;
		}
		// There is no faction filter setup
		for (const specialFilter in filters.abroad.special) {
			const value = filters.abroad.special[specialFilter];
			const yesCheckBox = content.find(`[value="${specialFilter}-yes"]`);
			const noCheckbox = content.find(`[value="${specialFilter}-no"]`);
			if (value === "both") {
				yesCheckBox.checked = true;
				noCheckbox.checked = true;
			} else if (value === "yes") {
				yesCheckBox.checked = true;
			} else if (value === "no") {
				noCheckbox.checked = true;
			}
		}
		for (const status of filters.abroad.status) {
			content.find(`#status-${status}`).checked = true;
		}
		levelFilter.find(".handle.left").dataset.value = filters.abroad.levelStart;
		levelFilter.find(".handle.right").dataset.value = filters.abroad.levelEnd;
		levelFilter.find(".tt-dual-range").style.setProperty("--x-1", (filters.abroad.levelStart * 150) / 100 - 13 + "px");
		levelFilter.find(".tt-dual-range").style.setProperty("--x-2", (filters.abroad.levelEnd * 150) / 100 - 13 + "px");

		// Listeners
		content.findAll("input[type='checkbox']").forEach((x) => x.addEventListener("click", filtering));
		content.find("#tt-faction-filter").addEventListener("input", filtering);
		content.findAll(".handle.left, .handle.right").forEach((x) => new MutationObserver(filtering).observe(x, { attributes: true }));

		addFactionsToList();
		filtering();
	}

	function filtering() {
		requireElement(".users-list > li").then(async () => {
			const content = findContainer("People Filter").find(".filter-content");
			const levelFilter = content.find("#level-filter");
			// Get the set filters
			let activity = [];
			for (const checkbox of content.findAll("#activity-filter input:checked")) {
				activity.push(checkbox.getAttribute("value"));
			}
			const faction = content.find("#tt-faction-filter").value;
			let special = {};
			for (const specialFilter of ["newplayer", "incompany", "infaction", "isdonator"]) {
				const yesChecked = content.find(`[value="${specialFilter}-yes"`).checked;
				const noChecked = content.find(`[value="${specialFilter}-no"`).checked;
				if ((yesChecked && noChecked) || (!yesChecked && !noChecked)) {
					special[specialFilter] = "both";
				} else if (yesChecked && !noChecked) {
					special[specialFilter] = "yes";
				} else if (!yesChecked && noChecked) {
					special[specialFilter] = "no";
				}
			}
			let status = [];
			for (const checkbox of content.findAll("#status-filter input:checked")) {
				status.push(checkbox.getAttribute("value"));
			}
			const levelStart = parseInt(levelFilter.find(".handle.left").dataset.value);
			const levelEnd = parseInt(levelFilter.find(".handle.right").dataset.value);
			// Update level and time slider counters
			content.find(".level-filter-info").innerText = `Level ${levelStart} - ${levelEnd}`;
			// Save filters
			await ttStorage.change({
				filters: {
					abroad: {
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
					showRow(li, false);
					continue;
				}

				// Faction
				const rowFaction = li.find(".faction");
				if (
					faction &&
					((rowFaction.childElementCount === 0 && rowFaction.innerText.trim() !== faction.trim()) ||
						(rowFaction.childElementCount !== 0 &&
							rowFaction.find("img") &&
							rowFaction.find("img").getAttribute("title").trim() !== faction.trim()))
				) {
					showRow(li, false);
					continue;
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
							showRow(li, false);
							continue;
						}
					} else if (value === "no") {
						let matchesOneIcon = false;
						for (let icon of SPECIAL_FILTER_ICONS[key]) {
							if (li.find(`li[id^='${icon}']`)) {
								matchesOneIcon = true;
								break;
							}
						}

						if (matchesOneIcon) {
							showRow(li, false);
							continue;
						}
					}
				}

				// Status
				let matches_one_status = status.length === 0;
				for (let state of status) {
					if (li.find(".status").innerText.replace("STATUS:", "").trim().toLowerCase() === state) {
						matches_one_status = true;
						break;
					}
				}
				if (!matches_one_status) {
					showRow(li, false);
					continue;
				}

				// Level
				const level = parseInt(li.find(".level").innerText.replace(/\D+/g, ""));
				if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
					showRow(li, false);
					continue;
				}
			}

			function showRow(li, show = true) {
				if (!li.classList) return;
				if (show) li.classList.remove("hidden");
				else li.classList.add("hidden");
			}
			updateStat();
		});
	}

	function addFactionsToList() {
		const content = findContainer("People Filter").find(".filter-content");
		const rows = [...document.findAll(".users-list > li .user.faction")];
		const factions = new Set(
			rows[0].find("img")
				? rows
						.map((row) => row.find("img"))
						.filter((img) => !!img)
						.map((img) => img.getAttribute("title").trim())
						.filter((tag) => !!tag)
				: rows.map((row) => row.innerText.trim()).filter((tag) => !!tag)
		);

		for (const fac of factions) {
			content.find("#tt-faction-filter").appendChild(document.newElement({ type: "option", value: fac, text: fac }));
		}
	}

	function updateStat() {
		findContainer("People Filter").find(".filter-count").innerText = document.findAll(".users-list > li:not(.hidden)").length;
	}

	function removeFilters() {
		removeContainer("People Filter");
		document.findAll(".users-list > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
