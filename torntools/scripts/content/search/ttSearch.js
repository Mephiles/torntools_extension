requireDatabase().then(() => {
	if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.userlist) {
		addXHRListener((event) => {
			const { page, json, xhr } = event.detail;
			if (page !== "page" || !json || !json.success) return;

			const params = new URLSearchParams(xhr.requestBody);
			if (params.get("sid") !== "UserListAjax") return;

			searchLoaded().then(showStatsEstimates);
		});
	}

	searchLoaded().then(async () => {
		console.log("TT - Search");

		if (personalized.mass_messages) {
			console.log("Mass Messages");
			massMessages();
		}

		// Add filter
		let list = doc.find(".user-info-list-wrap");
		let title = list.previousElementSibling;

		addFilterToTable(list, title);

		if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.userlist) showStatsEstimates();
	});
});

function searchLoaded() {
	return requireElement("ul.user-info-list-wrap li:not(.last)");
}

function massMessages(theme) {
	let container = content
		.newContainer("Search", {
			first: true,
			theme: theme,
			id: "ttSearchContainer",
		})
		.find(".content");

	let add_all_to_list = doc.new({ type: "div", id: "tt-add-all-to-mm-list", text: "Add all to List" });
	container.appendChild(add_all_to_list);

	add_all_to_list.addEventListener("click", () => {
		let list = [];

		for (let li of doc.findAll("ul.user-info-list-wrap>li:not(.last)")) {
			let user = li.find("a.user.name").getAttribute("data-placeholder") || li.find("a.user.name>span").getAttribute("title");
			list.push(user);
		}

		console.log("LIST", list);
		ttStorage.get("mass_messages", (mass_messages) => {
			mass_messages.list = [...mass_messages.list, ...list];
			ttStorage.set({ mass_messages });
		});
	});
}

