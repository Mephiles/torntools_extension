requireDatabase().then(() => {
	requirePlayerList(".users-list").then(() => {
		console.log("TT - Jail");

		let list = doc.find(".users-list");
		let title = list.previousElementSibling;

		addFilterToTable(list, title);

		if (shouldDisable()) return;

		showQuick();
	});
});

function addFilterToTable(list, title) {
	let filter_container = content.newContainer("Filters", { id: "tt-player-filter", class: "filter-container", next_element: title }).find(".content");
	filter_container.innerHTML = `
        <div class="filter-header">
            <div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">Y</span> users</div>
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
            <div class="filter-wrap" id="faction-filter">
                <div class="filter-heading">Faction</div>
                <select name="faction" id="tt-faction-filter">
                    <option selected value="">none</option>
                </select>
            </div>
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
            <div class="filter-wrap" id="score-filter" style="width: 140px">
                <div class="filter-heading">Score</div>
                <div id="tt-score-filter" class="filter-slider tt-small-pips"></div>
                <div class="filter-slider-info" style="padding-top: 10px; position: relative; top: 10px;"></div>
            </div>
        </div>
    `;

	// Initializing
	let time_start = filters.jail.time[0] || 0;
	let time_end = filters.jail.time[1] || 100;
	let level_start = filters.jail.level[0] || 0;
	let level_end = filters.jail.level[1] || 100;
	// let score_start = filters.jail.score[0] || 0;
	let score_end = filters.jail.score[0] || 250000;

	for (let faction of filters.preset_data.factions.data) {
		let option = doc.new({ type: "option", value: faction, text: faction });
		if (faction === filters.preset_data.factions.default) option.selected = true;

		filter_container.find("#tt-faction-filter").appendChild(option);
	}
	let divider_option = doc.new({ type: "option", value: "----------", text: "----------", attributes: { disabled: true } });
	filter_container.find("#tt-faction-filter").appendChild(divider_option);

	// Time slider
	let time_slider = filter_container.find("#tt-time-filter");
	noUiSlider.create(time_slider, {
		start: [time_start, time_end],
		step: 1,
		connect: true,
		range: { min: 0, max: 100 },
	});

	let time_slider_info = time_slider.nextElementSibling;
	time_slider.noUiSlider.on("update", (values) => {
		values = values.map((x) => timeUntil(parseFloat(x) * 60 * 60 * 1000, { max_unit: "h", hide_nulls: true }));
		time_slider_info.innerHTML = `Time: ${values.join(" - ")}`;
	});

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

	// Score slider
	let score_slider = filter_container.find("#tt-score-filter");
	noUiSlider.create(score_slider, {
		start: score_end,
		step: 500,
		range: {
			min: [0],
			"70%": [150000],
			max: [250000],
		},
		pips: {
			mode: "range",
			density: 5,
			format: {
				from: (x) => x,
				to: (x) => numberWithCommas(x, false),
			},
		},
	});

	let score_slider_info = score_slider.nextElementSibling;
	score_slider.noUiSlider.on("update", (values) => {
		values = values.map((x) => numberWithCommas(parseInt(x), false));
		score_slider_info.innerHTML = `Max Score: ${values.join(" - ")}`;
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
					populateFactions();
					applyFilters();

					showQuick();
				});
			}, 300);
		}
	});

	// Initializing
	for (let state of filters.jail.activity) {
		doc.find(`#activity-filter input[value='${state}']`).checked = true;
	}
	if (filters.jail.faction.default) {
		doc.find(`#faction-filter option[value='${filters.jail.faction}']`).selected = true;
	}

	populateFactions();
	applyFilters();

	function applyFilters() {
		let activity = [];
		let faction;
		let time = [];
		let level = [];
		let score = [];

		// Activity
		for (let checkbox of doc.findAll("#activity-filter .tt-checkbox-wrap input:checked")) {
			activity.push(checkbox.getAttribute("value"));
		}
		// Faction
		faction = doc.find("#faction-filter select option:checked").value;
		// Time
		time.push(parseInt(doc.find("#time-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
		time.push(parseInt(doc.find("#time-filter .noUi-handle-upper").getAttribute("aria-valuenow")));
		// Level
		level.push(parseInt(doc.find("#level-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
		level.push(parseInt(doc.find("#level-filter .noUi-handle-upper").getAttribute("aria-valuenow")));
		// Score
		score.push(parseInt(doc.find("#score-filter .noUi-handle-lower").getAttribute("aria-valuenow")));

		// console.log("Activity", activity);
		// console.log("Faction", faction);
		// console.log("Time", time);
		// console.log("Level", level);

		// Filtering
		for (let li of list.findAll(":scope > li")) {
			li.classList.remove("filter-hidden");
			if (li.classList.contains("tt-user-info")) {
				continue;
			} else if (li.nextElementSibling && li.nextElementSibling.classList.contains("tt-user-info")) {
				li.nextElementSibling.classList.remove("filter-hidden");
			}

			// Level
			let player_level = parseInt(li.find(".level").innerText.trim().replace("Level", "").replace("LEVEL", "").replace(":", "").trim());
			if (!(level[0] <= player_level && player_level <= level[1])) {
				li.classList.add("filter-hidden");
				continue;
			}

			// Time
			let player_time =
				toSeconds(li.find(".time").innerText.trim().replace("Time", "").replace("TIME", "").replace(":", "").replace("left:", "").trim()) / 60 / 60; // to hours
			if (!(time[0] <= player_time && player_time <= time[1])) {
				li.classList.add("filter-hidden");
				continue;
			}

			// Score
			let player_score =
				(player_level *
					toSeconds(li.find(".time").innerText.trim().replace("Time", "").replace("TIME", "").replace(":", "").replace("left:", "").trim())) /
				60; // to minutes
			if (player_score > score[0]) {
				li.classList.add("filter-hidden");
				continue;
			}

			// Activity
			let matches_one_activity = activity.length === 0;
			for (let state of activity) {
				if (li.querySelector(`li[id^='${ACTIVITY_FILTER_DICT[state]}']`)) {
					matches_one_activity = true;
				}
			}
			if (!matches_one_activity) {
				li.classList.add("filter-hidden");
				continue;
			}

			// Faction
			if (faction !== "" && !li.find(`img[title='${faction}']`) && li.find(`a.user.faction`).innerText !== faction) {
				li.classList.add("filter-hidden");
			}
		}

		ttStorage.change({ filters: { jail: { activity, faction, time, level, score } } });

		updateStatistics();
	}

	function updateStatistics() {
		doc.find(".statistic#showing .filter-count").innerText = [...list.findAll(":scope>li")].filter((x) => !x.classList.contains("filter-hidden")).length;
		doc.find(".statistic#showing .filter-total").innerText = [...list.findAll(":scope>li")].length;
	}

	function populateFactions() {
		let faction_tags = [...list.findAll(":scope>li")]
			.map((x) => (x.find(".user.faction img") ? x.find(".user.faction img").getAttribute("title") : x.find("a.user.faction").innerText))
			.filter((x) => x.trim() !== "");

		for (let tag of faction_tags) {
			if (filter_container.find(`#tt-faction-filter option[value='${tag}']`)) continue;

			let option = doc.new({ type: "option", value: tag, text: tag });
			filter_container.find("#tt-faction-filter").appendChild(option);
		}
	}
}

function showQuick() {
	show("tt-quick-bust", "Bust", "quick_bust", ".bust");
	show("tt-quick-bail", "Bail", "quick_bail", ".buy, .bye");

	function show(id, text, option, wrapSelector) {
		if (!doc.find(`#${id}`)) {
			let wrap = doc.new({ type: "div", class: "tt-checkbox-wrap in-title" });
			let checkbox = doc.new({ type: "input", id, attributes: { type: "checkbox" } });
			wrap.appendChild(checkbox);
			wrap.appendChild(doc.new({ type: "label", text: `Enable Quick ${text}`, attributes: { for: id } }));
			doc.find("#tt-player-filter .tt-options").appendChild(wrap);

			wrap.onclick = (event) => {
				event.stopPropagation();
			};

			checkbox.onchange = (event) => {
				modify(event.target.checked);

				ttStorage.change({ settings: { pages: { jail: { [option]: event.target.checked } } } });
			};

			if (settings.pages.jail[option]) {
				checkbox.checked = true;
				modify(true);
			}
		} else if (doc.find(`#${id}`).checked) {
			modify(true);
		}

		function modify(enabled) {
			for (let player of doc.findAll(".users-list > li")) {
				const actionWrap = player.find(wrapSelector);
				let bail = actionWrap.getAttribute("href");

				if (enabled) {
					if (bail[bail.length - 1] !== "1") bail += "1";

					if (!actionWrap.find(".tt-modified-icon")) {
						actionWrap.find(":scope > span[class$='-icon']").appendChild(doc.new({ type: "span", class: "tt-modified-icon", text: "Q" }));
					}
				} else {
					if (bail[bail.length - 1] === "1") bail = bail.slice(0, bail.length - 1);

					for (let icon of actionWrap.findAll(".tt-modified-icon")) icon.remove();
				}

				actionWrap.setAttribute("href", bail);
			}
		}
	}
}
