requireDatabase().then(() => {
	console.log("TT - Competition");

	addXHRListener((event) => {
		const { page, uri, xhr } = event.detail;
		if (page !== "competition") return;

		const params = getHashParameters();

		if (params.get("p") === "team") {
			listLoaded().then(loadTeamPage);
		}
	});

	if (getHashParameters().get("p") === "team") {
		listLoaded().then(loadTeamPage);
	}
});

function listLoaded() {
	return requireElement(".competition-list");
}

function loadTeamPage() {
	let list = doc.find(".competition-list");
	let title = list.previousElementSibling;

	addFilter(list, title);
	if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.competition) showStatsEstimates();
}

function showStatsEstimates() {
	estimateStatsInList("ul.competition-list > li:not(.tt-userinfo-container)", (row) => {
		return {
			userId: (row.find("a.user.name").getAttribute("data-placeholder") || row.find("a.user.name > span").getAttribute("title")).match(
				/.* \[([0-9]*)]/i
			)[1],
			level: parseInt(row.find(".level").innerText),
		};
	});
}

function addFilter(list, title) {
	if (doc.find("#tt-player-filter")) return;

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
			<div class='filter-wrap' id='special-filter'>
				<div class='filter-heading'>Special</div>
				<div class='filter-multi-wrap ${mobile ? "tt-mobile" : ""}'>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='isfedded-yes'>N:<input type='checkbox' value='isfedded-no'>Fedded</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='newplayer-yes'>N:<input type='checkbox' value='newplayer-no'>New Player</div>
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
	let level_start = filters.competition.level[0] || 0;
	let level_end = filters.competition.level[1] || 100;

	// Special
	for (let key in filters.competition.special) {
		switch (filters.competition.special[key]) {
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
		range: {
			min: 0,
			max: 100,
		},
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
				requirePlayerList(".users-list").then(() => {
					console.log("loaded");
					applyFilters();
				});
			}, 300);
		}
	});

	applyFilters();

	function applyFilters() {
		let special = {};
		let level = [];

		// Special
		for (let key in filters.competition.special) {
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

		// Level
		level.push(parseInt(doc.find("#level-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
		level.push(parseInt(doc.find("#level-filter .noUi-handle-upper").getAttribute("aria-valuenow")));

		// Filtering
		for (let li of list.findAll(":scope > li:not(.tt-userinfo-container)")) {
			showRow(li);

			// Level
			let player_level = parseInt(li.find(".level").innerText.trim());
			if (!(level[0] <= player_level && player_level <= level[1])) {
				showRow(li, false);
				continue;
			}

			// Special
			for (let key in special) {
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

		ttStorage.change({
			filters: {
				competition: {
					special: special,
					level: level,
				},
			},
		});

		updateStatistics();
	}

	function showRow(row, show = true) {
		if (show) {
			row.classList.remove("filter-hidden");
			if (
				row.nextElementSibling &&
				(row.nextElementSibling.classList.contains("tt-user-info") || row.nextElementSibling.classList.contains("tt-userinfo-container"))
			) {
				row.nextElementSibling.classList.remove("filter-hidden");
			}
		} else {
			row.classList.add("filter-hidden");
			if (
				row.nextElementSibling &&
				(row.nextElementSibling.classList.contains("tt-user-info") || row.nextElementSibling.classList.contains("tt-userinfo-container"))
			) {
				row.nextElementSibling.classList.add("filter-hidden");
			}
		}
	}

	function updateStatistics() {
		const users = [...list.findAll(":scope > li:not(.tt-userinfo-container)")];

		doc.find(".statistic#showing .filter-count").innerText = users.filter((x) => !x.classList.contains("filter-hidden")).length;
		doc.find(".statistic#showing .filter-total").innerText = users.length;
	}
}