function addFilterToTable(list, title) {
	let filter_container = content
		.newContainer("Filters", {
			id: "tt-player-filter",
			class: "filter-container",
			next_element: title,
		})
		.find(".content");

	filter_container.innerHTML = `
        <div class="filter-header">
            <div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">Y</span> users</div>
        </div>
        <div class="filter-content ${mobile ? "tt-mobile" : ""}">
            <div class="filter-wrap" id="activity-filter">
                <div class="filter-heading">Activity</div>
                <div class="filter-multi-wrap">
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="online">Online</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="idle">Idle</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="offline">Offline</div>
                </div>
            </div>
			<div class='filter-wrap' id='special-filter'>
				<div class='filter-heading'>Special</div>
				<div class='filter-multi-wrap ${mobile ? "tt-mobile" : ""}'>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='isfedded-yes'>N:<input type='checkbox' value='isfedded-no'>Fedded</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='traveling-yes'>N:<input type='checkbox' value='traveling-no'>Traveling</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='newplayer-yes'>N:<input type='checkbox' value='newplayer-no'>New Player</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='onwall-yes'>N:<input type='checkbox' value='onwall-no'>On Wall</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='incompany-yes'>N:<input type='checkbox' value='incompany-no'>In Company</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='infaction-yes'>N:<input type='checkbox' value='infaction-no'>In Faction</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='isdonator-yes'>N:<input type='checkbox' value='isdonator-no'>Is Donator</div>
				</div>
			</div>
            <div class="filter-wrap" id="level-filter">
                <div class="filter-heading">Level</div>
                <div id="tt-level-filter" class="filter-slider"></div>
                <div class="filter-slider-info"></div>
            </div>
        </div>
    `;

	// Initializing
	// let time_start = filters.user_list.time[0] || 0;
	// let time_end = filters.user_list.time[1] || 100;
	let level_start = filters.user_list.level[0] || 0;
	let level_end = filters.user_list.level[1] || 100;

	// for(let faction of filters.preset_data.factions.data){
	//     let option = doc.new({type: "option", value: faction, text: faction});
	//     if(faction == filters.preset_data.factions.default) option.selected = true;

	//     filter_container.find("#tt-faction-filter").appendChild(option);
	// }
	// let divider_option = doc.new({type: "option", value: "----------", text: "----------", attributes: {disabled: true}});
	// filter_container.find("#tt-faction-filter").appendChild(divider_option);

	// Time slider
	// let time_slider = filter_container.find('#tt-time-filter');
	// noUiSlider.create(time_slider, {
	//     start: [time_start, time_end],
	//     step: 1,
	//     connect: true,
	//     range: {
	//         'min': 0,
	//         'max': 100
	//     }
	// });

	// let time_slider_info = time_slider.nextElementSibling;
	// time_slider.noUiSlider.on('update', function (values) {
	//     values = values.map(x => (time_until(parseFloat(x)*60*60*1000, {max_unit: "h", hide_nulls: true})));
	//     time_slider_info.innerHTML = `Time: ${values.join(' - ')}`;
	// });

	// Special
	for (let key in filters.user_list.special) {
		switch (filters.user_list.special[key]) {
			case "yes":
				filter_container.find(`#special-filter input[value='${key}-yes']`).checked = true;
				break;
			case "no":
				filter_container.find(`#special-filter input[value='${key}-no']`).checked = true;
				break;
			case "both":
				filter_container.find(`#special-filter input[value='${key}-yes']`).checked = true;
				filter_container.find(`#special-filter input[value='${key}-no']`).checked = true;
				break;
			default:
				filter_container.find(`#special-filter input[value='${key}-yes']`).checked = true;
				filter_container.find(`#special-filter input[value='${key}-no']`).checked = true;
				break;
		}
	}

	// Level slider
	let level_slider = filter_container.find("#tt-level-filter");
	noUiSlider.create(level_slider, {
		start: [level_start, level_end],
		step: 1,
		connect: true,
		range: { min: 0, max: 100 },
	});

	let level_slider_info = level_slider.nextElementSibling;
	level_slider.noUiSlider.on("update", (values) => {
		values = values.map((x) => parseInt(x));
		level_slider_info.innerHTML = `Level: ${values.join(" - ")}`;
	});

	// Event listeners
	for (let checkbox of filter_container.findAll(".tt-checkbox-wrap input")) {
		checkbox.onclick = applyFilters;
	}
	for (let dropdown of filter_container.findAll("select")) {
		dropdown.onchange = applyFilters;
	}
	let filter_observer = new MutationObserver((mutations) => {
		for (let mutation of mutations) {
			if (
				mutation.type === "attributes" &&
				mutation.target.classList &&
				mutation.attributeName === "aria-valuenow" &&
				(mutation.target.classList.contains("noUi-handle-lower") || mutation.target.classList.contains("noUi-handle-upper"))
			) {
				applyFilters();
			}
		}
	});
	filter_observer.observe(filter_container, { attributes: true, subtree: true });

	// Page changing
	doc.addEventListener("click", (event) => {
		if (event.target.classList && !event.target.classList.contains("gallery-wrapper") && hasParent(event.target, { class: "gallery-wrapper" })) {
			console.log("click");
			setTimeout(() => {
				requirePlayerList(".user-info-list-wrap").then(() => {
					console.log("loaded");
					// populateFactions();
					applyFilters();
				});
			}, 300);
		}
	});

	// Initializing
	for (let state of filters.user_list.activity) {
		doc.find(`#activity-filter input[value='${state}']`).checked = true;
	}
	// if(filters.user_list.faction.default){
	//     doc.find(`#faction-filter option[value='${filters.user_list.faction}']`).selected = true;
	// }

	// populateFactions();
	applyFilters();

	function applyFilters() {
		let activity = [];
		let special = {};
		// let faction = ``;
		// let time = []
		let level = [];

		// Activity
		for (let checkbox of doc.findAll("#activity-filter .tt-checkbox-wrap input:checked")) {
			activity.push(checkbox.getAttribute("value"));
		}
		// Special
		for (let key in filters.user_list.special) {
			if (
				doc.find(`#tt-player-filter #special-filter input[value='${key}-yes']`).checked &&
				doc.find(`#tt-player-filter #special-filter input[value='${key}-no']`).checked
			) {
				special[key] = "both";
			} else if (doc.find(`#tt-player-filter #special-filter input[value='${key}-yes']`).checked) {
				special[key] = "yes";
			} else if (doc.find(`#tt-player-filter #special-filter input[value='${key}-no']`).checked) {
				special[key] = "no";
			} else {
				special[key] = "both";
			}
		}
		// Faction
		// faction = doc.find("#faction-filter select option:checked").value;
		// Time
		// time.push(parseInt(doc.find("#time-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
		// time.push(parseInt(doc.find("#time-filter .noUi-handle-upper").getAttribute("aria-valuenow")));
		// Level
		level.push(parseInt(doc.find("#level-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
		level.push(parseInt(doc.find("#level-filter .noUi-handle-upper").getAttribute("aria-valuenow")));

		// console.log("Activity", activity);
		// console.log("Faction", faction);
		// console.log("Time", time);
		// console.log("Level", level);

		// Filtering
		for (let li of list.findAll(":scope > li")) {
			if (li.classList.contains("tt-user-info") || li.classList.contains("tt-userinfo-container")) continue;

			showRow(li);

			// Level
			let player_level = parseInt(li.find(".level").innerText.trim().replace("Level", "").replace("LEVEL", "").replace(":", "").trim());
			if (!(level[0] <= player_level && player_level <= level[1])) {
				showRow(li, false);
				continue;
			}

			// Time
			// let player_time = toSeconds(li.find(".time").innerText.trim().replace("Time", "").replace("TIME", "").replace(":", "").replace("left:", "").trim())/60/60;
			// if(!(time[0] <= player_time && player_time <= time[1])){
			//     li.classList.add("filter-hidden");
			//     continue;
			// }

			// Activity
			let matches_one_activity = activity.length === 0;
			for (let state of activity) {
				if (li.find(`li[id^='${ACTIVITY_FILTER_DICT[state]}']`)) {
					matches_one_activity = true;
				}
			}
			if (!matches_one_activity) {
				showRow(li, false);
			}

			// Special
			for (let key in special) {
				console.log(key, special[key]);
				if (special[key] === "both") continue;

				if (special[key] === "yes") {
					let matchesOneIcon = false;
					for (let icon of SPECIAL_FILTER_DICT[key]) {
						if (li.querySelector(`li[id^='${icon}']`)) {
							matchesOneIcon = true;
							break;
						}
					}

					if (!matchesOneIcon) {
						showRow(li, false);
					}
				} else if (special[key] === "no") {
					let matchesOneIcon = false;
					for (let icon of SPECIAL_FILTER_DICT[key]) {
						if (li.querySelector(`li[id^='${icon}']`)) {
							matchesOneIcon = true;
							break;
						}
					}

					if (matchesOneIcon) {
						showRow(li, false);
					}
				}
			}
		}

		ttStorage.change({ filters: { user_list: { activity, special, level } } });

		updateStatistics();
	}

	function showRow(row, show = true) {
		if (show) {
			row.classList.remove("filter-hidden");
			if (
				row.nextElementSibling &&
				(row.nextElementSibling.classList.contains("tt-user-info") || row.nextElementSibling.classList.contains("tt-userinfo-container"))
			)
				row.nextElementSibling.classList.remove("filter-hidden");
		} else {
			row.classList.add("filter-hidden");
			if (
				row.nextElementSibling &&
				(row.nextElementSibling.classList.contains("tt-user-info") || row.nextElementSibling.classList.contains("tt-userinfo-container"))
			)
				row.nextElementSibling.classList.add("filter-hidden");
		}
	}

	function updateStatistics() {
		doc.find(".statistic#showing .filter-count").innerText = [...list.findAll(":scope>li")].filter((x) => !x.classList.contains("filter-hidden")).length;
		doc.find(".statistic#showing .filter-total").innerText = [...list.findAll(":scope>li")].length;
	}
}

function showStatsEstimates() {
	doc.find(".user-info-list-wrap").classList.add("tt-info-wrap");

	estimateStatsInList("ul.user-info-list-wrap > li:not(.last)", (row) => {
		return {
			userId: (row.find("a.user.name").getAttribute("data-placeholder") || row.find("a.user.name > span").getAttribute("title")).match(
				/.* \[([0-9]*)]/i
			)[1],
			level: parseInt(row.find(".level .value").innerText),
		};
	});
}
