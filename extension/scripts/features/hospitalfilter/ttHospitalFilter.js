"use strict";

(async () => {
	featureManager.registerFeature(
		"Hospital Filters",
		"hospital",
		() => settings.pages.hospital.filter,
		null,
		addFilterAndFilter,
		removeFilters,
		{
			storage: ["settings.pages.hospital.filter"],
		},
		async () => {
			await requireElement(".userlist-wrapper.hospital-list-wrapper .users-list .time");
		}
	);

	function addFilterAndFilter() {
		let filterContent = createContainer("Hospital Filter", {
			nextElement: document.find(".users-list-title"),
		}).content;
		filterContent.innerHTML = `
			<div class="filter-header">
				<div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">50</span> users</div>
			</div>
			<div class="filter-content ${mobile ? "tt-mobile" : ""}">
				<div class="filter-wrap" id="activity-filter">
					<div class="filter-heading">Activity</div>
					<div class="filter-multi-wrap ${mobile ? "tt-mobile" : ""}">
						<div class="tt-checkbox-wrap"><input type="checkbox" value="online">Online</div>
						<div class="tt-checkbox-wrap"><input type="checkbox" value="idle">Idle</div>
						<div class="tt-checkbox-wrap"><input type="checkbox" value="offline">Offline</div>
					</div>
				</div>
				<div class="filter-wrap" id="revive-filter">
					<div class="filter-heading">Revives</div>
					<div class="filter-multi-wrap ">
						<div class="tt-checkbox-wrap"><input type="checkbox" value="revives-enabled">Enabled</div>
					</div>
				</div>
				<div class="filter-wrap" id="faction-filter">
					<div class="filter-heading">Faction</div>
					<select name="faction" id="tt-faction-filter">
						<option selected value="">none</option>
						<option disabled value="------">------</option>
					</select>
				</div>
			</div>
			`;
			/*
				<div class="filter-wrap" id="time-filter">
					<div class="filter-heading">Time</div>
					<div id="tt-time-filter" class="filter-slider"></div>
					<div class="filter-slider-info"></div>
				</div>
				<div class="filter-wrap" id="level-filter">
					<div class="filter-heading">Level</div>
					<div id="tt-level-filter" class="filter-slider"></div>
					<div class="filter-slider-info"></div>
				</div>
    	;*/
		const timeFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "time-filter",
			children: [
				newSlider(),
				document.newElement({type: "div", class: "time-filter-info"})
			]
		});
		const levelFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "level-filter",
			children: [
				newSlider(),
				document.newElement({type: "div", class: "level-filter-info"})
			]
		});
		filterContent.find(".filter-content").appendChild(timeFilter);
		filterContent.find(".filter-content").appendChild(levelFilter);

		// Set up the filters
		for (const activity of filters.hospital.activity) {
			filterContent.find(`#activity-filter [value="${activity}"]`).checked = true;
		}
		if (filters.hospital.revivesOn) filterContent.find("#revive-filter input[type='checkbox']").checked = true;
		// There is no faction filter setup
		timeFilter.find("input#lower").value = filters.hospital.timeStart;
		timeFilter.find("input#upper").value = filters.hospital.timeEnd;
		levelFilter.find("input#lower").value = filters.hospital.levelStart;
		levelFilter.find("input#upper").value = filters.hospital.levelEnd;

		// Listeners
		filterContent.findAll("input[type='checkbox']").forEach((x) => x.addEventListener("click", filtering))
		filterContent.findAll("#faction-filter select, input#lower, input#upper").forEach((x) => x.addEventListener("change", filtering));

		addFacsToList();
		filtering();
		async function filtering() {
			// Get the set filters
			let activity = [];
			for (const checkbox of filterContent.findAll("#activity-filter input")) {
				if (checkbox.checked) activity.push(checkbox.getAttribute("value"));
			}
			const revivesOn = filterContent.find("#revive-filter input").checked;
			const faction = filterContent.find("#faction-filter select option:checked").value;
			const timeStart = parseInt(timeFilter.find("input#lower").value);
			const timeEnd = parseInt(timeFilter.find("input#upper").value);
			const levelStart = parseInt(levelFilter.find("input#lower").value);
			const levelEnd = parseInt(levelFilter.find("input#upper").value);
			// Update level and time slider counters
			filterContent.find(".level-filter-info").innerText = `Level ${levelStart} - ${levelEnd}`;
			filterContent.find(".time-filter-info").innerText = `Time ${timeStart}h - ${timeEnd}h`;
			// Save filters
			await ttStorage.change({
				filters: {
					hospital: {
						timeStart: timeStart,
						timeEnd: timeEnd,
						levelStart: levelStart,
						levelEnd: levelEnd,
						faction: faction,
						activity: activity,
						revivesOn: revivesOn,
					}
				}
			});
			// Actual Filtering
			for (const li of document.findAll(".users-list > li")) {
				// Activity
				if (
					activity.length &&
					!activity.some(
						(x) => x.trim() === li.find("#iconTray li").getAttribute("title").replace(/^<b>/g, "").replace(/<\/b>$/g, "").toLowerCase().trim()
					)
				) {
					showRow(li, false);
					continue;
				}
				// Revives On
				if (revivesOn && li.find(".revive").classList.contains("reviveNotAvailable")) {
					showRow(li, false);
					continue;
				}
				// Faction
				if (faction && li.find(".user.faction img") && li.find(".user.faction img").getAttribute("title").trim() !== faction.trim()) {
					showRow(li, false);
					continue;
				}
				// Time
				const timeLeftHrs = li.find(".info-wrap .time").lastChild.textContent.trim().split(" ")[0].replace(/[hs]/g, "");
				if ((timeStart && timeLeftHrs < timeStart) || (timeEnd !== 100 && timeLeftHrs > timeEnd)) {
					showRow(li, false);
					continue;
				}
				// Level
				const level = parseInt(li.find(".info-wrap .level").innerText.replace(/\D+/g, ""));
				if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
					showRow(li, false);
					continue;
				}
				showRow(li);
			}

			function showRow(li, show = true) {
				if (show) li.classList && li.classList.remove("hidden");
				else li.classList && li.classList.add("hidden");
			}
			updateStat();
		}
		function addFacsToList() {
			let facs = [];
			document.findAll(".users-list > li .user.faction img:not([alt=''])").forEach((x) => facs.push(x.getAttribute("title")));
			facs = [...new Set(facs)];
			for (const fac of facs) {
				document.find("#faction-filter select").appendChild(document.newElement({ type: "option", value: fac, text: fac }));
			}
		}
		function updateStat() {
			document.find(".filter-count").innerText = document.findAll(".users-list > li:not(.hidden)").length;
		}
	}
	function removeFilters() {
		removeContainer("Hospital Filter");
		document.findAll(".users-list > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}
})();
